from datetime import datetime, time
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassDetail, SectionScheduleCreate
from app.services.class_management.common import build_detail, get_class_term
from app.services.class_management.class_section_service import _find_section


def _midnight(value) -> datetime:
    return datetime.combine(value, time.min)


def _conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def _primary_teacher_id(section) -> str:
    primary = next((f for f in section.faculties or [] if f.isPrimary), None)
    if not primary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Assign a teacher to this subject before scheduling it."
        )
    return primary.teacherId


async def _require_slot(tenant_id: str, slot_id: str) -> None:
    slot = await db.timeslot.find_first(where={"id": slot_id, "tenantId": tenant_id})
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time slot not found.")
    if slot.isBreak:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A break slot cannot hold a class.")


async def _require_room(tenant_id: str, room_id: str) -> None:
    if not await db.classroom.find_first(where={"id": room_id, "tenantId": tenant_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")


async def _check_conflicts(tenant_id: str, term, section_id: str, teacher_id: str, room_id, data) -> None:
    overlap = {
        "tenantId": tenant_id,
        "isActive": True,
        "dayOfWeek": data.day_of_week,
        "timeSlotId": data.time_slot_id,
        "courseSectionId": {"not": section_id},
        "effectiveFrom": {"lte": _midnight(term.semester.endDate)},
        "effectiveUntil": {"gte": _midnight(term.semester.startDate)},
    }
    if await db.timetablerule.find_first(where={**overlap, "teacherId": teacher_id}):
        raise _conflict("This teacher already has a class in that slot.")
    if room_id and await db.timetablerule.find_first(where={**overlap, "classroomId": room_id}):
        raise _conflict("That room is already booked in that slot.")
    same_class = {"courseSection": {"is": {"classTermId": term.id}}}
    if await db.timetablerule.find_first(where={**overlap, **same_class}):
        raise _conflict("This class already has another subject in that slot.")


async def add_slot(tenant_id: str, class_id: str, section_id: str, data: SectionScheduleCreate) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    section = _find_section(term, section_id)
    teacher_id = _primary_teacher_id(section)
    await _require_slot(tenant_id, data.time_slot_id)
    room_id = data.classroom_id or section.defaultRoomId
    if data.classroom_id:
        await _require_room(tenant_id, data.classroom_id)
    await _check_conflicts(tenant_id, term, section_id, teacher_id, room_id, data)
    existing = await db.timetablerule.find_first(
        where={
            "courseSectionId": section_id,
            "timeSlotId": data.time_slot_id,
            "dayOfWeek": data.day_of_week,
        }
    )
    fields = {
        "classroomId": room_id,
        "teacherId": teacher_id,
        "effectiveFrom": _midnight(term.semester.startDate),
        "effectiveUntil": _midnight(term.semester.endDate),
        "isActive": True,
    }
    if existing:
        await db.timetablerule.update(where={"id": existing.id}, data=fields)
    else:
        await db.timetablerule.create(
            data={
                "tenantId": tenant_id,
                "courseSectionId": section_id,
                "timeSlotId": data.time_slot_id,
                "dayOfWeek": data.day_of_week,
                **fields,
            }
        )
    return build_detail(await get_class_term(tenant_id, class_id))


async def remove_slot(tenant_id: str, class_id: str, section_id: str, rule_id: str) -> ClassDetail:
    term = await get_class_term(tenant_id, class_id)
    _find_section(term, section_id)
    rule = await db.timetablerule.find_first(
        where={"id": rule_id, "tenantId": tenant_id, "courseSectionId": section_id}
    )
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found.")
    marked = await db.attendancerecord.count(where={"occurrence": {"is": {"timetableRuleId": rule_id}}})
    if marked:
        await db.timetablerule.update(where={"id": rule_id}, data={"isActive": False})
    else:
        await db.classoccurrence.delete_many(where={"timetableRuleId": rule_id, "status": "SCHEDULED"})
        await db.timetablerule.delete(where={"id": rule_id})
    return build_detail(await get_class_term(tenant_id, class_id))
