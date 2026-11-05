from datetime import date, datetime, time
from fastapi import HTTPException, status
from prisma.models import Student

from app.core.datetime_utils import get_ist_now
from app.db.client import db
from app.schemas.student_timetable import StudentTimetableResponse
from app.services.student_timetable import build_days
from app.services.system_config_service import SystemConfigService

MAX_RANGE_DAYS = 14

_SECTION_INCLUDE = {"subject": True, "defaultRoom": True, "faculties": {"include": {"teacher": True}}}


def _midnight(day: date) -> datetime:
    return datetime.combine(day, time.min)


async def get_timetable(student: Student, start: date, end: date) -> StudentTimetableResponse:
    if end < start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The end date is before the start date.")
    if (end - start).days >= MAX_RANGE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ask for at most {MAX_RANGE_DAYS} days at a time."
        )
    enrollments = await db.courseenrollment.find_many(
        where={
            "studentId": student.id,
            "endedAt": None,
            "status": "ACTIVE",
            "courseSection": {"is": {"tenantId": student.tenantId}},
        }
    )
    section_ids = [e.courseSectionId for e in enrollments]
    since = {e.courseSectionId: e.enrolledAt.date() for e in enrollments}
    rules = await db.timetablerule.find_many(
        where={"tenantId": student.tenantId, "courseSectionId": {"in": section_ids}, "isActive": True},
        include={"teacher": True, "classroom": True, "courseSection": {"include": _SECTION_INCLUDE}},
    )
    occurrences = await db.classoccurrence.find_many(
        where={
            "tenantId": student.tenantId,
            "courseSectionId": {"in": section_ids},
            "date": {"gte": _midnight(start), "lte": _midnight(end)},
        },
        include={
            "courseSection": {"include": _SECTION_INCLUDE},
            "classroom": True,
            "faculty": True,
            "substituteFaculty": True,
            "attendanceRecords": {"where": {"studentId": student.id}},
        },
    )
    config = await SystemConfigService().get_config(student.tenantId)
    now = get_ist_now()
    return StudentTimetableResponse(
        generated_at=now,
        today=now.date(),
        saturday_enabled=config.saturdayEnabled,
        days=build_days(start, end, rules, occurrences, since, config.saturdayEnabled),
    )
