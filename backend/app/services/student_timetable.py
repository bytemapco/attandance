"""Builds a student's week from the weekly rules and the dated classes that already exist.

Pure functions only: the service loads the rows, this module decides what the student sees.
"""
from datetime import date, timedelta
from typing import Dict, Iterable, List, Optional, Tuple

from app.schemas.student_timetable import TimetableDay, TimetableEntry
from app.services.occurrence_window import window_is_open

SUNDAY = 7
SATURDAY = 6


def _name(teacher) -> Optional[str]:
    return f"{teacher.firstName} {teacher.lastName}".strip() if teacher else None


def _primary_teacher(section):
    primary = next((f for f in section.faculties or [] if f.isPrimary), None)
    return primary.teacher if primary else None


def _teacher(rule, occurrence, section) -> Tuple[Optional[str], bool]:
    """(name, is_substitute). A substitute named on the dated class wins over the weekly teacher."""
    if occurrence and occurrence.substituteFaculty:
        return _name(occurrence.substituteFaculty), True
    if occurrence and occurrence.faculty:
        return _name(occurrence.faculty), False
    return _name((rule.teacher if rule else None) or _primary_teacher(section)), False


def _classroom(rule, occurrence, section) -> Optional[str]:
    room = (occurrence.classroom if occurrence else None) or (rule.classroom if rule else None) or section.defaultRoom
    return room.name if room else None


def _attendance_status(occurrence) -> Optional[str]:
    if occurrence is None:
        return None
    records = occurrence.attendanceRecords or []
    if records:
        return str(records[0].status)
    # A closed class with no record for the student counts as an absence, as in the percentage.
    if occurrence.isAttendanceLocked and occurrence.status == "CONDUCTED":
        return "ABSENT"
    return None


def _entry(day: date, rule, occurrence) -> TimetableEntry:
    section = (occurrence or rule).courseSection
    teacher, substitute = _teacher(rule, occurrence, section)
    open_now = bool(occurrence and window_is_open(occurrence))
    return TimetableEntry(
        occurrence_id=occurrence.id if occurrence else None,
        course_section_id=section.id,
        subject_name=section.subject.name,
        subject_code=section.subject.code,
        class_code=section.name,
        date=day,
        start_time=(occurrence or rule).startTime,
        end_time=(occurrence or rule).endTime,
        classroom_name=_classroom(rule, occurrence, section),
        teacher_name=teacher,
        status=str(occurrence.status) if occurrence else "SCHEDULED",
        cancellation_reason=occurrence.cancellationReason if occurrence else None,
        is_substitute=substitute,
        is_extra=rule is None,
        attendance_status=_attendance_status(occurrence),
        window_open=open_now,
        window_closes_at=occurrence.verificationExpires if open_now else None,
    )


def _rule_applies(rule, day: date, since: Dict[str, date]) -> bool:
    if not rule.isActive or rule.dayOfWeek != day.isoweekday():
        return False
    if rule.effectiveFrom.date() > day:
        return False
    if rule.effectiveUntil is not None and rule.effectiveUntil.date() < day:
        return False
    return day >= since.get(rule.courseSectionId, date.max)


def _is_day_off(day: date, saturday_enabled: bool) -> bool:
    weekday = day.isoweekday()
    return weekday == SUNDAY or (weekday == SATURDAY and not saturday_enabled)


def build_days(
    start: date,
    end: date,
    rules: Iterable,
    occurrences: Iterable,
    since: Dict[str, date],
    saturday_enabled: bool,
) -> List[TimetableDay]:
    """One entry per class the student has between start and end (inclusive), day by day.

    `since` maps each enrolled section to the date the student joined it; nothing earlier is shown.
    A rule with no dated class yet is still shown (as SCHEDULED). A dated class the weekly timetable
    does not know about (a teacher started it on the spot) is shown as an extra.
    """
    rules = list(rules)
    by_key = {(o.courseSectionId, o.date.date(), o.startTime): o for o in occurrences}
    days: List[TimetableDay] = []
    for offset in range((end - start).days + 1):
        day = start + timedelta(days=offset)
        entries: List[TimetableEntry] = []
        seen = set()
        if not _is_day_off(day, saturday_enabled):
            for rule in rules:
                if _rule_applies(rule, day, since):
                    key = (rule.courseSectionId, day, rule.startTime)
                    seen.add(key)
                    entries.append(_entry(day, rule, by_key.get(key)))
        for key, occurrence in by_key.items():
            if key[1] == day and key not in seen and day >= since.get(key[0], date.max):
                entries.append(_entry(day, None, occurrence))
        if entries or not _is_day_off(day, saturday_enabled):
            entries.sort(key=lambda e: (e.start_time, e.subject_name))
            days.append(TimetableDay(date=day, weekday=day.isoweekday(), entries=entries))
    return days
