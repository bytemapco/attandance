from typing import List
from fastapi import HTTPException, status
from app.core.logging_config import get_logger
from app.core.security import verify_password
from app.core.redis_scripts import atomic_incr_expire
from app.db.client import db
from app.db.redis import safe_redis
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.auth import DeviceChangeRequestCreate
from app.schemas.teacher import DeviceChangeResponse
from app.services.email_service import email_service

logger = get_logger("app.services.device_change")


class DeviceChangeService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()
        self.student_repo = StudentRepository()

    async def _resolve_student(self, identifier: str):
        if "@" in identifier:
            user = await self.user_repo.get_by_email(identifier.lower())
            student = await self.student_repo.get_by_user_id(user.id) if user else None
            return user, student
        student = await self.student_repo.get_by_enrollment(identifier)
        if student and student.user:
            return student.user, student
        user = await self.user_repo.get_by_email(identifier.lower())
        student = await self.student_repo.get_by_user_id(user.id) if user else None
        return user, student

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

        user, student = await self._resolve_student(data.email.strip())
        if not user or not verify_password(data.password, user.hashedPassword) or user.role != "STUDENT":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials or not a student account")
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

        active_enrollment = await db.enrollment.find_first(
            where={"studentId": student.id}, include={"academicClass": True}
        )
        if not active_enrollment or not active_enrollment.academicClass or not active_enrollment.academicClass.teacherId:
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
                    "studentId": student.id,
                    "newDeviceUuid": data.new_device_uuid,
                    "reason": data.reason,
                    "status": "PENDING",
                }
            )

        try:
            name = f"{student.firstName or ''} {student.lastName or ''}".strip() or "Student"
            await email_service.send_device_change_requested_email(
                to_email=user.email,
                recipient_name=name,
                enrollment_number=student.enrollmentNumber,
                new_device_uuid=data.new_device_uuid,
                reason=data.reason,
            )
        except Exception as e:
            logger.warning("Failed to dispatch device change requested email: %s", e)

    async def get_pending_requests(self, teacher_id: str) -> List[DeviceChangeResponse]:
        from app.services.device_change_review_service import DeviceChangeReviewService
        return await DeviceChangeReviewService.get_pending_requests(teacher_id)

    async def approve_request(self, request_id: str, teacher_id: str, new_status: str) -> bool:
        from app.services.device_change_review_service import DeviceChangeReviewService
        return await DeviceChangeReviewService.approve_request(request_id, teacher_id, new_status)
