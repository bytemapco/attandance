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
    return {
        "course_section_id": section.id,
        "class_code": section.name,
        "subject_name": section.subject.name,
        "subject_code": section.subject.code,
        "department_name": section.department.name if section.department else None,
        "semester": section.group.semester if section.group else None,
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
        },
        include={
            "subject": True,
            "department": True,
            "group": True,
            "enrollments": {"where": {"status": "ACTIVE", "endedAt": None}},
            "occurrences": {"where": {"date": _today()}},
        },
        order={"name": "asc"},
    )
    return [_class_payload(s) for s in sections]


# A class that is not on the weekly schedule is recorded as one hour long.
UNSCHEDULED_CLASS_MINUTES = 60


def _end_time(start_time: str, minutes: int) -> str:
    hours, mins = (int(part) for part in start_time.split(":"))
    total = min(hours * 60 + mins + minutes, 23 * 60 + 59)
    return f"{total // 60:02d}:{total % 60:02d}"


def _pick_occurrence(occurrences, now: str):
    """Today's class running now, else the next one that is still open."""
    running = next((o for o in occurrences if o.startTime <= now < o.endTime), None)
    if running:
        return running
    upcoming = sorted((o for o in occurrences if o.startTime > now and not o.isAttendanceLocked), key=lambda o: o.startTime)
    return upcoming[0] if upcoming else None


async def _occurrence_for_now(tenant_id: str, teacher: Teacher, section) -> str:
    now = get_ist_now().strftime("%H:%M")
    picked = _pick_occurrence(section.occurrences or [], now)
    if picked and picked.isAttendanceLocked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance for {picked.startTime}–{picked.endTime} is already closed for this class.",
        )
    if picked:
        return picked.id
    created = await db.classoccurrence.create(
        data={
            "tenantId": tenant_id,
            "courseSectionId": section.id,
            "date": _today(),
            "startTime": now,
            "endTime": _end_time(now, UNSCHEDULED_CLASS_MINUTES),
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
