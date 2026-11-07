from typing import List, Optional
from prisma.models import Classroom
from app.core.db_errors import DuplicateRecord
from app.db.client import db


class ClassroomService:
    @staticmethod
    async def get_all_classrooms(tenant_id: Optional[str] = None) -> List[Classroom]:
        where = {"tenantId": tenant_id} if tenant_id else {}
        return await db.classroom.find_many(where=where)

    @staticmethod
    async def get_classroom_by_id(id: str, tenant_id: Optional[str] = None) -> Optional[Classroom]:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        return await db.classroom.find_first(where=where)

    @staticmethod
    async def create_classroom(name: str, tenant_id: Optional[str] = None) -> Classroom:
        if await db.classroom.find_first(where={"tenantId": tenant_id, "name": {"equals": name, "mode": "insensitive"}}):
            raise DuplicateRecord(f"Classroom '{name}' already exists.")
        data = {"name": name}
        if tenant_id:
            data["tenantId"] = tenant_id
        return await db.classroom.create(data=data)

    @staticmethod
    async def update_classroom(id: str, data: dict, tenant_id: Optional[str] = None) -> Classroom:
        if tenant_id:
            classroom = await db.classroom.find_first(where={"id": id, "tenantId": tenant_id})
            if not classroom:
                raise ValueError("Classroom not found.")
        return await db.classroom.update(where={"id": id}, data=data)

    @staticmethod
    async def delete_classroom(id: str, tenant_id: Optional[str] = None) -> None:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        classroom = await db.classroom.find_first(where=where)
        if not classroom:
            raise ValueError("Classroom not found.")
        used_by_sections = await db.coursesection.count(where={"defaultRoomId": id})
        used_by_rules = await db.timetablerule.count(where={"classroomId": id})
        if used_by_sections + used_by_rules > 0:
            raise ValueError("Cannot delete classroom because it is currently assigned.")
        await db.classroom.delete(where={"id": id})
