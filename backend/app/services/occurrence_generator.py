from datetime import date, datetime
from typing import List
from app.db.client import db


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


class OccurrenceGenerator:
    @staticmethod
    async def generate_occurrences_for_date(tenant_id: str, target_date: date) -> List[dict]:
        target_dt = _to_dt(target_date)
        events = await db.academiccalendarevent.find_many(
            where={"tenantId": tenant_id, "date": target_dt}
        )
        is_holiday = any(e.eventType in ("HOLIDAY", "NON_INSTRUCTIONAL") for e in events)
        if is_holiday:
            return []

        override = next((e for e in events if e.eventType == "TIMETABLE_OVERRIDE" and e.substituteDayOfWeek), None)
        effective_dow = override.substituteDayOfWeek if override and override.substituteDayOfWeek else target_date.isoweekday()

        rules = await db.timetablerule.find_many(
            where={
                "tenantId": tenant_id,
                "dayOfWeek": effective_dow,
                "isActive": True,
                "effectiveFrom": {"lte": target_dt},
                "effectiveUntil": {"gte": target_dt},
            },
            include={
                "courseSection": {
                    "include": {
                        "faculties": {"where": {"isPrimary": True}},
                        "subject": True,
                        "academicYear": True,
                    }
                },
                "timeSlot": True,
            },
        )

        created_occurrences = []
        for rule in rules:
            # Respect Saturday toggle on the section's academic year
            if effective_dow == 6 and rule.courseSection and rule.courseSection.academicYear:
                if not getattr(rule.courseSection.academicYear, "saturdayEnabled", False):
                    continue

            existing = await db.classoccurrence.find_unique(
                where={
                    "courseSectionId_date_timeSlotId": {
                        "courseSectionId": rule.courseSectionId,
                        "date": target_dt,
                        "timeSlotId": rule.timeSlotId,
                    }
                }
            )
            if existing:
                created_occurrences.append(existing)
                continue

            faculty_id = rule.teacherId
            if not faculty_id and rule.courseSection and rule.courseSection.faculties:
                faculty_id = rule.courseSection.faculties[0].teacherId

            if not faculty_id:
                continue

            room_id = rule.classroomId or (rule.courseSection.defaultRoomId if rule.courseSection else None)

            occurrence = await db.classoccurrence.create(
                data={
                    "tenantId": tenant_id,
                    "courseSectionId": rule.courseSectionId,
                    "timetableRuleId": rule.id,
                    "date": target_dt,
                    "timeSlotId": rule.timeSlotId,
                    "classroomId": room_id,
                    "facultyId": faculty_id,
                    "status": "SCHEDULED",
                }
            )
            created_occurrences.append(occurrence)

        return created_occurrences
