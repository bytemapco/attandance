from typing import List, Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassCreate, ClassDetail, ClassSummary, ClassUpdate
from app.services.batch_service import resolve_assignable_batch
from app.services.class_management.class_member_service import place_students
from app.services.class_management.common import (
    build_detail,
    build_summary,
    class_code,
    get_class_group,
    require_students_in_tenant,
)

LIST_INCLUDE = {
    "department": True,
    "members": {"where": {"status": "ACTIVE"}},
    "courseSections": True,
}


async def _resolve_class_batch(tenant_id: str, data: ClassCreate):
    try:
        return await resolve_assignable_batch(tenant_id, data.batch_id, data.department_id)
    except ValueError as err:
        code = status.HTTP_404_NOT_FOUND if "not found" in str(err).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=str(err)) from err


async def _require_placeable(tenant_id: str, student_ids: List[str]) -> None:
    if not student_ids:
        return
    await require_students_in_tenant(tenant_id, student_ids)
    busy = await db.classmember.count(
        where={"tenantId": tenant_id, "studentId": {"in": student_ids}, "status": "ACTIVE"}
    )
    if busy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{busy} selected student(s) are already in another class; remove them from it first.",
        )


async def _open_group(tenant_id: str, department, batch, semester_number: int):
    """Returns (group, created). An archived class for the same batch is reopened instead of duplicated."""
    where = {"tenantId": tenant_id, "departmentId": department.id, "batch": batch.code}
    existing = await db.studentgroup.find_first(where=where)
    if existing and existing.status == "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Class {class_code(department.code, batch.code)} already exists.",
        )
    if existing:
        reopened = await db.studentgroup.update(
            where={"id": existing.id},
            data={"status": "ACTIVE", "batchId": batch.id, "semester": semester_number},
        )
        return reopened, False
    created = await db.studentgroup.create(data={**where, "batchId": batch.id, "semester": semester_number})
    return created, True


async def create_class(tenant_id: str, data: ClassCreate) -> ClassDetail:
    department = await db.department.find_first(where={"id": data.department_id, "tenantId": tenant_id})
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")
    batch = await _resolve_class_batch(tenant_id, data)
    student_ids = list(dict.fromkeys(data.student_ids))
    await _require_placeable(tenant_id, student_ids)
    group, created = await _open_group(tenant_id, department, batch, data.semester_number)
    try:
        loaded = await get_class_group(tenant_id, group.id)
        if student_ids:
            await place_students(tenant_id, loaded, student_ids)
            loaded = await get_class_group(tenant_id, group.id)
        return build_detail(loaded)
    except Exception:
        if created:
            await db.studentgroup.delete(where={"id": group.id})
        raise


async def update_class(tenant_id: str, class_id: str, data: ClassUpdate) -> ClassDetail:
    await get_class_group(tenant_id, class_id)
    await db.studentgroup.update(where={"id": class_id}, data={"semester": data.semester_number})
    return build_detail(await get_class_group(tenant_id, class_id))


async def list_classes(
    tenant_id: str,
    department_id: Optional[str] = None,
    semester_number: Optional[int] = None,
    search: Optional[str] = None,
) -> List[ClassSummary]:
    where: dict = {"tenantId": tenant_id}
    if department_id:
        where["departmentId"] = department_id
    if semester_number:
        where["semester"] = semester_number
    groups = await db.studentgroup.find_many(where=where, include=LIST_INCLUDE, order={"createdAt": "desc"})
    summaries = [build_summary(g) for g in groups]
    if search:
        needle = search.strip().lower()
        summaries = [s for s in summaries if needle in s.code.lower()]
    return summaries


async def get_class(tenant_id: str, class_id: str) -> ClassDetail:
    return build_detail(await get_class_group(tenant_id, class_id))
