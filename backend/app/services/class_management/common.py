from typing import List
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import (
    ClassDetail,
    ClassSummary,
    MemberItem,
    ScheduleItem,
    SectionItem,
)

CLASS_INCLUDE = {
    "group": {"include": {"department": True}},
    "semester": {"include": {"academicYear": True}},
    "members": {"where": {"status": "ACTIVE"}, "include": {"student": True}},
    "courseSections": {
        "order_by": {"createdAt": "asc"},
        "include": {
            "subject": True,
            "defaultRoom": True,
            "faculties": {"include": {"teacher": True}},
            "enrollments": {"where": {"endedAt": None}},
            "timetableRules": {
                "where": {"isActive": True},
                "order_by": {"dayOfWeek": "asc"},
                "include": {"timeSlot": True, "classroom": True},
            },
        },
    },
}


def class_code(department_code: str, batch: str) -> str:
    already_prefixed = batch.upper().startswith(f"{department_code.upper()}-")
    return batch if already_prefixed else f"{department_code}-{batch}"


def _full_name(person) -> str:
    name = f"{person.firstName or ''} {person.lastName or ''}".strip()
    return name or getattr(person, "enrollmentNumber", "")


async def get_class_term(tenant_id: str, class_id: str):
    term = await db.classterm.find_first(
        where={"id": class_id, "tenantId": tenant_id}, include=CLASS_INCLUDE
    )
    if not term:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")
    return term


async def require_students_in_tenant(tenant_id: str, student_ids: List[str]) -> list:
    students = await db.student.find_many(
        where={"id": {"in": student_ids}, "user": {"is": {"tenantId": tenant_id}}}
    )
    if len(students) != len(student_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more students not found.")
    return students


def build_summary(term) -> ClassSummary:
    group = term.group
    return ClassSummary(
        id=term.id,
        code=class_code(group.department.code, group.batch),
        group_id=group.id,
        department_id=group.departmentId,
        department_name=group.department.name,
        batch=group.batch,
        semester_number=term.semester.number,
        academic_year_id=term.semester.academicYearId,
        academic_year_name=term.semester.academicYear.name,
        member_count=len(term.members or []),
        subject_count=len(getattr(term, "courseSections", None) or []),
        status=group.status,
        created_at=term.createdAt,
    )


def _schedule_item(rule) -> ScheduleItem:
    slot = rule.timeSlot
    return ScheduleItem(
        id=rule.id,
        day_of_week=rule.dayOfWeek,
        time_slot_id=rule.timeSlotId,
        slot_name=slot.name if slot else None,
        start_time=slot.startTime if slot else None,
        end_time=slot.endTime if slot else None,
        room_name=rule.classroom.name if rule.classroom else None,
    )


def _section_item(section) -> SectionItem:
    primary = next((f for f in section.faculties or [] if f.isPrimary), None)
    teacher = primary.teacher if primary else None
    return SectionItem(
        id=section.id,
        name=section.name,
        subject_id=section.subjectId,
        subject_name=section.subject.name if section.subject else None,
        subject_code=section.subject.code if section.subject else None,
        teacher_id=teacher.id if teacher else None,
        teacher_name=_full_name(teacher) if teacher else None,
        room_name=section.defaultRoom.name if section.defaultRoom else None,
        enrolled_count=len(section.enrollments or []),
        schedule=[_schedule_item(r) for r in section.timetableRules or []],
    )


def build_detail(term) -> ClassDetail:
    members = sorted(term.members or [], key=lambda m: m.student.enrollmentNumber)
    return ClassDetail(
        **build_summary(term).model_dump(),
        members=[
            MemberItem(
                student_id=m.studentId,
                enrollment_number=m.student.enrollmentNumber,
                name=_full_name(m.student),
                status=m.status,
            )
            for m in members
        ],
        sections=[_section_item(s) for s in term.courseSections or []],
    )
