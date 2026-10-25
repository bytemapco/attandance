import json
from datetime import datetime, timezone, timedelta
from typing import Optional
from prisma.models import Attendance
from app.core.logging_config import get_logger
from app.core.security import create_access_token, decode_access_token
from app.db.redis import get_redis
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.student_repo import StudentRepository
from app.services.ai_orchestrator import AIOrchestrator
from app.services.system_config_service import SystemConfigService
from app.services.attendance.geofence_validator import GeofenceValidator
from app.services.attendance.attendance_notifier import AttendanceNotifier
from app.services.attendance.attendance_recorder import AttendanceRecorder

logger = get_logger("app.attendance")

from app.services.attendance.models import CachedSession, AttendanceSubmission


class AttendanceService:
    def __init__(self) -> None:
        self.attendance_repo = AttendanceRepository()
        self.session_repo = SessionRepository()
        self.student_repo = StudentRepository()
        self.ai_orchestrator = AIOrchestrator()
        self.geofence_validator = GeofenceValidator()
        self.notifier = AttendanceNotifier()
        self.recorder = AttendanceRecorder()

    async def _get_active_session(self, session_id: str) -> CachedSession:
        cache_key = f"session:{session_id}"
        session = None
        try:
            cached = await get_redis().get(cache_key)
            if cached:
                data = json.loads(cached)
                session = CachedSession(
                    id=data["id"],
                    is_active=data["isActive"],
                    academic_class_id=data["academicClassId"],
                    end_time=datetime.fromisoformat(data["endTime"].replace("Z", "+00:00")),
                )
        except Exception:
            logger.warning("Redis session cache read failed.")

        if not session:
            db_session = await self.session_repo.get_by_id(session_id)
            if not db_session:
                raise ValueError("Attendance session is not active or not found.")
            session = CachedSession(
                id=db_session.id,
                is_active=db_session.isActive,
                academic_class_id=db_session.academicClassId,
                end_time=db_session.endTime,
            )

        now = datetime.now(timezone.utc)
        session_end = (
            session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        )
        if not session.isActive or session_end <= now:
            if session.isActive:
                await self.session_repo.deactivate(session.id)
                try:
                    await get_redis().delete(cache_key)
                except Exception as del_err:
                    logger.debug("Failed deleting session cache key %s: %s", cache_key, del_err)
            raise ValueError("Attendance session is not active or not found.")
        return session

    async def mark_attendance(self, submission: AttendanceSubmission) -> Attendance:
        session = await self._get_active_session(submission.session_id)
        config = await SystemConfigService().get_config()

        geofence_missing, remarks = False, None
        if config.isGpsVerificationEnabled:
            geofence_missing, remarks = await self.geofence_validator.validate_student_location(
                session.academicClassId,
                submission.student_id,
                submission.latitude,
                submission.longitude,
                submission.accuracy,
            )

        face_embedding = (
            await self.student_repo.get_face_embedding(submission.student_id) if config.isFaceRecognitionEnabled else []
        )
        if config.isFaceRecognitionEnabled and not face_embedding:
            raise ValueError("Student face embedding is not registered.")

        if await self.attendance_repo.get_by_student_and_session(submission.student_id, submission.session_id):
            raise ValueError("Attendance already submitted for this session.")

        if config.isFaceRecognitionEnabled or config.isAiBackgroundValidationEnabled:
            if not submission.image_path:
                raise ValueError("Image is required when verification is enabled.")
            ai_results = await self.ai_orchestrator.analyze_attendance(submission.image_path, face_embedding)
        else:
            ai_results = {"face_score": 1.0, "liveness_score": 1.0, "background_score": 1.0}

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
            submission.student_id,
            submission.session_id,
            status,
            ai_results,
            final_score,
            submission.latitude,
            submission.longitude,
            remarks,
            submission.image_path,
        )
        await self.notifier.broadcast_attendance_update(submission.session_id, submission.student_id, status)
        if status == "Flagged":
            await self.notifier.dispatch_flagged_notifications(
                submission.student_id, session.academicClassId, record.id
            )
        return record

    async def analyze_attendance(self, submission: AttendanceSubmission) -> dict:
        session = await self._get_active_session(submission.session_id)
        config = await SystemConfigService().get_config()

        geofence_missing = False
        if config.isGpsVerificationEnabled:
            geofence_missing, _ = await self.geofence_validator.validate_student_location(
                session.academicClassId,
                submission.student_id,
                submission.latitude,
                submission.longitude,
                submission.accuracy,
            )

        face_embedding = (
            await self.student_repo.get_face_embedding(submission.student_id) if config.isFaceRecognitionEnabled else []
        )
        if config.isFaceRecognitionEnabled and not face_embedding:
            raise ValueError("Student face embedding is not registered.")

        if await self.attendance_repo.get_by_student_and_session(submission.student_id, submission.session_id):
            raise ValueError("Attendance already submitted for this session.")

        if config.isFaceRecognitionEnabled or config.isAiBackgroundValidationEnabled:
            if not submission.image_path:
                raise ValueError("Image is required when verification is enabled.")
            ai_results = await self.ai_orchestrator.analyze_attendance(submission.image_path, face_embedding)
        else:
            ai_results = {"face_score": 1.0, "liveness_score": 1.0, "background_score": 1.0}

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
        predicted_status = "Flagged" if (geofence_missing or not is_verified) else "Present"

        token_data = {
            "type": "attendance_review",
            "session_id": submission.session_id,
            "face_score": ai_results["face_score"],
            "liveness_score": ai_results["liveness_score"],
            "background_score": ai_results["background_score"],
            "final_ai_score": final_score,
            "predicted_status": predicted_status,
            "geofence_missing": geofence_missing,
            "image_path": submission.image_path,
            "latitude": submission.latitude,
            "longitude": submission.longitude,
        }
        review_token = create_access_token(
            subject=submission.student_id, role="STUDENT", expires_delta=timedelta(minutes=5), extra_data=token_data
        )
        return {
            **ai_results,
            "final_ai_score": final_score,
            "predicted_status": predicted_status,
            "review_token": review_token,
        }

    async def confirm_attendance(self, student_id: str, review_token: str) -> Attendance:
        payload = decode_access_token(review_token)
        if not payload or payload.get("type") != "attendance_review" or payload.get("sub") != student_id:
            raise ValueError("Invalid, expired, or mismatched review token.")

        session = await self._get_active_session(payload["session_id"])
        if await self.attendance_repo.get_by_student_and_session(student_id, payload["session_id"]):
            raise ValueError("Attendance already submitted for this session.")

        status = payload["predicted_status"]
        remarks = "Missing Geofence Data" if payload.get("geofence_missing") else None
        record = await self.recorder.record_attendance(
            student_id,
            payload["session_id"],
            status,
            {
                "face_score": payload["face_score"],
                "liveness_score": payload["liveness_score"],
                "background_score": payload["background_score"],
            },
            payload["final_ai_score"],
            payload["latitude"],
            payload["longitude"],
            remarks,
            payload.get("image_path"),
        )
        await self.notifier.broadcast_attendance_update(payload["session_id"], student_id, status)
        if status == "Flagged":
            await self.notifier.dispatch_flagged_notifications(student_id, session.academicClassId, record.id)
        return record

    async def register_face(self, student_id: str, image_input: str | bytes) -> bool:
        embedding = await self.ai_orchestrator.extract_face_embedding(image_input)
        if not embedding:
            return False
        await self.student_repo.update_face_embedding(student_id, embedding)
        return True

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
