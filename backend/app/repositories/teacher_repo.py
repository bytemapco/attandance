from prisma.models import Teacher
from app.db.client import db


class TeacherRepository:
    async def get_by_id(self, teacher_id: str) -> Teacher | None:
        return await db.teacher.find_unique(where={"id": teacher_id}, include={"user": True})

    async def get_by_user_id(self, user_id: str) -> Teacher | None:
        return await db.teacher.find_unique(where={"userId": user_id}, include={"user": True})

    async def get_by_employee_id(self, employee_id: str) -> Teacher | None:
        return await db.teacher.find_unique(where={"employeeId": employee_id}, include={"user": True})
