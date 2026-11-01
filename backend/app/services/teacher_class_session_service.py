"""A teacher's classes (course sections) and starting an attendance session for one of them."""
from datetime import datetime, time
from fastapi import HTTPException, status
from prisma.models import Teacher
from app.core.datetime_utils import get_ist_now, get_ist_today
from app.db.client import db
from app.services.occurrence_marking_service import window_is_open
from app.services.teacher_schedule_service import TeacherScheduleService


def _today() -> datetime:
    return datetime.combine(get_ist_today(), time.min)


def _class_payload(section) -> dict:
    live = next((o for o in section.occurrences or [] if window_is_open(o)), None)
    closed = next((o for o in section.occurrences or [] if o.isAttendanceLocked), None)
    term = section.classTerm
    return {
        "course_section_id": section.id,
        "class_code": section.name,
        "subject_name": section.subject.name,
        "subject_code": section.subject.code,
        "department_name": section.department.name if section.department else None,
        "semester": term.semester.number if term and term.semester else None,
        "student_count": len(section.enrollments or []),
        "live_occurrence_id": live.id if live else None,
        "window_closes_at": live.verificationExpires if live else None,
        "closed_occurrence_id": closed.id if closed else None,
    }


async def list_my_classes(tenant_id: str, teacher: Teacher) -> list[dict]:
    sections = await db.coursesection.find_many(
        where={
            "tenantId": tenant_id,
            "faculties": {"some": {"teacherId": teacher.id}},
            "academicYear": {"is": {"status": {"not": "ARCHIVED"}}},
        },
        include={
            "subject": True,
            "department": True,
            "classTerm": {"include": {"semester": True}},
            "enrollments": {"where": {"status": "ACTIVE", "endedAt": None}},
            "occurrences": {"where": {"date": _today()}},
        },
        order={"name": "asc"},
    )
    return [_class_payload(s) for s in sections]


async def _pick_time_slot(tenant_id: str):
    """The period running now, else the next one today, else the last one of the day."""
    slots = await db.timeslot.find_many(
        where={"tenantId": tenant_id, "isBreak": False}, order={"startTime": "asc"}
    )
    if not slots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No class periods are set up. Ask your admin to add time slots.",
        )
    now = get_ist_now().strftime("%H:%M")
    current = next((s for s in slots if s.startTime <= now < s.endTime), None)
    upcoming = next((s for s in slots if s.startTime > now), None)
    return current or upcoming or slots[-1]


async def _occurrence_for_now(tenant_id: str, teacher: Teacher, section) -> str:
    slot = await _pick_time_slot(tenant_id)
    key = {"courseSectionId": section.id, "date": _today(), "timeSlotId": slot.id}
    occurrence = await db.classoccurrence.find_unique(where={"courseSectionId_date_timeSlotId": key})
    if occurrence and occurrence.isAttendanceLocked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance for {slot.name} is already closed for this class.",
        )
    if occurrence:
        return occurrence.id
    created = await db.classoccurrence.create(
        data={
            **key,
            "tenantId": tenant_id,
            "classroomId": section.defaultRoomId,
            "facultyId": teacher.id,
            "status": "SCHEDULED",
        }
    )
    return created.id


async def start_class_session(tenant_id: str, teacher: Teacher, section_id: str) -> dict:
    """Opens attendance for today's class. Starting again while a session is live returns that session."""
    section = await db.coursesection.find_first(
        where={"id": section_id, "tenantId": tenant_id, "faculties": {"some": {"teacherId": teacher.id}}},
        include={"occurrences": {"where": {"date": _today()}}},
    )
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found or not assigned to you.")
    live = next((o for o in section.occurrences or [] if window_is_open(o)), None)
    if live:
        return {"occurrence_id": live.id, "window_closes_at": live.verificationExpires}
    occurrence_id = await _occurrence_for_now(tenant_id, teacher, section)
    started = await TeacherScheduleService.start_occurrence_attendance(tenant_id, teacher.id, occurrence_id)
    return {"occurrence_id": started.id, "window_closes_at": started.verificationExpires}
