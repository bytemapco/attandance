from typing import List, Optional
from prisma.models import Subject
from app.core.db_errors import DuplicateRecord
from app.db.client import db


class SubjectService:
    @staticmethod
    async def get_all_subjects(tenant_id: Optional[str] = None) -> List[Subject]:
        where = {"tenantId": tenant_id} if tenant_id else {}
        return await db.subject.find_many(where=where)

    @staticmethod
    async def get_subject_by_id(id: str, tenant_id: Optional[str] = None) -> Optional[Subject]:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        return await db.subject.find_first(where=where)

    @staticmethod
    async def create_subject(
        name: str,
        code: str,
        department_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> Subject:
        if await db.subject.find_first(where={"tenantId": tenant_id, "code": {"equals": code, "mode": "insensitive"}}):
            raise DuplicateRecord(f"Subject code '{code}' already exists.")
        data = {"name": name, "code": code}
        if department_id:
            dept_where = {
                "OR": [
                    {"id": department_id},
                    {"code": {"equals": department_id, "mode": "insensitive"}},
                    {"name": {"equals": department_id, "mode": "insensitive"}},
                ]
            }
            if tenant_id:
                dept_where["tenantId"] = tenant_id
            department = await db.department.find_first(where=dept_where)
            if not department:
                raise ValueError(f"Department '{department_id}' not found.")
            data["departmentId"] = department.id
        if tenant_id:
            data["tenantId"] = tenant_id
        return await db.subject.create(data=data)

    @staticmethod
    async def update_subject(id: str, data: dict, tenant_id: Optional[str] = None) -> Subject:
        if tenant_id:
            sub = await db.subject.find_first(where={"id": id, "tenantId": tenant_id})
            if not sub:
                raise ValueError("Subject not found.")
        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "code" in data:
            update_data["code"] = data["code"]
        if "department_id" in data:
            update_data["departmentId"] = data["department_id"]
        return await db.subject.update(where={"id": id}, data=update_data)

    @staticmethod
    async def delete_subject(id: str, tenant_id: Optional[str] = None) -> None:
        where = {"id": id}
        if tenant_id:
            where["tenantId"] = tenant_id
        sub = await db.subject.find_first(where=where)
        if not sub:
            raise ValueError("Subject not found.")
        section_count = await db.coursesection.count(where={"subjectId": id})
        if section_count > 0:
            raise ValueError("Cannot delete subject because it is currently assigned.")
        await db.subject.delete(where={"id": id})
