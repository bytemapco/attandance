from typing import List
from fastapi import HTTPException, status
from prisma.models import Teacher
from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_incr_expire
from app.db.client import db
from app.db.redis import safe_redis
from app.repositories.student_repository import StudentRepository
from app.schemas.auth import DeviceChangeRequestCreate
from app.schemas.teacher import DeviceChangeResponse
from app.services.email_queue import enqueue_email
from app.services.login_identity import find_candidate_users, pick_user_by_password
from app.services.device_change_review_service import DeviceChangeReviewService

logger = get_logger("app.services.device_change")


class DeviceChangeService:
    def __init__(self) -> None:
        self.student_repo = StudentRepository()

    async def request_device_change(self, data: DeviceChangeRequestCreate) -> None:
        r = safe_redis()
        if r:
            rate_key = f"rate_limit:device_change:{data.email.strip().lower()}"
            try:
                attempts = await atomic_incr_expire(r, rate_key, 900)
                if attempts > 5:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many device change attempts for this account. Please try again after 15 minutes.",
                    )
            except HTTPException:
                raise
            except Exception as exc:
                logger.warning("Redis device change rate limit error: %s", exc)

        candidates = await find_candidate_users(data.email.strip(), data.tenant_slug)
        user = await pick_user_by_password(candidates, data.password)
        if not user or user.role != "STUDENT":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials or not a student account")
        student = await self.student_repo.get_by_user_id(user.id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

        has_teacher = await db.courseenrollment.find_first(
            where={
                "studentId": student.id,
                "status": "ACTIVE",
                "endedAt": None,
                "courseSection": {"is": {"faculties": {"some": {}}}},
            }
        )
        if not has_teacher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No teacher assigned yet. Kindly contact your faculty or administration.",
            )

        pending_request = await db.devicechangerequest.find_first(
            where={
                "studentId": student.id,
                "status": "PENDING",
            }
        )

        if pending_request:
            await db.devicechangerequest.update(
                where={"id": pending_request.id},
                data={
                    "newDeviceUuid": data.new_device_uuid,
                    "reason": data.reason,
                },
            )
        else:
            await db.devicechangerequest.create(
                data={
                    "tenantId": student.tenantId,
                    "studentId": student.id,
                    "newDeviceUuid": data.new_device_uuid,
                    "reason": data.reason,
                    "status": "PENDING",
                }
            )

        try:
            name = f"{student.firstName or ''} {student.lastName or ''}".strip() or "Student"
            await enqueue_email(
                "send_device_change_requested_email",
                to_email=user.email,
                recipient_name=name,
                enrollment_number=student.enrollmentNumber,
                new_device_uuid=data.new_device_uuid,
                reason=data.reason,
            )
        except Exception as e:
            logger.warning("Failed to queue the device change requested email: %s", e)

    async def get_pending_requests(self, teacher: Teacher) -> List[DeviceChangeResponse]:
        return await DeviceChangeReviewService.get_pending_requests(teacher)

    async def approve_request(self, request_id: str, teacher: Teacher, new_status: str) -> bool:
        return await DeviceChangeReviewService.approve_request(request_id, teacher, new_status)
