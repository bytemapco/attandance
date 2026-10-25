import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import Depends

from app.core.logging_config import get_logger
from app.db.redis import get_redis
from app.services.attendance.models import AttendanceSubmission
from app.services.attendance_service import AttendanceService

logger = get_logger("app.attendance.queue")


class AttendanceQueueService:
    JOB_PREFIX = "attendance:job:"
    JOB_TTL_SECONDS = 3600

    def __init__(self, attendance_service: AttendanceService = Depends()) -> None:
        self.attendance_service = attendance_service

    async def enqueue_submission(
        self,
        submission: AttendanceSubmission,
    ) -> str:
        job_id = str(uuid.uuid4())
        job_data: Dict[str, Any] = {
            "job_id": job_id,
            "student_id": submission.student_id,
            "session_id": submission.session_id,
            "status": "PENDING",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None,
        }

        r = await get_redis()
        await r.setex(
            f"{self.JOB_PREFIX}{job_id}",
            self.JOB_TTL_SECONDS,
            json.dumps(job_data),
        )

        # Dispatch background task to process verification
        asyncio.create_task(self._process_job(job_id, submission))
        return job_id

    async def _process_job(self, job_id: str, submission: AttendanceSubmission) -> None:
        r = await get_redis()
        try:
            # Update status to PROCESSING
            raw = await r.get(f"{self.JOB_PREFIX}{job_id}")
            if raw:
                job_data = json.loads(raw)
                job_data["status"] = "PROCESSING"
                job_data["updated_at"] = datetime.now(timezone.utc).isoformat()
                await r.setex(f"{self.JOB_PREFIX}{job_id}", self.JOB_TTL_SECONDS, json.dumps(job_data))

            # Run attendance verification
            record = await self.attendance_service.mark_attendance(submission)

            # Store completed outcome
            result_payload = {
                "id": record.id,
                "student_id": record.studentId,
                "session_id": record.sessionId,
                "status": record.status,
                "face_score": record.faceScore,
                "liveness_score": record.livenessScore,
                "background_score": record.backgroundScore,
                "final_ai_score": record.finalAiScore,
                "gps_latitude": record.gpsLatitude,
                "gps_longitude": record.gpsLongitude,
                "created_at": record.createdAt.isoformat()
                if hasattr(record.createdAt, "isoformat")
                else str(record.createdAt),
            }

            job_data = {
                "job_id": job_id,
                "student_id": submission.student_id,
                "session_id": submission.session_id,
                "status": "COMPLETED",
                "created_at": job_data.get("created_at"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "result": result_payload,
                "error": None,
            }
            await r.setex(f"{self.JOB_PREFIX}{job_id}", self.JOB_TTL_SECONDS, json.dumps(job_data))
            logger.info("Async attendance job %s completed successfully: %s", job_id, record.status)
        except Exception as exc:
            logger.error("Async attendance job %s failed: %s", job_id, exc)
            job_data = {
                "job_id": job_id,
                "student_id": submission.student_id,
                "session_id": submission.session_id,
                "status": "FAILED",
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "result": None,
                "error": str(exc),
            }
            await r.setex(f"{self.JOB_PREFIX}{job_id}", self.JOB_TTL_SECONDS, json.dumps(job_data))

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        r = await get_redis()
        raw = await r.get(f"{self.JOB_PREFIX}{job_id}")
        if not raw:
            return None
        return json.loads(raw)
