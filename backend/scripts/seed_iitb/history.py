"""Six weeks of closed classes with marks, leaves and a pending device change, plus this week's timetable."""

import random
import uuid
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.datetime_utils import get_ist_today
from app.db.client import db
from app.services.gamification_service import GamificationService
from app.services.occurrence_generator import OccurrenceGenerator

from . import data

IST = ZoneInfo("Asia/Kolkata")
CHUNK = 500
CLOSE_REASON = "Auto-marked absent on register close"

# (class, roll position, from, to, reason, status). Approved leaves excuse the classes missed in that span.
LEAVES = [
    ("CSE", 8, (2026, 10, 7), (2026, 10, 8), "Fever, doctor advised rest", "APPROVED"),
    ("CSE", 9, (2026, 10, 14), (2026, 10, 15), "Family function in Pune", "APPROVED"),
    ("EE", 5, (2026, 10, 28), (2026, 10, 29), "Inter-IIT team selection trials", "APPROVED"),
    ("ME", 6, (2026, 10, 22), (2026, 10, 23), "Dengue, hospital stay", "APPROVED"),
    ("CE", 3, (2026, 11, 4), (2026, 11, 5), "Cousin's wedding", "PENDING"),
    ("ME", 2, (2026, 11, 6), (2026, 11, 6), "Interview at a core company", "PENDING"),
]


def _weekdays(start: date, end: date) -> list:
    days = [start + timedelta(days=n) for n in range((end - start).days + 1)]
    return [d for d in days if d.isoweekday() <= 5]


def _at(day: date, clock: str, minutes: int = 0) -> datetime:
    hour, minute = int(clock[:2]), int(clock[3:])
    local = datetime(day.year, day.month, day.day, hour, minute, tzinfo=IST) + timedelta(minutes=minutes)
    return local.astimezone(timezone.utc)


async def _create_many(model, rows: list) -> None:
    for start in range(0, len(rows), CHUNK):
        await model.create_many(data=rows[start : start + CHUNK])


async def _leaves(tenant_id: str, classes: list) -> dict:
    """Returns {student_id: [(from, to, reason)]} for approved leaves, and files every leave request."""
    by_class = {c["dept"]: c for c in classes}
    approved: dict = {}
    for dept, position, start, end, reason, status in LEAVES:
        klass = by_class[dept]
        student = klass["students"][position][0]
        head = klass["sections"][0][1]
        await db.leaverequest.create(
            data={
                "tenantId": tenant_id,
                "studentId": student.id,
                "startDate": datetime(*start, tzinfo=timezone.utc),
                "endDate": datetime(*end, 23, 59, 59, tzinfo=timezone.utc),
                "reason": reason,
                "status": status,
                "approvedBy": head.id if status == "APPROVED" else None,
                "approverNote": "Approved" if status == "APPROVED" else None,
            }
        )
        if status == "APPROVED":
            approved.setdefault(student.id, []).append((date(*start), date(*end), reason))
    return approved


async def _device_change(tenant_id: str, classes: list) -> None:
    student = classes[0]["students"][3][0]
    await db.student.update(where={"id": student.id}, data={"deviceUuid": "iitb-seed-device-old"})
    await db.devicechangerequest.create(
        data={
            "tenantId": tenant_id,
            "studentId": student.id,
            "newDeviceUuid": "iitb-seed-device-new",
            "reason": "Replaced my phone",
        }
    )


def _marks(rng: random.Random, occurrence, klass: dict, teacher, day: date, approved: dict):
    """Record and audit rows for one closed class."""
    records, audits = [], []
    for student, user, propensity in klass["students"]:
        leave = next((x for x in approved.get(student.id, []) if x[0] <= day <= x[1]), None)
        draw = rng.random()
        if leave:
            status, method, by, reason = "EXCUSED", "SYSTEM_EXCUSED", teacher.userId, f"Approved leave: {leave[2]}"
        elif draw < propensity:
            status, method, by, reason = "PRESENT", "QR_CODE", user.id, "Student scanned class QR code"
        elif draw < propensity + (1 - propensity) * 0.25:
            status, method, by, reason = "LATE", "MANUAL_REGISTER", teacher.userId, "Marked late by the teacher"
        else:
            status, method, by, reason = "ABSENT", "MANUAL_REGISTER", teacher.userId, CLOSE_REASON
        record_id = str(uuid.uuid4())
        scanned = method == "QR_CODE"
        records.append(
            {
                "id": record_id,
                "tenantId": occurrence.tenantId,
                "occurrenceId": occurrence.id,
                "studentId": student.id,
                "status": status,
                "method": method,
                "gpsLatitude": data.CAMPUS["lat"] + rng.uniform(-0.0005, 0.0005) if scanned else None,
                "gpsLongitude": data.CAMPUS["lng"] + rng.uniform(-0.0005, 0.0005) if scanned else None,
                "remarks": None if scanned else reason,
                "verifiedAt": _at(day, occurrence.startTime, rng.randint(1, 12)),
            }
        )
        audits.append(
            {"attendanceRecordId": record_id, "previousStatus": "ABSENT", "newStatus": status, "changedById": by, "reason": reason}
        )
    return records, audits


async def _close_day(day, occurrences, section_info, approved, rng, topics) -> tuple:
    records, audits = [], []
    for occurrence in occurrences:
        klass, teacher = section_info[occurrence.courseSectionId]
        if day.timetuple()[:3] in data.HOLIDAYS:
            reason = f"{data.HOLIDAYS[day.timetuple()[:3]]} (institute holiday)"
            await db.classoccurrence.update(
                where={"id": occurrence.id}, data={"status": "CANCELLED", "cancellationReason": reason}
            )
            continue
        topics[occurrence.courseSectionId] = topics.get(occurrence.courseSectionId, 0) + 1
        await db.classoccurrence.update(
            where={"id": occurrence.id},
            data={
                "status": "CONDUCTED",
                "isAttendanceLocked": True,
                "conductedAt": _at(day, occurrence.startTime),
                "lockedAt": _at(day, occurrence.endTime, 5),
                "lockedById": teacher.userId,
                "topicCovered": f"Lecture {topics[occurrence.courseSectionId]}",
            },
        )
        new_records, new_audits = _marks(rng, occurrence, klass, teacher, day, approved)
        records += new_records
        audits += new_audits
    return records, audits


async def build_history(refs: dict, classes: list) -> None:
    tenant_id = refs["tenant"].id
    approved = await _leaves(tenant_id, classes)
    await _device_change(tenant_id, classes)
    section_info = {s.id: (klass, teacher) for klass in classes for s, teacher in klass["sections"]}

    today = get_ist_today()
    rng, topics = random.Random(2026), {}
    records, audits = [], []
    for day in _weekdays(date(*data.HISTORY_START), today - timedelta(days=1)):
        occurrences = await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, day)
        new_records, new_audits = await _close_day(day, occurrences, section_info, approved, rng, topics)
        records += new_records
        audits += new_audits
    await _create_many(db.attendancerecord, records)
    await _create_many(db.attendanceauditlog, audits)

    for day in _weekdays(today, today + timedelta(days=(7 - today.isoweekday()))):
        await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, day)

    gamification = GamificationService()
    for klass in classes:
        for student, _, _ in klass["students"]:
            await gamification.recalculate_student_streak(student.id)
