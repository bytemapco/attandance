import os
from prisma.models import Attendance
from app.core.logging_config import get_logger
from app.repositories.attendance_repository import AttendanceRepository
from app.services.gamification_service import GamificationService

logger = get_logger("app.attendance.recorder")


class AttendanceRecorder:
    def __init__(self) -> None:
        self.attendance_repo = AttendanceRepository()
        self.gamification_service = GamificationService()

    async def record_attendance(
        self,
        student_id: str,
        session_id: str,
        status: str,
        ai_results: dict,
        final_score: float,
        latitude: float,
        longitude: float,
        remarks: str | None,
        image_path: str | None = None,
    ) -> Attendance:
        effective_remarks = remarks
        if status == "Flagged" and image_path:
            if not effective_remarks:
                effective_remarks = f"[photo:{image_path}]"
            elif "[photo:" not in effective_remarks:
                effective_remarks = f"{effective_remarks} [photo:{image_path}]"

        record = await self.attendance_repo.create(
            {
                "studentId": student_id,
                "sessionId": session_id,
                "status": status,
                "faceScore": ai_results["face_score"],
                "livenessScore": ai_results["liveness_score"],
                "backgroundScore": ai_results["background_score"],
                "finalAiScore": final_score,
                "gpsLatitude": latitude,
                "gpsLongitude": longitude,
                "remarks": effective_remarks,
            }
        )

        try:
            await self.gamification_service.update_streak(student_id, status)
        except Exception as e:
            logger.warning("Streak update failed: %s", e)

        if status == "Present" and image_path:
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    logger.error("Failed to remove temp image %s: %s", image_path, e, exc_info=True)
            else:
                try:
                    from app.services.s3_service import s3_service

                    s3_service.delete_file(image_path)
                except Exception as e:
                    logger.warning("Failed to remove verified attendance image from S3: %s", e)

        return record
