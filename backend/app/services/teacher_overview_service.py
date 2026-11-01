"""Read-only views for a teacher: past sessions, flagged records and per-class attendance."""
from collections import defaultdict
from prisma.models import Teacher
from app.db.client import db
from app.services.system_config_service import SystemConfigService
from app.services.attendance_percentage import ATTENDED_STATUSES, attendance_percentage

HISTORY_LIMIT = 100


def _mine(teacher: Teacher) -> list[dict]:
    return [{"facultyId": teacher.id}, {"substituteFacultyId": teacher.id}]


def _name(student) -> str:
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or student.enrollmentNumber


async def list_history(tenant_id: str, teacher: Teacher, section_id: str | None) -> list[dict]:
    where: dict = {"tenantId": tenant_id, "OR": _mine(teacher), "status": "CONDUCTED"}
    if section_id:
        where["courseSectionId"] = section_id
    occurrences = await db.classoccurrence.find_many(
        where=where,
        include={
            "courseSection": {"include": {"subject": True, "enrollments": {"where": {"status": "ACTIVE", "endedAt": None}}}},
            "attendanceRecords": True,
        },
        order=[{"date": "desc"}, {"createdAt": "desc"}],
        take=HISTORY_LIMIT,
    )
    rows = []
    for o in occurrences:
        statuses = [r.status for r in o.attendanceRecords]
        rows.append(
            {
                "occurrence_id": o.id,
                "course_section_id": o.courseSectionId,
                "date": o.date,
                "class_code": o.courseSection.name,
                "subject_name": o.courseSection.subject.name,
                "time_range": f"{o.startTime}–{o.endTime}",
                "locked": o.isAttendanceLocked,
                "present": sum(1 for s in statuses if s in ATTENDED_STATUSES),
                "flagged": sum(1 for s in statuses if s == "FLAGGED"),
                "total": max(len(o.courseSection.enrollments), len(statuses)),
            }
        )
    return rows


async def list_flagged(tenant_id: str, teacher: Teacher) -> list[dict]:
    records = await db.attendancerecord.find_many(
        where={"tenantId": tenant_id, "status": "FLAGGED", "occurrence": {"is": {"OR": _mine(teacher)}}},
        include={
            "student": True,
            "occurrence": {"include": {"courseSection": {"include": {"subject": True}}}},
        },
        order={"verifiedAt": "desc"},
    )
    return [
        {
            "record_id": r.id,
            "occurrence_id": r.occurrenceId,
            "student_name": _name(r.student),
            "enrollment_number": r.student.enrollmentNumber,
            "class_code": r.occurrence.courseSection.name,
            "subject_name": r.occurrence.courseSection.subject.name,
            "date": r.occurrence.date,
            "time_range": f"{r.occurrence.startTime}–{r.occurrence.endTime}",
            "method": str(r.method),
            "remarks": r.remarks,
            "locked": r.occurrence.isAttendanceLocked,
        }
        for r in records
    ]


def _student_rows(enrollments, held, by_student, threshold: float) -> tuple[list[dict], list[dict]]:
    everyone, below = [], []
    for enrollment in enrollments:
        since = enrollment.enrolledAt.date()
        counted = [o for o in held if o.date.date() >= since]
        statuses = [by_student[enrollment.studentId][o.id] for o in counted if o.id in by_student[enrollment.studentId]]
        percentage = attendance_percentage(statuses, len(counted))
        row = {
            "student_id": enrollment.studentId,
            "student_name": _name(enrollment.student),
            "enrollment_number": enrollment.student.enrollmentNumber,
            "attended": sum(1 for s in statuses if s in ATTENDED_STATUSES or s == "EXCUSED"),
            "held": len(counted),
            "percentage": percentage,
        }
        everyone.append(row)
        if percentage is not None and percentage < threshold:
            below.append(row)
    return everyone, sorted(below, key=lambda r: r["percentage"])


async def class_analytics(tenant_id: str, teacher: Teacher) -> list[dict]:
    config = await SystemConfigService().get_config(tenant_id=tenant_id)
    sections = await db.coursesection.find_many(
        where={"tenantId": tenant_id, "faculties": {"some": {"teacherId": teacher.id}}},
        include={
            "subject": True,
            "enrollments": {"where": {"status": "ACTIVE", "endedAt": None}, "include": {"student": True}},
            "occurrences": {"where": {"status": "CONDUCTED", "isAttendanceLocked": True}, "include": {"attendanceRecords": True}},
        },
        order={"name": "asc"},
    )
    result = []
    for section in sections:
        held = section.occurrences
        by_student: dict[str, dict[str, str]] = defaultdict(dict)
        for occurrence in held:
            for record in occurrence.attendanceRecords:
                by_student[record.studentId][occurrence.id] = record.status
        threshold = config.minAttendancePct
        everyone, below = _student_rows(section.enrollments, held, by_student, threshold)
        scored = [r["percentage"] for r in everyone if r["percentage"] is not None]
        result.append(
            {
                "course_section_id": section.id,
                "class_code": section.name,
                "subject_name": section.subject.name,
                "sessions_held": len(held),
                "student_count": len(everyone),
                "average_percentage": round(sum(scored) / len(scored), 2) if scored else None,
                "threshold": threshold,
                "below_threshold": below,
            }
        )
    return result
