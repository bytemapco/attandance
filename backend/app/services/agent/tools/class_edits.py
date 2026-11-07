"""Change a class after it exists: who is in it, who teaches a subject, and which timetable slots stay."""
from typing import Literal, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.schemas.class_management import ClassMemberRemove, ClassSectionUpdate
from app.services.agent.tools.common import ADMIN_ONLY, full_name
from app.services.agent.tools.setup_lookups import DAYS
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.class_management import class_member_service, class_section_service, class_schedule_service, class_service
from app.services.class_management.teacher_availability import ensure_teacher_free

MAX_STUDENTS = 50
MAX_SLOTS = 14
NO_ATTENDANCE_TAKEN = "Attendance has already been recorded for this subject, so it cannot be removed."


def _bad(detail: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(code, detail)


def _plural(count: int, word: str) -> str:
    return f"{count} {word}{'s' if count != 1 else ''}"


async def _class(principal: Principal, class_id: str):
    detail = await class_service.get_class(principal.tenant_id, class_id)
    if detail.status != "ACTIVE":
        raise _bad("This class is archived.", status.HTTP_409_CONFLICT)
    return detail


def _section(detail, section_id: str):
    found = next((s for s in detail.sections if s.id == section_id), None)
    if not found:
        raise _bad("Subject not found in this class.", status.HTTP_404_NOT_FOUND)
    return found


class StudentsArgs(BaseModel):
    class_id: str = Field(description="From find_classes or list_all_classes.")
    action: Literal["add", "remove"]
    student_ids: list[str] = Field(min_length=1, max_length=MAX_STUDENTS, description="From find_students.")
    reason: Optional[str] = Field(None, min_length=3, max_length=300, description="Required to remove students.")


async def _people(principal: Principal, student_ids: list[str]) -> list:
    ids = list(dict.fromkeys(student_ids))
    found = await db.student.find_many(where={"id": {"in": ids}, "tenantId": principal.tenant_id}, order={"enrollmentNumber": "asc"})
    if len(found) != len(ids):
        raise _bad(f"{len(ids) - len(found)} of these students were not found.", status.HTTP_404_NOT_FOUND)
    return found


async def _check_additions(principal: Principal, detail, people: list) -> None:
    here = {m.student_id for m in detail.members}
    if any(p.id in here for p in people):
        raise _bad("Some of these students are already in this class.", status.HTTP_409_CONFLICT)
    group = await db.studentgroup.find_first(where={"id": detail.id, "tenantId": principal.tenant_id})
    if group.batchId and any(p.batchId != group.batchId for p in people):
        raise _bad(f"Only students of batch {group.batch} can join this class. Change the student's batch instead.")
    active = await db.classmember.find_many(where={"tenantId": principal.tenant_id, "studentId": {"in": [p.id for p in people]}, "status": "ACTIVE"})
    if active:
        raise _bad(f"{_plural(len(active), 'student')} already active in another class.", status.HTTP_409_CONFLICT)


async def preview_students(principal: Principal, args: StudentsArgs) -> Preview:
    detail = await _class(principal, args.class_id)
    people = await _people(principal, args.student_ids)
    if args.action == "add":
        await _check_additions(principal, detail, people)
        note = "They are enrolled in every subject of the class."
    else:
        if not args.reason:
            raise _bad("Ask the admin for a reason; it is kept with the change.")
        here = {m.student_id for m in detail.members}
        if any(p.id not in here for p in people):
            raise _bad("Some of these students are not in this class.", status.HTTP_404_NOT_FOUND)
        note = "They leave the class and its subjects. Attendance already recorded stays."
    rows = [[full_name(p), p.enrollmentNumber] for p in people]
    return Preview(f"{args.action.title()} {_plural(len(rows), 'student')} {'to' if args.action == 'add' else 'from'} {detail.code}",
                   {"table": {"title": "Students", "columns": ["Name", "Roll"], "rows": rows}, "note": note})


async def change_students(principal: Principal, args: StudentsArgs) -> ToolResult:
    if args.action == "add":
        await class_member_service.add_members(principal.tenant_id, args.class_id, args.student_ids)
        return ToolResult({"message": f"Added {_plural(len(args.student_ids), 'student')}."})
    done = 0
    for student_id in args.student_ids:
        try:
            await class_member_service.remove_member(principal.tenant_id, args.class_id, student_id, ClassMemberRemove(reason=args.reason))
        except HTTPException as exc:
            raise HTTPException(exc.status_code, f"Removed {done} of {len(args.student_ids)}, then stopped: {exc.detail}") from exc
        done += 1
    return ToolResult({"message": f"Removed {_plural(done, 'student')}."})


class TeacherArgs(BaseModel):
    class_id: str
    section_id: str = Field(description="The subject's section_id, from class_overview.")
    teacher_id: str = Field(description="The new teacher, from find_teachers.")


async def preview_teacher(principal: Principal, args: TeacherArgs) -> Preview:
    detail = await _class(principal, args.class_id)
    section = _section(detail, args.section_id)
    teacher = await db.teacher.find_first(where={"id": args.teacher_id, "tenantId": principal.tenant_id})
    if not teacher:
        raise _bad("Teacher not found.", status.HTTP_404_NOT_FOUND)
    if teacher.id == section.teacher_id:
        raise _bad(f"{full_name(teacher)} already teaches this subject.")
    await ensure_teacher_free(principal.tenant_id, section.id, teacher.id)
    return Preview(f"{section.subject_name} in {detail.code}: {section.teacher_name or 'no teacher'} to {full_name(teacher)}",
                   {"note": "Future classes move to the new teacher. Classes already held keep the old one."})


async def change_teacher(principal: Principal, args: TeacherArgs) -> ToolResult:
    detail = await class_section_service.update_section(principal.tenant_id, args.class_id, args.section_id, ClassSectionUpdate(primary_teacher_id=args.teacher_id))
    return ToolResult({"message": f"{_section(detail, args.section_id).subject_name} now has a new teacher."})


class SubjectArgs(BaseModel):
    class_id: str
    section_id: str = Field(description="The subject's section_id, from class_overview.")


async def preview_remove_subject(principal: Principal, args: SubjectArgs) -> Preview:
    detail = await _class(principal, args.class_id)
    section = _section(detail, args.section_id)
    if await db.attendancerecord.count(where={"occurrence": {"is": {"courseSectionId": section.id}}}):
        raise _bad(NO_ATTENDANCE_TAKEN, status.HTTP_409_CONFLICT)
    return Preview(f"Remove {section.subject_name} from {detail.code}", {"note": "Its timetable and the students' enrolment in it are removed."})


async def remove_subject(principal: Principal, args: SubjectArgs) -> ToolResult:
    await class_section_service.delete_section(principal.tenant_id, args.class_id, args.section_id)
    return ToolResult({"message": "Removed the subject from the class."})


class SlotsArgs(BaseModel):
    class_id: str
    section_id: str = Field(description="The subject's section_id, from class_overview.")
    rule_ids: list[str] = Field(min_length=1, max_length=MAX_SLOTS, description="The slots' rule_id values, from class_overview.")


async def preview_remove_slots(principal: Principal, args: SlotsArgs) -> Preview:
    detail = await _class(principal, args.class_id)
    section = _section(detail, args.section_id)
    slots = {s.id: s for s in section.schedule}
    if any(rule_id not in slots for rule_id in args.rule_ids):
        raise _bad("A slot in this list was not found in this subject's timetable.", status.HTTP_404_NOT_FOUND)
    rows = [[DAYS[slots[i].day_of_week], slots[i].start_time, slots[i].end_time] for i in args.rule_ids]
    return Preview(f"Remove {_plural(len(rows), 'weekly slot')} of {section.subject_name} in {detail.code}",
                   {"table": {"title": "Slots to remove", "columns": ["Day", "From", "To"], "rows": rows},
                    "note": "Upcoming classes from these slots are deleted. A slot that already has attendance is switched off, not erased."})


async def remove_slots(principal: Principal, args: SlotsArgs) -> ToolResult:
    for done, rule_id in enumerate(args.rule_ids):
        try:
            await class_schedule_service.remove_slot(principal.tenant_id, args.class_id, args.section_id, rule_id)
        except HTTPException as exc:
            raise HTTPException(exc.status_code, f"Removed {done} of {len(args.rule_ids)} slots, then stopped: {exc.detail}") from exc
    return ToolResult({"message": f"Removed {_plural(len(args.rule_ids), 'slot')}."})


TOOLS = [
    Tool("change_class_students", "Prepare adding students to a class or removing them from it (a reason is needed to remove). "
         "Students can only join the class of their own batch. Needs confirmation.", StudentsArgs, ADMIN_ONLY, change_students, preview=preview_students),
    Tool("change_subject_teacher", "Prepare giving a class's subject to another teacher. Refused when that teacher has a clash. "
         "Needs confirmation.", TeacherArgs, ADMIN_ONLY, change_teacher, preview=preview_teacher),
    Tool("remove_subject_from_class", "Prepare removing a subject from a class. Refused once attendance was taken for it. Needs confirmation.",
         SubjectArgs, ADMIN_ONLY, remove_subject, preview=preview_remove_subject),
    Tool("remove_schedule_slots", "Prepare removing weekly timetable slots of a subject (rule_ids from class_overview). Needs confirmation.",
         SlotsArgs, ADMIN_ONLY, remove_slots, preview=preview_remove_slots),
]
