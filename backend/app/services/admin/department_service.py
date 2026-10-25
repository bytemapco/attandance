from typing import List, Optional
from prisma.models import Department
from app.db.client import db


class DepartmentService:
    @staticmethod
    async def get_all_departments(tenant_id: Optional[str] = None) -> List[Department]:
        where = {"tenantId": tenant_id} if tenant_id else {}
        return await db.department.find_many(where=where)

    @staticmethod
    async def get_department_by_id(id: str, tenant_id: Optional[str] = None) -> Optional[Department]:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        return await db.department.find_first(where=where)

    @staticmethod
    async def create_department(
        name: str,
        code: str,
        head: Optional[str] = None,
        description: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> Department:
        data = {"name": name, "code": code, "head": head, "description": description}
        if tenant_id:
            data["tenantId"] = tenant_id
        return await db.department.create(data=data)

    @staticmethod
    async def update_department(id: str, data: dict, tenant_id: Optional[str] = None) -> Department:
        if tenant_id:
            dept = await db.department.find_first(where={"id": id, "tenantId": tenant_id})
            if not dept:
                raise ValueError("Department not found.")
        return await db.department.update(where={"id": id}, data=data)

    @staticmethod
    async def delete_department(id: str, tenant_id: Optional[str] = None) -> None:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        dept = await db.department.find_first(where=where)
        if not dept:
            raise ValueError("Department not found.")
        teacher_count = await db.teacher.count(where={"departmentId": id})
        if teacher_count > 0:
            raise ValueError("Cannot delete department because it is currently assigned.")
        student_count = await db.student.count(where={"departmentId": id})
        if student_count > 0:
            raise ValueError("Cannot delete department because it is currently assigned.")
        await db.department.delete(where={"id": id})
