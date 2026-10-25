from typing import List, Optional
from prisma.models import Designation
from app.db.client import db


class DesignationService:
    @staticmethod
    async def get_all_designations(tenant_id: Optional[str] = None) -> List[Designation]:
        where = {"tenantId": tenant_id} if tenant_id else {}
        return await db.designation.find_many(where=where)

    @staticmethod
    async def get_designation_by_id(id: str, tenant_id: Optional[str] = None) -> Optional[Designation]:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        return await db.designation.find_first(where=where)

    @staticmethod
    async def create_designation(
        name: str, code: str, description: Optional[str] = None, tenant_id: Optional[str] = None
    ) -> Designation:
        data = {"name": name, "code": code, "description": description}
        if tenant_id:
            data["tenantId"] = tenant_id
        return await db.designation.create(data=data)

    @staticmethod
    async def update_designation(id: str, data: dict, tenant_id: Optional[str] = None) -> Designation:
        if tenant_id:
            desig = await db.designation.find_first(where={"id": id, "tenantId": tenant_id})
            if not desig:
                raise ValueError("Designation not found.")
        return await db.designation.update(where={"id": id}, data=data)

    @staticmethod
    async def delete_designation(id: str, tenant_id: Optional[str] = None) -> None:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        desig = await db.designation.find_first(where=where)
        if not desig:
            raise ValueError("Designation not found.")
        teacher_count = await db.teacher.count(where={"designationId": id})
        if teacher_count > 0:
            raise ValueError("Cannot delete designation because it is currently assigned.")
        await db.designation.delete(where={"id": id})
