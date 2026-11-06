"""The classes a student has had so far, newest first, and what was recorded for them."""

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence

from app.db.client import db


@dataclass(frozen=True)
class HeldClass:
    occurrence_date: object
    status: Optional[str]  # None means the teacher closed the class and no record exists for this student


async def held_classes_for(student_ids: Sequence[str], tenant_id: str) -> Dict[str, List[HeldClass]]:
    """Classes held (conducted and closed) for each student's active subjects, since they enrolled in each.

    Four queries however many students are asked about, so closing a class does not cost a round trip per student.
    """
    held_by_student: Dict[str, List[HeldClass]] = {student_id: [] for student_id in student_ids}
    enrollments = await db.courseenrollment.find_many(
        where={
            "studentId": {"in": list(student_ids)},
            "endedAt": None,
            "status": "ACTIVE",
            "courseSection": {"is": {"tenantId": tenant_id}},
        }
    )
    if not enrollments:
        return held_by_student

    sections_of: Dict[str, Dict[str, object]] = defaultdict(dict)
    for enrollment in enrollments:
        sections_of[enrollment.studentId][enrollment.courseSectionId] = enrollment.enrolledAt.date()

    occurrences = await db.classoccurrence.find_many(
        where={
            "tenantId": tenant_id,
            "courseSectionId": {"in": list({e.courseSectionId for e in enrollments})},
            "status": "CONDUCTED",
            "isAttendanceLocked": True,
        },
        order=[{"date": "desc"}, {"startTime": "desc"}],
    )
    records = await db.attendancerecord.find_many(
        where={
            "studentId": {"in": list(student_ids)},
            "tenantId": tenant_id,
            "occurrenceId": {"in": [o.id for o in occurrences]},
        }
    )
    status_of = {(r.studentId, r.occurrenceId): r.status for r in records}

    for student_id, enrolled_since in sections_of.items():
        held_by_student[student_id] = [
            HeldClass(o.date.date(), status_of.get((student_id, o.id)))
            for o in occurrences
            if o.courseSectionId in enrolled_since and o.date.date() >= enrolled_since[o.courseSectionId]
        ]
    return held_by_student


async def held_classes(student_id: str, tenant_id: str) -> List[HeldClass]:
    return (await held_classes_for([student_id], tenant_id))[student_id]
