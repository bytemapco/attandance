"""The classes a student has had so far, newest first, and what was recorded for them."""

from dataclasses import dataclass
from typing import List, Optional

from app.db.client import db


@dataclass(frozen=True)
class HeldClass:
    occurrence_date: object
    status: Optional[str]  # None means the teacher closed the class and no record exists for this student


async def held_classes(student_id: str, tenant_id: str) -> List[HeldClass]:
    """Classes held (conducted and closed) for the student's active subjects, since they enrolled in each."""
    enrollments = await db.courseenrollment.find_many(
        where={
            "studentId": student_id,
            "endedAt": None,
            "status": "ACTIVE",
            "courseSection": {"is": {"tenantId": tenant_id}},
        }
    )
    enrolled_since = {e.courseSectionId: e.enrolledAt.date() for e in enrollments}
    if not enrolled_since:
        return []

    occurrences = await db.classoccurrence.find_many(
        where={
            "tenantId": tenant_id,
            "courseSectionId": {"in": list(enrolled_since)},
            "status": "CONDUCTED",
            "isAttendanceLocked": True,
        },
        order=[{"date": "desc"}, {"startTime": "desc"}],
    )
    held = [o for o in occurrences if o.date.date() >= enrolled_since[o.courseSectionId]]
    records = await db.attendancerecord.find_many(
        where={"studentId": student_id, "tenantId": tenant_id, "occurrenceId": {"in": [o.id for o in held]}}
    )
    status_by_occurrence = {r.occurrenceId: r.status for r in records}
    return [HeldClass(o.date.date(), status_by_occurrence.get(o.id)) for o in held]
