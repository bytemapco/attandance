from datetime import date, datetime, timedelta
from typing import Dict, Iterator, List

from app.db.client import db
from app.services.system_config_service import SystemConfigService

SATURDAY = 6


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


def _days(first: date, last: date) -> Iterator[date]:
    for offset in range((last - first).days + 1):
        yield first + timedelta(days=offset)


def _applies(rule, day: date) -> bool:
    if rule.dayOfWeek != day.isoweekday() or rule.effectiveFrom.date() > day:
        return False
    return rule.effectiveUntil is None or rule.effectiveUntil.date() >= day


def _faculty_of(rule):
    if rule.teacherId:
        return rule.teacherId
    primary = rule.courseSection.faculties if rule.courseSection else None
    return primary[0].teacherId if primary else None


def _new_occurrence(tenant_id: str, rule, day: date, faculty_id: str) -> Dict:
    section = rule.courseSection
    return {
        "tenantId": tenant_id,
        "courseSectionId": rule.courseSectionId,
        "timetableRuleId": rule.id,
        "date": _to_dt(day),
        "startTime": rule.startTime,
        "endTime": rule.endTime,
        "classroomId": rule.classroomId or (section.defaultRoomId if section else None),
        "facultyId": faculty_id,
        "status": "SCHEDULED",
    }


class OccurrenceGenerator:
    @staticmethod
    async def generate(tenant_id: str, first_day: date, last_day: date) -> int:
        """Makes the dated class for every weekly rule that applies between two days (inclusive) and has none yet.

        Three queries for the whole range, however many days and rules it holds. Several teachers can open the same
        day at once: the bulk insert skips a class another request has just made. Returns how many it made.
        """
        saturday_off = False
        if any(day.isoweekday() == SATURDAY for day in _days(first_day, last_day)):
            saturday_off = not (await SystemConfigService().get_config(tenant_id=tenant_id)).saturdayEnabled

        rules = await db.timetablerule.find_many(
            where={
                "tenantId": tenant_id,
                "isActive": True,
                "effectiveFrom": {"lte": _to_dt(last_day)},
                "OR": [{"effectiveUntil": None}, {"effectiveUntil": {"gte": _to_dt(first_day)}}],
            },
            include={"courseSection": {"include": {"faculties": {"where": {"isPrimary": True}}}}},
        )
        if not rules:
            return 0
        existing = {
            (o.courseSectionId, o.date.date(), o.startTime)
            for o in await db.classoccurrence.find_many(
                where={"tenantId": tenant_id, "date": {"gte": _to_dt(first_day), "lte": _to_dt(last_day)}}
            )
        }

        missing: List[Dict] = []
        for day in _days(first_day, last_day):
            if saturday_off and day.isoweekday() == SATURDAY:
                continue
            for rule in rules:
                faculty_id = _faculty_of(rule)
                if faculty_id and _applies(rule, day) and (rule.courseSectionId, day, rule.startTime) not in existing:
                    missing.append(_new_occurrence(tenant_id, rule, day, faculty_id))
        if not missing:
            return 0
        return await db.classoccurrence.create_many(data=missing, skip_duplicates=True)
