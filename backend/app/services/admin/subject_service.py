from typing import List, Optional
from prisma.models import Subject
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
        description: Optional[str] = None,
        department_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> Subject:
        resolved_dept_id = None
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
            found_dept = await db.department.find_first(where=dept_where)
            if found_dept:
                resolved_dept_id = found_dept.id

        data = {"name": name, "code": code, "description": description}
        if resolved_dept_id:
            data["departmentId"] = resolved_dept_id
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
        if "description" in data:
            update_data["description"] = data["description"]
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
        class_count = await db.academicclass.count(where={"subjectId": id})
        if class_count > 0:
            raise ValueError("Cannot delete subject because it is currently assigned.")
        await db.subject.delete(where={"id": id})
