from typing import Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.batch import MAX_BATCH_NUMBER, BatchCreate, BatchResponse

BATCH_SELECT = """
SELECT b.id, b.department_id AS "departmentId", b.section, b.number, b.code,
       b.status::text AS status, b.created_at AS "createdAt", b.updated_at AS "updatedAt",
       (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS "studentCount",
       (SELECT COUNT(*) FROM student_groups g WHERE g.batch_id = b.id) AS "classCount"
FROM batches b
"""


def build_batch_code(department_code: str, section: str, number: int) -> str:
    return f"{department_code}-{section}-{number}"


def _to_response(row: dict) -> BatchResponse:
    return BatchResponse(
        id=row["id"],
        department_id=row["departmentId"],
        section=row["section"],
        number=row["number"],
        code=row["code"],
        status=row["status"],
        student_count=int(row["studentCount"]),
        class_count=int(row["classCount"]),
        created_at=row["createdAt"],
        updated_at=row["updatedAt"],
    )


async def _require_department(tenant_id: str, department_id: str):
    department = await db.department.find_first(where={"id": department_id, "tenantId": tenant_id})
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")
    return department


async def _load_batch(tenant_id: str, batch_id: str) -> BatchResponse:
    rows = await db.query_raw(BATCH_SELECT + " WHERE b.id = $1 AND b.tenant_id = $2", batch_id, tenant_id)
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
    return _to_response(rows[0])


async def _ensure_code_available(tenant_id: str, department_id: str, section: str, numbers: list[int], codes: list[str]) -> None:
    clash = await db.batch.find_first(
        where={
            "tenantId": tenant_id,
            "OR": [
                {"departmentId": department_id, "section": section, "number": {"in": numbers}},
                {"code": {"in": codes}},
            ],
        }
    )
    if clash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch {clash.code} already exists.",
        )


async def list_batches(tenant_id: str, department_id: str) -> list[BatchResponse]:
    await _require_department(tenant_id, department_id)
    rows = await db.query_raw(
        BATCH_SELECT + ' WHERE b.tenant_id = $1 AND b.department_id = $2 ORDER BY b.section, b.number',
        tenant_id,
        department_id,
    )
    return [_to_response(row) for row in rows]


async def list_all_batches(tenant_id: str, department_id: Optional[str] = None) -> list[BatchResponse]:
    if department_id:
        return await list_batches(tenant_id, department_id)
    rows = await db.query_raw(BATCH_SELECT + " WHERE b.tenant_id = $1 ORDER BY b.code", tenant_id)
    return [_to_response(row) for row in rows]


async def _next_number(tenant_id: str, department_id: str, section: str) -> int:
    last = await db.batch.find_first(
        where={"tenantId": tenant_id, "departmentId": department_id, "section": section},
        order={"number": "desc"},
    )
    return (last.number if last else 0) + 1


async def create_batch(tenant_id: str, department_id: str, data: BatchCreate) -> BatchResponse:
    department = await _require_department(tenant_id, department_id)
    number = data.number if data.number is not None else await _next_number(tenant_id, department_id, data.section)
    if number > MAX_BATCH_NUMBER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Section {data.section} is full (numbers go up to {MAX_BATCH_NUMBER}).",
        )
    code = build_batch_code(department.code, data.section, number)
    await _ensure_code_available(tenant_id, department_id, data.section, [number], [code])
    created = await db.batch.create(
        data={
            "tenantId": tenant_id,
            "departmentId": department_id,
            "section": data.section,
            "number": number,
            "code": code,
        }
    )
    return await _load_batch(tenant_id, created.id)


async def set_batch_status(tenant_id: str, batch_id: str, new_status: str) -> BatchResponse:
    await _load_batch(tenant_id, batch_id)
    await db.batch.update(where={"id": batch_id}, data={"status": new_status})
    return await _load_batch(tenant_id, batch_id)


async def delete_batch(tenant_id: str, batch_id: str) -> None:
    batch = await _load_batch(tenant_id, batch_id)
    if batch.student_count or batch.class_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Batch has students or classes. Archive it instead of deleting.",
        )
    await db.batch.delete(where={"id": batch_id})


async def resolve_assignable_batch(tenant_id: str, batch_id: Optional[str], department_id: str, client=None):
    if not batch_id:
        return None
    database = client or db
    batch = await database.batch.find_first(where={"id": batch_id, "tenantId": tenant_id})
    if not batch:
        raise ValueError("Batch not found.")
    if batch.departmentId != department_id:
        raise ValueError("Batch does not belong to the selected department.")
    if batch.status != "ACTIVE":
        raise ValueError("Batch is archived and cannot take new students.")
    return batch
