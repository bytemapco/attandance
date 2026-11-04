"""Read-only views for a teacher: past sessions, flagged records and per-class attendance."""
from prisma.models import Teacher
from app.db.client import db
from app.services.attendance_percentage import ATTENDED_STATUSES

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
