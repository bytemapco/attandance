from datetime import date
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.class_management import ClassDetail, SectionScheduleCreate
from app.services.class_management.common import build_detail, get_class_group
from app.services.class_management.class_section_service import _find_section
from app.services.class_management.teacher_availability import midnight, overlapping, still_running
from app.services.system_config_service import SystemConfigService

SATURDAY = 6


def _conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


def _primary_teacher_id(section) -> str:
    primary = next((f for f in section.faculties or [] if f.isPrimary), None)
    if not primary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Assign a teacher to this subject before scheduling it."
        )
    return primary.teacherId


async def _require_teaching_day(tenant_id: str, day_of_week: int) -> None:
    """No class is ever generated on a Saturday the institution has switched off, so refuse to schedule one."""
    if day_of_week != SATURDAY:
        return
    config = await SystemConfigService().get_config(tenant_id=tenant_id)
    if not config.saturdayEnabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Saturday is not a teaching day. Turn it on in Settings to schedule classes on it.",
        )


async def _require_room(tenant_id: str, room_id: str) -> None:
    if not await db.classroom.find_first(where={"id": room_id, "tenantId": tenant_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")


async def _check_conflicts(tenant_id: str, group, section_id: str, teacher_id: str, room_id, data) -> None:
    overlap = {
        "tenantId": tenant_id,
        "isActive": True,
        "dayOfWeek": data.day_of_week,
        **overlapping(data.start_time, data.end_time),
        "courseSectionId": {"not": section_id},
        "OR": still_running(),
    }
    if await db.timetablerule.find_first(where={**overlap, "teacherId": teacher_id}):
        raise _conflict("This teacher already has a class at that time.")
    if room_id and await db.timetablerule.find_first(where={**overlap, "classroomId": room_id}):
        raise _conflict("That room is already booked at that time.")
    same_class = {"courseSection": {"is": {"groupId": group.id}}}
    if await db.timetablerule.find_first(where={**overlap, **same_class}):
        raise _conflict("This class already has another subject at that time.")
    own_overlap = {
        "courseSectionId": section_id,
        "isActive": True,
        "dayOfWeek": data.day_of_week,
        **overlapping(data.start_time, data.end_time),
        "NOT": {"startTime": data.start_time},
        "OR": still_running(),
    }
    if await db.timetablerule.find_first(where=own_overlap):
        raise _conflict("This subject already has a class that overlaps that time.")


async def _refresh_upcoming(rule_id: str, fields: dict) -> None:
    """A changed rule must reach the classes already generated from it, unless they were already taken."""
    await db.classoccurrence.update_many(
        where={
            "timetableRuleId": rule_id,
            "status": "SCHEDULED",
            "isAttendanceLocked": False,
            "date": {"gte": midnight(date.today())},
        },
        data={"endTime": fields["endTime"], "classroomId": fields["classroomId"], "facultyId": fields["teacherId"]},
    )


async def add_slot(tenant_id: str, class_id: str, section_id: str, data: SectionScheduleCreate) -> ClassDetail:
    group = await get_class_group(tenant_id, class_id)
    section = _find_section(group, section_id)
    teacher_id = _primary_teacher_id(section)
    await _require_teaching_day(tenant_id, data.day_of_week)
    room_id = data.classroom_id or section.defaultRoomId
    if data.classroom_id:
        await _require_room(tenant_id, data.classroom_id)
    await _check_conflicts(tenant_id, group, section_id, teacher_id, room_id, data)
    existing = await db.timetablerule.find_first(
        where={
            "courseSectionId": section_id,
            "dayOfWeek": data.day_of_week,
            "startTime": data.start_time,
        }
    )
    fields = {
        "endTime": data.end_time,
        "classroomId": room_id,
        "teacherId": teacher_id,
        "effectiveFrom": midnight(date.today()),
        "effectiveUntil": None,
        "isActive": True,
    }
    if existing:
        await db.timetablerule.update(where={"id": existing.id}, data=fields)
        await _refresh_upcoming(existing.id, fields)
    else:
        await db.timetablerule.create(
            data={
                "tenantId": tenant_id,
                "courseSectionId": section_id,
                "dayOfWeek": data.day_of_week,
                "startTime": data.start_time,
                **fields,
            }
        )
    return build_detail(await get_class_group(tenant_id, class_id))


async def remove_slot(tenant_id: str, class_id: str, section_id: str, rule_id: str) -> ClassDetail:
    group = await get_class_group(tenant_id, class_id)
    _find_section(group, section_id)
    rule = await db.timetablerule.find_first(
        where={"id": rule_id, "tenantId": tenant_id, "courseSectionId": section_id}
    )
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found.")
    await db.classoccurrence.delete_many(where={"timetableRuleId": rule_id, "status": "SCHEDULED"})
    marked = await db.attendancerecord.count(where={"occurrence": {"is": {"timetableRuleId": rule_id}}})
    if marked:
        await db.timetablerule.update(where={"id": rule_id}, data={"isActive": False})
    else:
        await db.timetablerule.delete(where={"id": rule_id})
    return build_detail(await get_class_group(tenant_id, class_id))
