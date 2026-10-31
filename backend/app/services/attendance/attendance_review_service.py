import json
from typing import Optional
from prisma.models import Attendance
from app.core.logging_config import get_logger
from app.core.security import decode_access_token
from app.db.redis import safe_redis
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

    async def confirm_attendance(self, student_id: str, review_token: str, active_session_fetcher) -> Attendance:
        payload = decode_access_token(review_token)
        if not payload or payload.get("type") != "attendance_review" or payload.get("sub") != student_id:
            raise ValueError("Invalid, expired, or mismatched review token.")

        review_id = payload.get("review_id")
        if not review_id:
            raise ValueError("Invalid, expired, or mismatched review token.")

        redis = safe_redis()
        if not redis:
            raise ValueError("Review cache is temporarily unavailable. Please retry in a few moments.")
        cached_data = await redis.get(f"attendance_review:{review_id}")
        if not cached_data:
            raise ValueError("Invalid, expired, or mismatched review token.")

        await redis.delete(f"attendance_review:{review_id}")
        review_info = json.loads(cached_data)

        session = await active_session_fetcher(review_info["session_id"])
        if await self.attendance_repo.get_by_student_and_session(student_id, review_info["session_id"]):
            raise ValueError("Attendance already submitted for this session.")

        status = review_info["predicted_status"]
        remarks = "Missing Geofence Data" if review_info.get("geofence_missing") else None
        record = await self.recorder.record_attendance(
            student_id,
            review_info["session_id"],
            status,
            {
                "face_score": review_info["face_score"],
                "liveness_score": review_info["liveness_score"],
                "background_score": review_info["background_score"],
            },
            review_info["final_ai_score"],
            review_info["latitude"],
            review_info["longitude"],
            remarks,
            review_info.get("image_path"),
        )
        await self.notifier.broadcast_attendance_update(review_info["session_id"], student_id, status)
        if status == "Flagged":
            await self.notifier.dispatch_flagged_notifications(student_id, session.academicClassId, record.id)
        return record

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
