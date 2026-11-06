"""Batches, classes, semesters, subjects with their teachers, and weekly timetables."""
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.schemas.batch import BatchCreate
from app.schemas.class_management import ClassCreate, ClassSectionCreate, ClassUpdate, SectionScheduleCreate
from app.services import batch_service
from app.services.agent.tools.common import ADMIN_ONLY
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.class_management import class_schedule_service, class_section_service, class_service
from app.services.class_management.common import class_code

MAX_BATCHES = 10
MAX_SLOTS = 14
DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _missing(label: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"{label} not found.")


async def _department(principal: Principal, department_id: str):
    found = await db.department.find_first(where={"id": department_id, "tenantId": principal.tenant_id})
    if not found:
        raise _missing("Department")
    return found


async def _class_group(principal: Principal, class_id: str):
    found = await db.studentgroup.find_first(where={"id": class_id, "tenantId": principal.tenant_id, "status": "ACTIVE"})
    if not found:
        raise _missing("Class")
    return found


class BatchesArgs(BaseModel):
    department_id: str = Field(description="From find_setup_items.")
    section: str = Field(pattern="^[A-Z]$", description="Section letter, for example A.")
    count: int = Field(1, ge=1, le=MAX_BATCHES, description="How many batches to add (A-1, A-2...).")


async def preview_batches(principal: Principal, args: BatchesArgs) -> Preview:
    department = await _department(principal, args.department_id)
    return Preview(f"Add {args.count} batch{'es' if args.count != 1 else ''} in section {args.section} of {department.name}",
                   {"note": "Batch numbers continue from the last one in this section."})


async def create_batches(principal: Principal, args: BatchesArgs) -> ToolResult:
    made = [await batch_service.create_batch(principal.tenant_id, args.department_id, BatchCreate(section=args.section)) for _ in range(args.count)]
    return ToolResult({"message": f"Added batches: {', '.join(b.code for b in made)}.", "batch_ids": [b.id for b in made]})


class ClassArgs(BaseModel):
    department_id: str
    batch_id: str = Field(description="From find_setup_items with kind batch.")
    semester_number: int = Field(ge=1, le=8)


async def preview_class(principal: Principal, args: ClassArgs) -> Preview:
    department = await _department(principal, args.department_id)
    batch = await db.batch.find_first(where={"id": args.batch_id, "tenantId": principal.tenant_id, "departmentId": department.id})
    if not batch or batch.status != "ACTIVE":
        raise _missing("Active batch")
    taken = await db.studentgroup.find_first(where={"tenantId": principal.tenant_id, "departmentId": department.id, "batch": batch.code, "status": "ACTIVE"})
    if taken:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Class {class_code(department.code, batch.code)} already exists.")
    waiting = len(await _unplaced_students(principal, batch.id))
    return Preview(f"Create class {class_code(department.code, batch.code)}, semester {args.semester_number}",
                   {"note": f"{waiting} student{'s' if waiting != 1 else ''} of this batch not yet in a class will join it."})


async def _unplaced_students(principal: Principal, batch_id: str) -> list[str]:
    """Students of the batch who are in no class yet, as the web form selects them."""
    students = await db.student.find_many(
        where={"tenantId": principal.tenant_id, "batchId": batch_id, "classMemberships": {"none": {"status": "ACTIVE"}}}
    )
    return [s.id for s in students]


async def create_class(principal: Principal, args: ClassArgs) -> ToolResult:
    detail = await class_service.create_class(principal.tenant_id, ClassCreate(
        department_id=args.department_id, batch_id=args.batch_id, semester_number=args.semester_number,
        student_ids=await _unplaced_students(principal, args.batch_id)))
    return ToolResult({"message": f"Created class {detail.code} with {detail.member_count} students.", "class_id": detail.id})


class SemesterArgs(BaseModel):
    class_id: str
    semester_number: int = Field(ge=1, le=8)


async def preview_semester(principal: Principal, args: SemesterArgs) -> Preview:
    group = await _class_group(principal, args.class_id)
    return Preview(f"Change {group.batch} from semester {group.semester} to {args.semester_number}",
                   {"note": "Every student in the class moves with it. There is no promotion step."})


async def set_semester(principal: Principal, args: SemesterArgs) -> ToolResult:
    detail = await class_service.update_class(principal.tenant_id, args.class_id, ClassUpdate(semester_number=args.semester_number))
    return ToolResult({"message": f"{detail.code} is now in semester {detail.semester_number}."})


class SubjectToClassArgs(BaseModel):
    class_id: str
    subject_id: str
    teacher_id: str = Field(description="From find_teachers.")
    room_id: Optional[str] = Field(None, description="Default room, optional.")


async def preview_subject_to_class(principal: Principal, args: SubjectToClassArgs) -> Preview:
    group = await _class_group(principal, args.class_id)
    subject = await db.subject.find_first(where={"id": args.subject_id, "tenantId": principal.tenant_id})
    teacher = await db.teacher.find_first(where={"id": args.teacher_id, "tenantId": principal.tenant_id})
    if not subject or not teacher:
        raise _missing("Subject or teacher")
    if await db.coursesection.find_first(where={"groupId": group.id, "subjectId": subject.id, "tenantId": principal.tenant_id}):
        raise HTTPException(status.HTTP_409_CONFLICT, f"{subject.name} is already in this class.")
    return Preview(f"Add {subject.name} to {group.batch}, taught by {teacher.firstName} {teacher.lastName}",
                   {"note": "Students of the class are enrolled in it automatically."})


async def add_subject_to_class(principal: Principal, args: SubjectToClassArgs) -> ToolResult:
    detail = await class_section_service.create_section(principal.tenant_id, args.class_id, ClassSectionCreate(
        subject_id=args.subject_id, primary_teacher_id=args.teacher_id, default_room_id=args.room_id))
    section = next(s for s in detail.sections if s.subject_id == args.subject_id)
    return ToolResult({"message": f"Added {section.subject_name} to {detail.code}.", "section_id": section.id})


class Slot(BaseModel):
    day_of_week: int = Field(ge=1, le=7, description="1 Monday ... 7 Sunday.")
    start_time: str = Field(description="HH:MM, 24-hour.")
    end_time: str = Field(description="HH:MM, 24-hour.")
    classroom_id: Optional[str] = None


class ScheduleArgs(BaseModel):
    class_id: str
    section_id: str = Field(description="The subject's section_id from the class, returned when it was added.")
    slots: list[Slot] = Field(min_length=1, max_length=MAX_SLOTS)


def _checked(slots: list[Slot]) -> list[SectionScheduleCreate]:
    try:
        parsed = [SectionScheduleCreate(day_of_week=s.day_of_week, start_time=s.start_time, end_time=s.end_time, classroom_id=s.classroom_id) for s in slots]
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc).splitlines()[-1]) from exc
    for i, a in enumerate(parsed):
        for b in parsed[i + 1:]:
            if a.day_of_week == b.day_of_week and a.start_time < b.end_time and b.start_time < a.end_time:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Two of these slots overlap on {DAYS[a.day_of_week]}.")
    return parsed


async def preview_schedule(principal: Principal, args: ScheduleArgs) -> Preview:
    await _class_group(principal, args.class_id)
    section = await db.coursesection.find_first(
        where={"id": args.section_id, "groupId": args.class_id, "tenantId": principal.tenant_id}, include={"subject": True})
    if not section:
        raise _missing("Subject in this class")
    rows = [[DAYS[s.day_of_week], s.start_time, s.end_time] for s in _checked(args.slots)]
    return Preview(f"Schedule {section.subject.name} in {section.name}: {len(rows)} weekly slot{'s' if len(rows) != 1 else ''}",
                   {"table": {"title": "Weekly slots", "columns": ["Day", "From", "To"], "rows": rows},
                    "note": "Clashes with the teacher's or another class's timetable are checked when you confirm."})


async def add_schedule(principal: Principal, args: ScheduleArgs) -> ToolResult:
    added = 0
    for slot in _checked(args.slots):
        try:
            await class_schedule_service.add_slot(principal.tenant_id, args.class_id, args.section_id, slot)
        except HTTPException as exc:
            raise HTTPException(exc.status_code, f"Added {added} of {len(args.slots)} slots, then stopped at "
                                f"{DAYS[slot.day_of_week]} {slot.start_time}: {exc.detail}") from exc
        added += 1
    return ToolResult({"message": f"Added {added} weekly slots."})


TOOLS = [
    Tool("create_batches", "Prepare new batches (A-1, A-2...) in a department section. Nothing is saved until the admin confirms.",
         BatchesArgs, ADMIN_ONLY, create_batches, preview=preview_batches),
    Tool("create_class", "Prepare a class for a department's batch and semester; the batch's students join it. Needs confirmation.",
         ClassArgs, ADMIN_ONLY, create_class, preview=preview_class),
    Tool("set_class_semester", "Prepare changing a class's semester number. Needs confirmation.",
         SemesterArgs, ADMIN_ONLY, set_semester, preview=preview_semester),
    Tool("add_subject_to_class", "Prepare adding a subject with its teacher to a class. Needs confirmation.",
         SubjectToClassArgs, ADMIN_ONLY, add_subject_to_class, preview=preview_subject_to_class),
    Tool("add_schedule", "Prepare weekly timetable slots for a subject in a class. Needs confirmation.",
         ScheduleArgs, ADMIN_ONLY, add_schedule, preview=preview_schedule),
]
