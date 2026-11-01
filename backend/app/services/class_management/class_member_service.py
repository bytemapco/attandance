from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassDetail, ClassMemberMove, ClassMemberRemove
from app.services.class_management.common import (
    build_detail,
    get_class_term,
    require_students_in_tenant,
)
from app.services.class_management.enrollment_sync import (
    all_section_ids,
    end_class_enrollments,
    enroll_students,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _key(class_id: str, student_id: str) -> dict:
    return {"classTermId_studentId": {"classTermId": class_id, "studentId": student_id}}


async def _activate_member(tenant_id: str, class_id: str, student_id: str, reason: Optional[str] = None) -> None:
    existing = await db.classmember.find_unique(where=_key(class_id, student_id))
    if existing:
        await db.classmember.update(
            where=_key(class_id, student_id),
            data={"status": "ACTIVE", "leftAt": None, "joinedAt": _now(), "reason": reason},
        )
        return
    await db.classmember.create(
        data={
            "tenantId": tenant_id,
            "classTermId": class_id,
            "studentId": student_id,
            "status": "ACTIVE",
            "reason": reason,
        }
    )


async def _require_batch_members(term, student_ids: List[str]) -> None:
    batch_id = term.group.batchId
    if not batch_id or not student_ids:
        return
    outside = await db.student.count(
        where={"id": {"in": student_ids}, "OR": [{"batchId": None}, {"batchId": {"not": batch_id}}]}
    )
    if outside:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{outside} selected student(s) are not in batch {term.group.batch}.",
        )


async def place_students(tenant_id: str, term, student_ids: List[str], reason: Optional[str] = None) -> int:
    ids = list(dict.fromkeys(student_ids))
    await _require_batch_members(term, ids)
    active = await db.classmember.find_many(
        where={"tenantId": tenant_id, "studentId": {"in": ids}, "status": "ACTIVE"}
    )
    elsewhere = [m for m in active if m.classTermId != term.id]
    if elsewhere:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{len(elsewhere)} student(s) are already active in another class; move them instead.",
        )
    already_here = {m.studentId for m in active}
    new_ids = [i for i in ids if i not in already_here]
    for student_id in new_ids:
        await _activate_member(tenant_id, term.id, student_id, reason)
    await enroll_students(all_section_ids(term), new_ids)
    return len(new_ids)


async def close_member(term, student_id: str, new_status: str, reason: str) -> None:
    await db.classmember.update(
        where=_key(term.id, student_id),
        data={"status": new_status, "leftAt": _now(), "reason": reason},
    )
    await end_class_enrollments(all_section_ids(term), [student_id])


def _require_active_member(term, student_id: str) -> None:
    if not any(m.studentId == student_id for m in term.members or []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not an active member of this class.")


async def add_members(tenant_id: str, class_id: str, student_ids: List[str]) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    await require_students_in_tenant(tenant_id, list(dict.fromkeys(student_ids)))
    await place_students(tenant_id, term, student_ids)
    return build_detail(await get_class_term(tenant_id, class_id))


async def move_member(tenant_id: str, class_id: str, student_id: str, data: ClassMemberMove) -> ClassDetail:
    if data.target_class_id == class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target class must differ from the current class.")
    term = await get_class_term(tenant_id, class_id)
    target = await get_class_term(tenant_id, data.target_class_id)
    _require_active_member(term, student_id)
    await close_member(term, student_id, "TRANSFERRED", data.reason)
    await place_students(tenant_id, target, [student_id], data.reason)
    return build_detail(await get_class_term(tenant_id, class_id))


async def remove_member(tenant_id: str, class_id: str, student_id: str, data: ClassMemberRemove) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    _require_active_member(term, student_id)
    await close_member(term, student_id, "TRANSFERRED", data.reason)
    return build_detail(await get_class_term(tenant_id, class_id))
