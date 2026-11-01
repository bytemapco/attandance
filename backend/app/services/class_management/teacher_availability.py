from datetime import date, datetime, time
from fastapi import HTTPException, status
from app.db.client import db

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def midnight(value: date) -> datetime:
    return datetime.combine(value, time.min)


def still_running() -> list[dict]:
    """Rules with no end date, or an end date that has not passed."""
    return [{"effectiveUntil": None}, {"effectiveUntil": {"gte": midnight(date.today())}}]


def overlapping(start_time: str, end_time: str) -> dict:
    """Rules whose time range overlaps the given one. "HH:MM" strings compare in clock order."""
    return {"startTime": {"lt": end_time}, "endTime": {"gt": start_time}}


async def ensure_teacher_free(tenant_id: str, section_id: str, teacher_id: str) -> None:
    """Refuse a teacher who already teaches another class at any time this subject meets."""
    own_rules = await db.timetablerule.find_many(
        where={"tenantId": tenant_id, "courseSectionId": section_id, "isActive": True, "OR": still_running()}
    )
    for rule in own_rules:
        clash = await db.timetablerule.find_first(
            where={
                "tenantId": tenant_id,
                "isActive": True,
                "teacherId": teacher_id,
                "dayOfWeek": rule.dayOfWeek,
                **overlapping(rule.startTime, rule.endTime),
                "courseSectionId": {"not": section_id},
                "OR": still_running(),
            }
        )
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"This teacher already has a class on {DAY_NAMES[rule.dayOfWeek - 1]} "
                    f"that overlaps {rule.startTime}–{rule.endTime}."
                ),
            )
