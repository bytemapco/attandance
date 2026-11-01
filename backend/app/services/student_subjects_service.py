from datetime import datetime, time, timezone
from typing import Dict, List
from prisma.models import Student
from app.core.datetime_utils import get_ist_today
from app.db.client import db
from app.schemas.student import StudentClassResponse
from app.schemas.student_occurrence import LiveClassResponse, StudentSubjectResponse
from app.services.attendance_percentage import ATTENDED_STATUSES, attendance_percentage
from app.services.system_config_service import SystemConfigService

MARKED_STATUSES = ("PRESENT", "LATE", "FLAGGED", "APPROVED")


def _teacher_name(section) -> str | None:
    primary = next((f for f in section.faculties or [] if f.isPrimary), None)
    teacher = primary.teacher if primary else None
    return f"{teacher.firstName} {teacher.lastName}".strip() if teacher else None


async def _active_enrollments(student: Student):
    return await db.courseenrollment.find_many(
        where={
            "studentId": student.id,
            "endedAt": None,
            "status": "ACTIVE",
            "courseSection": {"is": {"tenantId": student.tenantId}},
        },
        include={"courseSection": {"include": {"subject": True, "faculties": {"include": {"teacher": True}}}}},
    )


async def list_subjects(student: Student) -> List[StudentSubjectResponse]:
    enrollments = await _active_enrollments(student)
    section_ids = [e.courseSectionId for e in enrollments]
    conducted = await db.classoccurrence.find_many(
        where={"courseSectionId": {"in": section_ids}, "status": "CONDUCTED", "isAttendanceLocked": True}
    )
    records = await db.attendancerecord.find_many(
        where={"studentId": student.id, "occurrenceId": {"in": [o.id for o in conducted]}}
    )
    status_by_occurrence: Dict[str, str] = {r.occurrenceId: r.status for r in records}
    result = []
    for enrollment in enrollments:
        section = enrollment.courseSection
        since = enrollment.enrolledAt.date()
        held = [o for o in conducted if o.courseSectionId == section.id and o.date.date() >= since]
        statuses = [status_by_occurrence[o.id] for o in held if o.id in status_by_occurrence]
        result.append(
            StudentSubjectResponse(
                course_section_id=section.id,
                class_code=section.name,
                subject_name=section.subject.name,
                subject_code=section.subject.code,
                teacher_name=_teacher_name(section),
                conducted=len(held),
                attended=sum(1 for s in statuses if s in ATTENDED_STATUSES or s == "EXCUSED"),
                percentage=attendance_percentage(statuses, len(held)),
            )
        )
    return sorted(result, key=lambda s: s.subject_name)


async def list_classes(student: Student) -> List[StudentClassResponse]:
    """Every enrolled class, with the session id when the teacher has attendance open right now."""
    enrollments = await _active_enrollments(student)
    live = {c.course_section_id: c for c in await list_live_classes(student)}
    config = await SystemConfigService().get_config(student.tenantId)
    has_campus = config.campusLatitude is not None and config.campusLongitude is not None
    result = []
    for enrollment in enrollments:
        section = enrollment.courseSection
        session = live.get(section.id)
        result.append(
            StudentClassResponse(
                class_id=section.id,
                class_name=section.name,
                subject=section.subject.name,
                teacher_name=_teacher_name(section) or "",
                active_session_id=session.occurrence_id if session and not session.already_marked else None,
                session_end_time=session.window_closes_at if session else None,
                latitude=config.campusLatitude,
                longitude=config.campusLongitude,
                radius_meters=config.geofenceRadiusMeters if has_campus else None,
            )
        )
    return sorted(result, key=lambda c: c.subject)


async def list_live_classes(student: Student) -> List[LiveClassResponse]:
    enrollments = await _active_enrollments(student)
    now = datetime.now(timezone.utc)
    today = datetime.combine(get_ist_today(), time.min)
    occurrences = await db.classoccurrence.find_many(
        where={
            "courseSectionId": {"in": [e.courseSectionId for e in enrollments]},
            "date": today,
            "verificationActive": True,
            "verificationExpires": {"gt": now},
            "isAttendanceLocked": False,
            "status": {"not": "CANCELLED"},
        },
        include={"courseSection": {"include": {"subject": True}}, "classroom": True},
    )
    marked = await db.attendancerecord.find_many(
        where={
            "studentId": student.id,
            "occurrenceId": {"in": [o.id for o in occurrences]},
            "status": {"in": list(MARKED_STATUSES)},
        }
    )
    marked_ids = {r.occurrenceId for r in marked}
    return [
        LiveClassResponse(
            occurrence_id=o.id,
            course_section_id=o.courseSectionId,
            class_code=o.courseSection.name,
            subject_name=o.courseSection.subject.name,
            subject_code=o.courseSection.subject.code,
            start_time=o.startTime,
            end_time=o.endTime,
            classroom_name=o.classroom.name if o.classroom else None,
            window_closes_at=o.verificationExpires,
            already_marked=o.id in marked_ids,
        )
        for o in occurrences
    ]
