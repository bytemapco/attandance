"""Covering a class with another teacher: who is free at that time, and recording the cover."""
from datetime import datetime

from fastapi import HTTPException, status

from app.db.client import db
from app.services.notification_service import create_in_app_notification

SUGGESTIONS = 5
OPEN_STATUSES = ("SCHEDULED", "CONDUCTED")


def _bad(code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=code, detail=detail)


def midnight(day) -> datetime:
    return datetime(day.year, day.month, day.day)


async def teacher_classes_on(tenant_id: str, teacher_id: str, day) -> list:
    """The classes a teacher takes, or already covers, on one day, in time order."""
    return await db.classoccurrence.find_many(
        where={
            "tenantId": tenant_id,
            "date": midnight(day),
            "status": {"not": "CANCELLED"},
            "OR": [{"facultyId": teacher_id}, {"substituteFacultyId": teacher_id}],
        },
        include={"courseSection": {"include": {"subject": True}}},
        order={"startTime": "asc"},
    )


async def free_teachers(tenant_id: str, occurrence, limit: int = SUGGESTIONS) -> list:
    """Teachers with no class overlapping this one that day. Teachers of the same department come first."""
    busy = await db.classoccurrence.find_many(
        where={
            "tenantId": tenant_id,
            "date": occurrence.date,
            "status": {"not": "CANCELLED"},
            "startTime": {"lt": occurrence.endTime},
            "endTime": {"gt": occurrence.startTime},
        }
    )
    taken = {o.facultyId for o in busy} | {o.substituteFacultyId for o in busy if o.substituteFacultyId}
    taken.add(occurrence.facultyId)
    candidates = await db.teacher.find_many(
        where={"tenantId": tenant_id, "id": {"not_in": list(taken)}, "user": {"is": {"isActive": True}}},
        include={"department": True},
    )
    department = occurrence.courseSection.departmentId if occurrence.courseSection else None
    candidates.sort(key=lambda t: (t.departmentId != department, t.employeeId))
    return candidates[:limit]


async def require_coverable(tenant_id: str, occurrence_id: str, teacher_id: str):
    occurrence = await db.classoccurrence.find_first(
        where={"id": occurrence_id, "tenantId": tenant_id},
        include={"courseSection": {"include": {"subject": True}}},
    )
    if not occurrence:
        raise _bad(status.HTTP_404_NOT_FOUND, "Class not found.")
    if occurrence.isAttendanceLocked or occurrence.status not in OPEN_STATUSES:
        raise _bad(status.HTTP_409_CONFLICT, "This class is already closed or cancelled.")
    if teacher_id == occurrence.facultyId:
        raise _bad(status.HTTP_400_BAD_REQUEST, "That teacher already takes this class.")
    teacher = await db.teacher.find_first(where={"id": teacher_id, "tenantId": tenant_id}, include={"user": True})
    if not teacher or not teacher.user.isActive:
        raise _bad(status.HTTP_404_NOT_FOUND, "Teacher not found.")
    if teacher.id not in {t.id for t in await free_teachers(tenant_id, occurrence, limit=10_000)}:
        raise _bad(status.HTTP_409_CONFLICT, "That teacher has another class at this time.")
    return occurrence, teacher


async def assign_substitute(tenant_id: str, occurrence_id: str, teacher_id: str, actor: str) -> tuple:
    occurrence, teacher = await require_coverable(tenant_id, occurrence_id, teacher_id)
    await db.classoccurrence.update(where={"id": occurrence.id}, data={"substituteFacultyId": teacher.id})
    label = f"{occurrence.courseSection.name} {occurrence.courseSection.subject.name} {occurrence.startTime}-{occurrence.endTime}"
    await db.auditlog.create(
        data={
            "tenantId": tenant_id, "actor": actor, "eventType": "SUBSTITUTE_ASSIGNED", "severity": "INFO",
            "target": occurrence.id, "description": f"{teacher.employeeId} covers {label} on {occurrence.date.date().isoformat()}",
        }
    )
    await create_in_app_notification(
        title="You are covering a class", message=f"{label} on {occurrence.date.date().isoformat()}.",
        user_id=teacher.userId, role="TEACHER", tenant_id=tenant_id, category="schedule", link="/teacher/today",
    )
    return occurrence, teacher


def teacher_name(teacher) -> str:
    return f"{teacher.firstName} {teacher.lastName}".strip()
