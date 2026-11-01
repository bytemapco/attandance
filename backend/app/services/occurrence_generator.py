from datetime import date, datetime
from typing import List
from prisma.errors import UniqueViolationError
from app.db.client import db
from app.services.system_config_service import SystemConfigService


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


async def _find_existing(rule, target_dt: datetime):
    return await db.classoccurrence.find_unique(
        where={
            "courseSectionId_date_startTime": {
                "courseSectionId": rule.courseSectionId,
                "date": target_dt,
                "startTime": rule.startTime,
            }
        }
    )


async def _create_or_existing(rule, target_dt: datetime, data: dict):
    """Several teachers can open the same day at once. The request that loses the race takes the row the winner made."""
    try:
        return await db.classoccurrence.create(data=data)
    except UniqueViolationError:
        existing = await _find_existing(rule, target_dt)
        if existing is None:
            raise
        return existing


class OccurrenceGenerator:
    @staticmethod
    async def generate_occurrences_for_date(tenant_id: str, target_date: date) -> List[dict]:
        target_dt = _to_dt(target_date)
        day_of_week = target_date.isoweekday()

        if day_of_week == 6:
            config = await SystemConfigService().get_config(tenant_id=tenant_id)
            if not config.saturdayEnabled:
                return []

        rules = await db.timetablerule.find_many(
            where={
                "tenantId": tenant_id,
                "dayOfWeek": day_of_week,
                "isActive": True,
                "effectiveFrom": {"lte": target_dt},
                "OR": [{"effectiveUntil": None}, {"effectiveUntil": {"gte": target_dt}}],
            },
            include={
                "courseSection": {
                    "include": {
                        "faculties": {"where": {"isPrimary": True}},
                        "subject": True,
                    }
                },
            },
        )

        created_occurrences = []
        for rule in rules:
            existing = await _find_existing(rule, target_dt)
            if existing:
                created_occurrences.append(existing)
                continue

            faculty_id = rule.teacherId
            if not faculty_id and rule.courseSection and rule.courseSection.faculties:
                faculty_id = rule.courseSection.faculties[0].teacherId

            if not faculty_id:
                continue

            room_id = rule.classroomId or (rule.courseSection.defaultRoomId if rule.courseSection else None)

            occurrence = await _create_or_existing(
                rule,
                target_dt,
                {
                    "tenantId": tenant_id,
                    "courseSectionId": rule.courseSectionId,
                    "timetableRuleId": rule.id,
                    "date": target_dt,
                    "startTime": rule.startTime,
                    "endTime": rule.endTime,
                    "classroomId": room_id,
                    "facultyId": faculty_id,
                    "status": "SCHEDULED",
                },
            )
            created_occurrences.append(occurrence)

        return created_occurrences
