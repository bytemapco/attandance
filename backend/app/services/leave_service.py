from typing import Optional

from prisma.models import LeaveRequest, Teacher

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.leave_repository import LeaveRepository
from app.repositories.student_repository import taught_by
from app.services.occurrence_closer import refresh_streaks

logger = get_logger("app.leave_service")


class LeaveService:
    def __init__(self):
        self.leave_repo = LeaveRepository()

    async def approve_leave(
        self, leave_id: str, teacher: Teacher, status: str, approver_note: Optional[str] = None
    ) -> Optional[LeaveRequest]:
        leave = await self.leave_repo.get_by_id(leave_id, teacher.tenantId)
        if not leave:
            return None

        teaches = await db.student.find_first(
            where={"id": leave.studentId, "tenantId": teacher.tenantId, **taught_by(teacher.id)}
        )
        if not teaches:
            logger.warning("Teacher %s is not assigned to student %s and cannot decide this leave", teacher.id, leave.studentId)
            return None

        updated_leave = await self.leave_repo.update_status(
            leave_id=leave_id, status=status, approved_by=teacher.id, approver_note=approver_note
        )
        if status == "APPROVED":
            await self._excuse_closed_classes(leave, teacher)
            logger.info("Leave approved: student=%s dates=%s to %s", leave.studentId, leave.startDate, leave.endDate)
        return updated_leave

    async def _excuse_closed_classes(self, leave: LeaveRequest, teacher: Teacher) -> None:
        """Classes already closed during the leave turn from absent to excused. Open classes are handled when they close."""
        enrollments = await db.courseenrollment.find_many(
            where={"studentId": leave.studentId, "status": "ACTIVE", "endedAt": None}
        )
        occurrences = await db.classoccurrence.find_many(
            where={
                "tenantId": leave.tenantId,
                "courseSectionId": {"in": [e.courseSectionId for e in enrollments]},
                "status": "CONDUCTED",
                "isAttendanceLocked": True,
                "date": {"gte": leave.startDate, "lte": leave.endDate},
            },
            include={"attendanceRecords": {"where": {"studentId": leave.studentId}}},
        )
        reason = f"Approved leave: {leave.reason}"
        changed = 0
        for occurrence in occurrences:
            existing = occurrence.attendanceRecords[0] if occurrence.attendanceRecords else None
            if existing and existing.status != "ABSENT":
                continue
            record = await self._set_excused(leave, occurrence, existing, reason)
            await db.attendanceauditlog.create(
                data={
                    "attendanceRecordId": record.id,
                    "previousStatus": existing.status if existing else "ABSENT",
                    "newStatus": "EXCUSED",
                    "changedById": teacher.userId,
                    "reason": reason,
                }
            )
            changed += 1
        if changed:
            await refresh_streaks([leave.studentId])

    @staticmethod
    async def _set_excused(leave: LeaveRequest, occurrence, existing, reason: str):
        fields = {"status": "EXCUSED", "method": "SYSTEM_EXCUSED", "remarks": reason}
        if existing:
            return await db.attendancerecord.update(where={"id": existing.id}, data=fields)
        return await db.attendancerecord.create(
            data={**fields, "tenantId": leave.tenantId, "occurrenceId": occurrence.id, "studentId": leave.studentId}
        )
