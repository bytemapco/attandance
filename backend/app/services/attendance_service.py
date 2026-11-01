from typing import Optional
from prisma.models import Attendance
from app.core.logging_config import get_logger
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.student_repository import StudentRepository
from app.services.ai_orchestrator import AIOrchestrator
from app.services.system_config_service import SystemConfigService
from app.services.attendance.geofence_validator import GeofenceValidator
from app.services.attendance.attendance_notifier import AttendanceNotifier
from app.services.attendance.attendance_recorder import AttendanceRecorder
from app.services.attendance.attendance_review_service import AttendanceReviewService
from app.services.attendance.face_registration_service import FaceRegistrationService
from app.services.attendance.session_cache_resolver import resolve_active_session
from app.services.attendance.models import CachedSession, AttendanceSubmission

logger = get_logger("app.attendance")


class AttendanceService:
    def __init__(self) -> None:
        self.attendance_repo = AttendanceRepository()
        self.session_repo = SessionRepository()
        self.student_repo = StudentRepository()
        self.ai_orchestrator = AIOrchestrator()
        self.geofence_validator = GeofenceValidator()
        self.notifier = AttendanceNotifier()
        self.recorder = AttendanceRecorder()
        self.review_service = AttendanceReviewService(self.attendance_repo, self.recorder, self.notifier)
        self.face_service = FaceRegistrationService(self.student_repo, self.ai_orchestrator)

    async def _get_active_session(self, session_id: str) -> CachedSession:
        return await resolve_active_session(session_id, self.session_repo)

    async def mark_attendance(self, submission: AttendanceSubmission) -> Attendance:
        session = await self._get_active_session(submission.session_id)
        config = await SystemConfigService().get_config()

        geofence_missing, remarks = False, None
        if config.isGpsVerificationEnabled:
            geofence_missing, remarks = await self.geofence_validator.validate_student_location(
                session.academicClassId, submission.student_id, submission.latitude, submission.longitude, submission.accuracy
            )

        face_embedding = await self.student_repo.get_face_embedding(submission.student_id) if config.isFaceRecognitionEnabled else []
        if config.isFaceRecognitionEnabled and not face_embedding:
            raise ValueError("Student face embedding is not registered.")

        if await self.attendance_repo.get_by_student_and_session(submission.student_id, submission.session_id):
            raise ValueError("Attendance already submitted for this session.")

        if config.isFaceRecognitionEnabled or config.isAiBackgroundValidationEnabled:
            if not submission.image_path:
                raise ValueError("Image is required when verification is enabled.")
            ai_results = await self.ai_orchestrator.analyze_attendance(submission.image_path, face_embedding)
        else:
            logger.info("Biometric and background verification disabled by policy for session %s", submission.session_id)
            ai_results = {"face_score": 0.0, "liveness_score": 0.0, "background_score": 0.0}
            verification_note = "[AI verification disabled by policy]"
            remarks = f"{remarks} {verification_note}".strip() if remarks else verification_note

        active_scores = []
        is_verified = True
        if config.isFaceRecognitionEnabled:
            active_scores.extend([ai_results["face_score"], ai_results["liveness_score"]])
            if ai_results["face_score"] < 0.60 or ai_results["liveness_score"] < 0.50:
                is_verified = False
        if config.isAiBackgroundValidationEnabled:
            active_scores.append(ai_results["background_score"])
            if ai_results["background_score"] < 0.50:
                is_verified = False

        final_score = round(sum(active_scores) / len(active_scores), 4) if active_scores else 1.0
        status = "Flagged" if (geofence_missing or not is_verified) else "Present"

        record = await self.recorder.record_attendance(
            submission.student_id, submission.session_id, status, ai_results, final_score,
            submission.latitude, submission.longitude, remarks, submission.image_path
        )
        await self.notifier.broadcast_attendance_update(submission.session_id, submission.student_id, status)
        if status == "Flagged":
            await self.notifier.dispatch_flagged_notifications(submission.student_id, session.academicClassId, record.id)
        return record

    async def register_face(self, student_id: str, image_input: str | bytes) -> bool:
        return await self.face_service.register_face(student_id, image_input)

    async def review_attendance(self, attendance_id: str, status: str, remarks: str, teacher_id: Optional[str] = None) -> bool:
        return await self.review_service.review_attendance(attendance_id, status, remarks, teacher_id)
