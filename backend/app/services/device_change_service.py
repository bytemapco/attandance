from typing import List
from fastapi import HTTPException, status
from app.core.logging_config import get_logger
from app.core.security import verify_password
from app.db.client import db
from app.repositories.user_repo import UserRepository
from app.repositories.student_repo import StudentRepository
from app.schemas.auth import DeviceChangeRequestCreate
from app.schemas.teacher import DeviceChangeResponse
from app.services.email_service import email_service

logger = get_logger("app.services.device_change")


class DeviceChangeService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()
        self.student_repo = StudentRepository()

    async def request_device_change(self, data: DeviceChangeRequestCreate) -> None:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashedPassword) or user.role != "STUDENT":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        student = await self.student_repo.get_by_user_id(user.id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

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
        teacher_classes = await db.academicclass.find_many(where={"teacherId": teacher_id})
        teacher_class_ids = [c.id for c in teacher_classes]

        where_filter: dict = {"status": "PENDING"}
        if teacher_class_ids:
            where_filter["student"] = {"is": {"enrollments": {"some": {"academicClassId": {"in": teacher_class_ids}}}}}
        else:
            teacher = await db.teacher.find_unique(where={"id": teacher_id}, include={"user": True})
            tid = getattr(teacher.user, "tenantId", None) if (teacher and teacher.user) else None
            if tid:
                where_filter["student"] = {"is": {"user": {"is": {"tenantId": tid}}}}

        records = await db.devicechangerequest.find_many(
            where=where_filter,
            include={
                "student": {
                    "include": {
                        "user": True,
                    }
                }
            },
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

    async def approve_request(self, request_id: str, teacher_id: str, new_status: str) -> bool:
        request_record = await db.devicechangerequest.find_unique(
            where={"id": request_id},
            include={"student": {"include": {"user": True}}},
        )
        if not request_record or request_record.status != "PENDING":
            return False

        teacher = await db.teacher.find_unique(where={"id": teacher_id}, include={"user": True})
        if teacher and teacher.user and request_record.student and request_record.student.user:
            t_tid = getattr(teacher.user, "tenantId", None)
            s_tid = getattr(request_record.student.user, "tenantId", None)
            if t_tid and s_tid and t_tid != s_tid:
                logger.warning(
                    "Cross-tenant device change approval blocked: teacher %s vs student %s",
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
            data={
                "status": new_status,
                "approvedBy": teacher_id,
            },
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
