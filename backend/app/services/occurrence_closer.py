"""Closing a class: every enrolled student without a mark gets an absent or excused record, then the register locks."""

import uuid
from datetime import datetime, timezone
from typing import Iterable, List, Optional

from app.core.logging_config import get_logger
from app.db.client import db
from app.services.gamification_service import GamificationService

logger = get_logger("app.occurrence_closer")

CLOSE_INCLUDE = {
    "courseSection": {
        "include": {
            "enrollments": {
                "where": {"status": "ACTIVE", "endedAt": None},
                "include": {"student": {"include": {"leaveRequests": {"where": {"status": "APPROVED"}}}}},
            }
        }
    },
    "attendanceRecords": True,
}

AUTO_CLOSE_REASON = "Auto-marked absent: the verification window ended and the class was closed automatically"
MANUAL_CLOSE_REASON = "Auto-marked absent on register close"
LEAVE_REASON = "Excused via approved leave"


def _on_leave(student, day) -> bool:
    return any(leave.startDate.date() <= day <= leave.endDate.date() for leave in student.leaveRequests or [])


async def load_for_close(tenant_id: str, occurrence_id: str):
    return await db.classoccurrence.find_first(
        where={"id": occurrence_id, "tenantId": tenant_id}, include=CLOSE_INCLUDE
    )


async def refresh_streaks(student_ids: Iterable[str]) -> None:
    """Streaks only count closed classes, so they are recalculated when a class closes or its register changes."""
    try:
        await GamificationService().recalculate_streaks(student_ids)
    except Exception as exc:
        logger.warning("Streak update failed: %s", exc)


def _absence_records(tenant_id: str, occurrence, user_id: str, auto: bool, now: datetime) -> List[dict]:
    """The record and its audit entry for every enrolled student who has no mark yet."""
    day = occurrence.date.date()
    already_marked = {r.studentId for r in occurrence.attendanceRecords}
    absent_reason = AUTO_CLOSE_REASON if auto else MANUAL_CLOSE_REASON
    absences = []
    for enrollment in occurrence.courseSection.enrollments:
        student = enrollment.student
        if not student or student.id in already_marked or enrollment.enrolledAt.date() > day:
            continue
        excused = _on_leave(student, day)
        status = "EXCUSED" if excused else "ABSENT"
        reason = LEAVE_REASON if excused else absent_reason
        record_id = str(uuid.uuid4())
        absences.append(
            {
                "record": {
                    "id": record_id,
                    "tenantId": tenant_id,
                    "occurrenceId": occurrence.id,
                    "studentId": student.id,
                    "status": status,
                    "method": "SYSTEM_EXCUSED" if excused else "MANUAL_REGISTER",
                    "remarks": reason,
                    "verifiedAt": now,
                },
                "audit": {
                    "attendanceRecordId": record_id,
                    "previousStatus": "ABSENT",
                    "newStatus": status,
                    "changedById": user_id,
                    "reason": reason,
                },
            }
        )
    return absences


async def close_occurrence(tenant_id: str, occurrence, user_id: str, auto: bool = False) -> int:
    """Gives everyone without a record an absent or excused one, then locks. Returns how many records it made.

    The records, their audit entries and the lock are written together in one transaction, in a fixed number of
    queries however large the class is: either the whole class closes or none of it does.
    """
    now = datetime.now(timezone.utc)
    absences = _absence_records(tenant_id, occurrence, user_id, auto, now)
    async with db.tx() as tx:
        created = 0
        if absences:
            # A student who marked themselves a moment ago already has a record; theirs is kept.
            created = await tx.attendancerecord.create_many(data=[a["record"] for a in absences], skip_duplicates=True)
            ours = {r.id for r in await tx.attendancerecord.find_many(where={"id": {"in": [a["record"]["id"] for a in absences]}})}
            await tx.attendanceauditlog.create_many(data=[a["audit"] for a in absences if a["record"]["id"] in ours])
        await tx.classoccurrence.update(
            where={"id": occurrence.id},
            data={
                "verificationActive": False,
                "isAttendanceLocked": True,
                "lockedAt": now,
                "lockedById": user_id,
                "status": "CONDUCTED",
            },
        )
    everyone = {r.studentId for r in occurrence.attendanceRecords} | {a["record"]["studentId"] for a in absences}
    await refresh_streaks(everyone)
    return created


async def expired_unclosed(now: Optional[datetime] = None):
    """Classes whose verification window has ended but that nobody closed."""
    return await db.classoccurrence.find_many(
        where={
            "verificationActive": True,
            "isAttendanceLocked": False,
            "verificationExpires": {"lte": now or datetime.now(timezone.utc)},
        },
        include={"faculty": True, **CLOSE_INCLUDE},
    )
