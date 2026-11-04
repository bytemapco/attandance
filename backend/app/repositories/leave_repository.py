from datetime import datetime, timezone
from typing import List, Optional

from prisma.models import LeaveRequest
from app.db.client import db
from app.repositories.student_repository import taught_by


class LeaveRepository:
    async def create(self, data: dict) -> LeaveRequest:
        return await db.leaverequest.create(data=data, include={"student": True})

    async def get_by_id(self, leave_id: str, tenant_id: str) -> Optional[LeaveRequest]:
        return await db.leaverequest.find_first(
            where={"id": leave_id, "tenantId": tenant_id}, include={"student": True}
        )

    async def get_by_student_id(self, student_id: str) -> List[LeaveRequest]:
        return await db.leaverequest.find_many(
            where={"studentId": student_id}, include={"student": True}, order={"createdAt": "desc"}
        )

    async def get_pending_for_teacher(self, tenant_id: str, teacher_id: str) -> List[LeaveRequest]:
        return await db.leaverequest.find_many(
            where={
                "tenantId": tenant_id,
                "status": "PENDING",
                "student": {"is": taught_by(teacher_id)},
            },
            include={"student": True},
            order={"createdAt": "asc"},
        )

    async def update_status(
        self, leave_id: str, status: str, approved_by: str, approver_note: Optional[str] = None
    ) -> Optional[LeaveRequest]:
        return await db.leaverequest.update(
            where={"id": leave_id},
            data={
                "status": status,
                "approvedBy": approved_by,
                "approverNote": approver_note,
                "updatedAt": datetime.now(timezone.utc),
            },
        )
