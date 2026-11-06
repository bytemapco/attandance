"""Keeps a student in the class of their batch, so they see its subjects and timetable straight away."""
from typing import Optional

from app.db.client import db
from app.services.class_management.class_member_service import close_member, place_students
from app.services.class_management.common import get_class_group

BATCH_CHANGED = "Batch changed"


async def place_in_batch_class(tenant_id: str, student_id: str, batch_id: Optional[str]) -> bool:
    """Moves the student into the active class of `batch_id`, leaving any other class.

    Returns True when the student ends up in a class. A batch with no class yet leaves the student
    without one until an admin creates it.
    """
    target = None
    if batch_id:
        target = await db.studentgroup.find_first(
            where={"tenantId": tenant_id, "batchId": batch_id, "status": "ACTIVE"}
        )
    current = await db.classmember.find_first(
        where={"tenantId": tenant_id, "studentId": student_id, "status": "ACTIVE"}
    )
    if current and target and current.groupId == target.id:
        return True
    if current:
        await close_member(await get_class_group(tenant_id, current.groupId), student_id, BATCH_CHANGED)
    if not target:
        return False
    await place_students(tenant_id, await get_class_group(tenant_id, target.id), [student_id])
    return True
