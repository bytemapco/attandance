"""A teacher's decision on a flagged mark: approve it (counts as attended) or reject it (absent)."""
from typing import Optional
from fastapi import HTTPException, status
from prisma.models import User

from app.core.logging_config import get_logger
from app.db.client import db
from app.services.connection_manager import manager
from app.services.notification_service import create_in_app_notification
from app.services.occurrence_closer import refresh_streaks
from app.services.occurrence_register_service import authorize_register_access

logger = get_logger("app.flagged_review")

NEW_STATUS = {"APPROVE": "APPROVED", "REJECT": "ABSENT"}
AUDIT_REASON = {"APPROVE": "Teacher approved the flagged mark", "REJECT": "Teacher rejected the flagged mark"}
OUTCOME_TEXT = {"APPROVED": "was approved", "ABSENT": "was not accepted and is recorded as absent"}


def _conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def _remarks(previous: Optional[str], note: Optional[str]) -> Optional[str]:
    """The reason the mark was flagged stays; the teacher's note is added after it."""
    parts = [part for part in (previous, f"Teacher: {note}" if note else None) if part]
    return " ".join(parts) or None


async def _tell_student(record, occurrence, new_status: str) -> None:
    """The decision stands even if the student cannot be reached right now."""
    try:
        student = await db.student.find_unique(where={"id": record.studentId})
        if not student:
            return
        subject = occurrence.courseSection.subject.name
        await create_in_app_notification(
            title="Attendance reviewed",
            message=f"Your attendance for {subject} on {occurrence.date.date():%d %b} {OUTCOME_TEXT[new_status]}.",
            user_id=student.userId,
            tenant_id=occurrence.tenantId,
            type="success" if new_status == "APPROVED" else "warning",
            category="attendance",
        )
        await manager.send_personal_message(
            {"type": "attendance_updated", "occurrence_id": occurrence.id}, student.userId
        )
    except Exception as exc:
        logger.warning("Could not tell student %s about the review: %s", record.studentId, exc)


async def resolve_flagged(
    tenant_id: str, user: User, occurrence_id: str, record_id: str, decision: str, note: Optional[str]
) -> dict:
    occurrence = await db.classoccurrence.find_first(
        where={"id": occurrence_id, "tenantId": tenant_id},
        include={"courseSection": {"include": {"subject": True}}},
    )
    if not occurrence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found")
    await authorize_register_access(occurrence, user)
    note = (note or "").strip() or None
    if occurrence.isAttendanceLocked and not note:
        raise _conflict("This register is locked. Give a reason to decide on this mark; it is kept in the audit log.")

    record = await db.attendancerecord.find_first(
        where={"id": record_id, "occurrenceId": occurrence_id, "tenantId": tenant_id}
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    if record.status != "FLAGGED":
        raise _conflict("This mark has already been decided.")

    new_status = NEW_STATUS[decision]
    # Only a record that is still flagged is changed, so two quick clicks cannot both succeed.
    changed = await db.attendancerecord.update_many(
        where={"id": record.id, "status": "FLAGGED"},
        data={"status": new_status, "remarks": _remarks(record.remarks, note)},
    )
    if changed == 0:
        raise _conflict("This mark has already been decided.")
    await db.attendanceauditlog.create(
        data={
            "attendanceRecordId": record.id,
            "previousStatus": "FLAGGED",
            "newStatus": new_status,
            "changedById": user.id,
            "reason": note or AUDIT_REASON[decision],
        }
    )
    if occurrence.isAttendanceLocked:
        await refresh_streaks([record.studentId])
    await _tell_student(record, occurrence, new_status)
    return {"record_id": record.id, "student_id": record.studentId, "status": new_status}
