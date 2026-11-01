from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassDetail, ClassMemberMove, ClassMemberRemove
from app.services.class_management.common import (
    build_detail,
    get_class_group,
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
    return {"groupId_studentId": {"groupId": class_id, "studentId": student_id}}


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
            "groupId": class_id,
            "studentId": student_id,
            "status": "ACTIVE",
            "reason": reason,
        }
    )


async def _require_batch_members(group, student_ids: List[str]) -> None:
    batch_id = group.batchId
    if not batch_id or not student_ids:
        return
    outside = await db.student.count(
        where={"id": {"in": student_ids}, "OR": [{"batchId": None}, {"batchId": {"not": batch_id}}]}
    )
    if outside:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{outside} selected student(s) are not in batch {group.batch}.",
        )


async def place_students(tenant_id: str, group, student_ids: List[str], reason: Optional[str] = None) -> int:
    ids = list(dict.fromkeys(student_ids))
    await _require_batch_members(group, ids)
    active = await db.classmember.find_many(
        where={"tenantId": tenant_id, "studentId": {"in": ids}, "status": "ACTIVE"}
    )
    elsewhere = [m for m in active if m.groupId != group.id]
    if elsewhere:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{len(elsewhere)} student(s) are already active in another class; move them instead.",
        )
    already_here = {m.studentId for m in active}
    new_ids = [i for i in ids if i not in already_here]
    for student_id in new_ids:
        await _activate_member(tenant_id, group.id, student_id, reason)
    await enroll_students(all_section_ids(group), new_ids)
    return len(new_ids)


async def close_member(group, student_id: str, reason: str) -> None:
    await db.classmember.update(
        where=_key(group.id, student_id),
        data={"status": "TRANSFERRED", "leftAt": _now(), "reason": reason},
    )
    await end_class_enrollments(all_section_ids(group), [student_id])


def _require_active_member(group, student_id: str) -> None:
    if not any(m.studentId == student_id for m in group.members or []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not an active member of this class.")


async def add_members(tenant_id: str, class_id: str, student_ids: List[str]) -> ClassDetail:
    group = await get_class_group(tenant_id, class_id)
    await require_students_in_tenant(tenant_id, list(dict.fromkeys(student_ids)))
    await place_students(tenant_id, group, student_ids)
    return build_detail(await get_class_group(tenant_id, class_id))


async def move_member(tenant_id: str, class_id: str, student_id: str, data: ClassMemberMove) -> ClassDetail:
    if data.target_class_id == class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target class must differ from the current class.")
    group = await get_class_group(tenant_id, class_id)
    target = await get_class_group(tenant_id, data.target_class_id)
    _require_active_member(group, student_id)
    await close_member(group, student_id, data.reason)
    await place_students(tenant_id, target, [student_id], data.reason)
    return build_detail(await get_class_group(tenant_id, class_id))


async def remove_member(tenant_id: str, class_id: str, student_id: str, data: ClassMemberRemove) -> ClassDetail:
    group = await get_class_group(tenant_id, class_id)
    _require_active_member(group, student_id)
    await close_member(group, student_id, data.reason)
    return build_detail(await get_class_group(tenant_id, class_id))
