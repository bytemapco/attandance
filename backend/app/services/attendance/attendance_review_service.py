from typing import Optional
from app.core.logging_config import get_logger
from app.repositories.attendance_repository import AttendanceRepository
from app.services.attendance.attendance_notifier import AttendanceNotifier
from app.services.attendance.attendance_recorder import AttendanceRecorder

logger = get_logger("app.attendance.review")


class AttendanceReviewService:
    def __init__(
        self,
        attendance_repo: Optional[AttendanceRepository] = None,
        recorder: Optional[AttendanceRecorder] = None,
        notifier: Optional[AttendanceNotifier] = None,
    ) -> None:
        self.attendance_repo = attendance_repo or AttendanceRepository()
        self.recorder = recorder or AttendanceRecorder()
        self.notifier = notifier or AttendanceNotifier()

    async def review_attendance(
        self, attendance_id: str, status: str, remarks: str, teacher_id: Optional[str] = None
    ) -> bool:
        record = await self.attendance_repo.get_by_id(attendance_id)
        if not record or record.status != "Flagged":
            return False
        if teacher_id and record.session and record.session.academicClass:
            if record.session.academicClass.teacherId != teacher_id:
                logger.warning(
                    "Unauthorized attendance review attempt by teacher %s on record %s", teacher_id, attendance_id
                )
                return False
        await self.attendance_repo.update_review(attendance_id, status, remarks)
        await self.notifier.broadcast_attendance_update(record.sessionId, record.studentId, status)
        try:
            from app.services.gamification_service import GamificationService

            await GamificationService().recalculate_student_streak(record.studentId)
        except Exception as e:
            logger.warning("Recalculate streak error: %s", e)
        return True
