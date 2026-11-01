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
    "department": True,
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
                "order_by": [{"dayOfWeek": "asc"}, {"startTime": "asc"}],
                "include": {"classroom": True},
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


async def get_class_group(tenant_id: str, class_id: str):
    group = await db.studentgroup.find_first(
        where={"id": class_id, "tenantId": tenant_id}, include=CLASS_INCLUDE
    )
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")
    return group


async def require_students_in_tenant(tenant_id: str, student_ids: List[str]) -> list:
    students = await db.student.find_many(
        where={"id": {"in": student_ids}, "user": {"is": {"tenantId": tenant_id}}}
    )
    if len(students) != len(student_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more students not found.")
    return students


def build_summary(group) -> ClassSummary:
    return ClassSummary(
        id=group.id,
        code=class_code(group.department.code, group.batch),
        department_id=group.departmentId,
        department_name=group.department.name,
        batch=group.batch,
        semester_number=group.semester,
        member_count=len(group.members or []),
        subject_count=len(getattr(group, "courseSections", None) or []),
        status=group.status,
        created_at=group.createdAt,
    )


def _schedule_item(rule) -> ScheduleItem:
    return ScheduleItem(
        id=rule.id,
        day_of_week=rule.dayOfWeek,
        start_time=rule.startTime,
        end_time=rule.endTime,
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


def build_detail(group) -> ClassDetail:
    members = sorted(group.members or [], key=lambda m: m.student.enrollmentNumber)
    return ClassDetail(
        **build_summary(group).model_dump(),
        members=[
            MemberItem(
                student_id=m.studentId,
                enrollment_number=m.student.enrollmentNumber,
                name=_full_name(m.student),
                status=m.status,
            )
            for m in members
        ],
        sections=[_section_item(s) for s in group.courseSections or []],
    )
