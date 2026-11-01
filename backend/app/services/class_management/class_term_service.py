from typing import List, Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassCreate, ClassDetail, ClassSummary
from app.services.batch_service import resolve_assignable_batch
from app.services.class_management.class_member_service import place_students
from app.services.class_management.common import (
    build_detail,
    build_summary,
    class_code,
    get_class_term,
    require_students_in_tenant,
)

LIST_INCLUDE = {
    "group": {"include": {"department": True}},
    "semester": {"include": {"academicYear": True}},
    "members": {"where": {"status": "ACTIVE"}},
    "courseSections": True,
}


async def _get_or_create_group(tenant_id: str, department_id: str, batch):
    where = {"tenantId": tenant_id, "departmentId": department_id, "batch": batch.code}
    group = await db.studentgroup.find_first(where=where)
    if not group:
        return await db.studentgroup.create(data={**where, "batchId": batch.id})
    if group.status != "ACTIVE" or group.batchId != batch.id:
        return await db.studentgroup.update(
            where={"id": group.id}, data={"status": "ACTIVE", "batchId": batch.id}
        )
    return group


async def _resolve_class_batch(tenant_id: str, data: ClassCreate):
    try:
        return await resolve_assignable_batch(tenant_id, data.batch_id, data.department_id)
    except ValueError as err:
        code = status.HTTP_404_NOT_FOUND if "not found" in str(err).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=str(err))


async def get_or_create_semester(tenant_id: str, year, number: int):
    semester = await db.semester.find_first(
        where={"tenantId": tenant_id, "academicYearId": year.id, "number": number}
    )
    if semester:
        return semester
    return await db.semester.create(
        data={
            "tenantId": tenant_id,
            "academicYearId": year.id,
            "number": number,
            "startDate": year.startDate,
            "endDate": year.endDate,
        }
    )


async def require_academic_year(tenant_id: str, year_id: str):
    year = await db.academicyear.find_first(where={"id": year_id, "tenantId": tenant_id})
    if not year:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic year not found.")
    return year


async def create_class(tenant_id: str, data: ClassCreate) -> ClassDetail:
    department = await db.department.find_first(where={"id": data.department_id, "tenantId": tenant_id})
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")
    year = await require_academic_year(tenant_id, data.academic_year_id)
    batch = await _resolve_class_batch(tenant_id, data)
    student_ids = list(dict.fromkeys(data.student_ids))
    await _require_placeable(tenant_id, student_ids)
    group = await _get_or_create_group(tenant_id, data.department_id, batch)
    semester = await get_or_create_semester(tenant_id, year, data.semester_number)
    existing = await db.classterm.find_first(
        where={"tenantId": tenant_id, "groupId": group.id, "semesterId": semester.id}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Class {class_code(department.code, batch.code)} already exists for semester {data.semester_number}.",
        )
    term = await db.classterm.create(
        data={"tenantId": tenant_id, "groupId": group.id, "semesterId": semester.id}
    )
    try:
        created = await get_class_term(tenant_id, term.id)
        if student_ids:
            await place_students(tenant_id, created, student_ids)
            created = await get_class_term(tenant_id, term.id)
        return build_detail(created)
    except Exception:
        await db.classterm.delete(where={"id": term.id})
        raise


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


async def list_classes(
    tenant_id: str,
    department_id: Optional[str] = None,
    semester_number: Optional[int] = None,
    academic_year_id: Optional[str] = None,
    search: Optional[str] = None,
) -> List[ClassSummary]:
    where: dict = {"tenantId": tenant_id}
    if department_id:
        where["group"] = {"is": {"departmentId": department_id}}
    semester_filter = {}
    if semester_number:
        semester_filter["number"] = semester_number
    if academic_year_id:
        semester_filter["academicYearId"] = academic_year_id
    if semester_filter:
        where["semester"] = {"is": semester_filter}
    terms = await db.classterm.find_many(where=where, include=LIST_INCLUDE, order={"createdAt": "desc"})
    summaries = [build_summary(t) for t in terms]
    if search:
        needle = search.strip().lower()
        summaries = [s for s in summaries if needle in s.code.lower()]
    return summaries


async def get_class(tenant_id: str, class_id: str) -> ClassDetail:
    return build_detail(await get_class_term(tenant_id, class_id))
