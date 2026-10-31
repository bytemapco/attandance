from typing import List
from app.core.logging_config import get_logger
from app.db.client import db
from app.schemas.teacher import DeviceChangeResponse
from app.services.email_service import email_service

logger = get_logger("app.services.device_change_review")


class DeviceChangeReviewService:
    @staticmethod
    async def get_pending_requests(teacher_id: str) -> List[DeviceChangeResponse]:
        teacher_classes = await db.academicclass.find_many(where={"teacherId": teacher_id})
        teacher_class_ids = [c.id for c in teacher_classes]
        if not teacher_class_ids:
            return []

        where_filter: dict = {
            "status": "PENDING",
            "student": {"is": {"enrollments": {"some": {"academicClassId": {"in": teacher_class_ids}}}}},
        }

        records = await db.devicechangerequest.find_many(
            where=where_filter,
            include={"student": {"include": {"user": True}}},
            order={"createdAt": "desc"},
        )

        response_list = []
        for r in records:
            name = f"{r.student.firstName or ''} {r.student.lastName or ''}".strip()
            response_list.append(
                DeviceChangeResponse(
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
            )
        return response_list

    @staticmethod
    async def approve_request(request_id: str, teacher_id: str, new_status: str) -> bool:
        request_record = await db.devicechangerequest.find_unique(
            where={"id": request_id},
            include={"student": {"include": {"user": True}}},
        )
        if not request_record or request_record.status != "PENDING":
            return False

        teacher = await db.teacher.find_unique(where={"id": teacher_id}, include={"user": True})
        if not teacher:
            return False

        if teacher.user and request_record.student and request_record.student.user:
            teacher_tenant_id = getattr(teacher.user, "tenantId", None)
            student_tenant_id = getattr(request_record.student.user, "tenantId", None)
            if teacher_tenant_id and student_tenant_id and teacher_tenant_id != student_tenant_id:
                logger.warning(
                    "Cross-tenant device change approval blocked: teacher %s vs student %s",
                    teacher_id,
                    request_record.studentId,
                )
                return False

        teaches_student = await db.academicclass.find_first(
            where={
                "teacherId": teacher_id,
                "enrollments": {"some": {"studentId": request_record.studentId}},
            }
        )
        if not teaches_student:
            logger.warning(
                "Unauthorized device change review: teacher %s does not teach student %s",
                teacher_id,
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
            data={"status": new_status, "approvedBy": teacher_id},
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
