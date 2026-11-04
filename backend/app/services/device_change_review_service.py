from typing import List

from prisma.models import Teacher

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repository import taught_by
from app.schemas.teacher import DeviceChangeResponse
from app.services.email_service import email_service

logger = get_logger("app.services.device_change_review")


def _to_response(r) -> DeviceChangeResponse:
    name = f"{r.student.firstName or ''} {r.student.lastName or ''}".strip()
    return DeviceChangeResponse(
        id=r.id,
        student_id=r.studentId,
        student_name=name or "Unknown",
        enrollment_number=r.student.enrollmentNumber,
        new_device_uuid=r.newDeviceUuid,
        reason=r.reason,
        status=r.status,
        approved_by=r.approvedBy,
        created_at=r.createdAt,
        updated_at=r.updatedAt,
    )


class DeviceChangeReviewService:
    @staticmethod
    async def get_pending_requests(teacher: Teacher) -> List[DeviceChangeResponse]:
        records = await db.devicechangerequest.find_many(
            where={
                "tenantId": teacher.tenantId,
                "status": "PENDING",
                "student": {"is": taught_by(teacher.id)},
            },
            include={"student": {"include": {"user": True}}},
            order={"createdAt": "desc"},
        )
        return [_to_response(r) for r in records]

    @staticmethod
    async def approve_request(request_id: str, teacher: Teacher, new_status: str) -> bool:
        request_record = await db.devicechangerequest.find_first(
            where={"id": request_id, "tenantId": teacher.tenantId},
            include={"student": {"include": {"user": True}}},
        )
        if not request_record or request_record.status != "PENDING":
            return False

        teaches_student = await db.student.find_first(
            where={"id": request_record.studentId, "tenantId": teacher.tenantId, **taught_by(teacher.id)}
        )
        if not teaches_student:
            logger.warning(
                "Unauthorized device change review: teacher %s does not teach student %s",
                teacher.id,
                request_record.studentId,
            )
            return False

        if new_status == "APPROVED":
            await db.student.update(
                where={"id": request_record.studentId},
                data={"deviceUuid": request_record.newDeviceUuid},
            )

        await db.devicechangerequest.update(
            where={"id": request_id},
            data={"status": new_status, "approvedBy": teacher.id},
        )

        student = request_record.student
        if student and student.user:
            try:
                name = f"{student.firstName or ''} {student.lastName or ''}".strip() or "Student"
                await email_service.send_device_change_reviewed_email(
                    to_email=student.user.email,
                    recipient_name=name,
                    enrollment_number=student.enrollmentNumber,
                    status=new_status,
                )
            except Exception as e:
                logger.warning("Failed to dispatch device change reviewed email: %s", e)

        return True
