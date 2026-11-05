from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace as NS

from app.services.student_timetable import build_days

MONDAY = date(2026, 11, 2)  # isoweekday 1
SATURDAY = date(2026, 11, 7)
SUNDAY = date(2026, 11, 8)


def teacher(first, last="Rao"):
    return NS(firstName=first, lastName=last)


SECTION = NS(
    id="sec-1",
    name="CE-A",
    subject=NS(name="Maths", code="MA101"),
    defaultRoom=NS(name="Room 12"),
    faculties=[NS(isPrimary=True, teacher=teacher("Asha"))],
)


def rule(day=1, start="09:00", end="10:00", section=SECTION, **extra):
    base = dict(
        courseSectionId=section.id,
        courseSection=section,
        dayOfWeek=day,
        startTime=start,
        endTime=end,
        isActive=True,
        effectiveFrom=datetime(2026, 1, 1),
        effectiveUntil=None,
        teacher=None,
        classroom=None,
    )
    return NS(**{**base, **extra})


def occurrence(day=MONDAY, start="09:00", end="10:00", section=SECTION, **extra):
    base = dict(
        id="occ-1",
        courseSectionId=section.id,
        courseSection=section,
        date=datetime(day.year, day.month, day.day),
        startTime=start,
        endTime=end,
        status="SCHEDULED",
        cancellationReason=None,
        faculty=teacher("Asha"),
        substituteFaculty=None,
        classroom=None,
        isAttendanceLocked=False,
        verificationActive=False,
        verificationExpires=None,
        attendanceRecords=[],
    )
    return NS(**{**base, **extra})


SINCE = {"sec-1": date(2026, 9, 1)}


def week(rules, occurrences=(), saturday=False, since=SINCE, start=MONDAY, end=SUNDAY):
    return build_days(start, end, rules, occurrences, since, saturday)


def test_a_weekly_rule_appears_on_its_day_with_the_section_teacher_and_room():
    days = week([rule()])
    monday = days[0]
    assert monday.date == MONDAY and monday.weekday == 1
    entry = monday.entries[0]
    assert (entry.subject_name, entry.start_time, entry.status) == ("Maths", "09:00", "SCHEDULED")
    assert entry.teacher_name == "Asha Rao"
    assert entry.classroom_name == "Room 12"
    assert entry.occurrence_id is None and not entry.is_extra


def test_sunday_and_a_disabled_saturday_are_left_out():
    days = week([rule(day=6), rule(day=7)])
    assert [d.date for d in days] == [MONDAY + timedelta(days=i) for i in range(5)]


def test_saturday_is_shown_when_the_institution_enables_it():
    days = week([rule(day=6)], saturday=True)
    assert days[-1].date == SATURDAY
    assert len(days[-1].entries) == 1


def test_a_cancelled_class_keeps_its_slot_and_reason():
    cancelled = occurrence(status="CANCELLED", cancellationReason="Teacher on leave")
    entry = week([rule()], [cancelled])[0].entries[0]
    assert entry.status == "CANCELLED"
    assert entry.cancellation_reason == "Teacher on leave"
    assert entry.occurrence_id == "occ-1"


def test_a_substitute_replaces_the_weekly_teacher():
    substituted = occurrence(substituteFaculty=teacher("Vikram", "Shah"))
    entry = week([rule(teacher=teacher("Asha"))], [substituted])[0].entries[0]
    assert entry.teacher_name == "Vikram Shah"
    assert entry.is_substitute


def test_rules_outside_their_dates_do_not_apply():
    starts_later = rule(effectiveFrom=datetime(2026, 11, 3))
    ended = rule(start="11:00", end="12:00", effectiveUntil=datetime(2026, 11, 1))
    assert week([starts_later, ended])[0].entries == []


def test_nothing_is_shown_before_the_student_joined_the_section():
    joined_midweek = {"sec-1": date(2026, 11, 4)}
    days = week([rule(day=1), rule(day=3, start="10:00", end="11:00")], since=joined_midweek)
    assert days[0].entries == []
    assert len(days[2].entries) == 1


def test_a_class_started_on_the_spot_is_an_extra():
    spot = occurrence(day=MONDAY, start="14:10", end="15:10", id="occ-9")
    entries = week([rule()], [spot])[0].entries
    assert [e.start_time for e in entries] == ["09:00", "14:10"]
    assert [e.is_extra for e in entries] == [False, True]


def test_entries_are_ordered_by_start_time():
    later = rule(start="11:00", end="12:00")
    earlier = rule(start="08:00", end="09:00")
    assert [e.start_time for e in week([later, earlier])[0].entries] == ["08:00", "11:00"]


def test_the_students_own_mark_is_attached():
    marked = occurrence(attendanceRecords=[NS(status="PRESENT")], status="CONDUCTED", isAttendanceLocked=True)
    assert week([rule()], [marked])[0].entries[0].attendance_status == "PRESENT"


def test_a_closed_class_without_a_record_is_an_absence():
    closed = occurrence(status="CONDUCTED", isAttendanceLocked=True)
    assert week([rule()], [closed])[0].entries[0].attendance_status == "ABSENT"


def test_an_open_class_without_a_record_has_no_status_yet():
    assert week([rule()], [occurrence()])[0].entries[0].attendance_status is None


def test_an_open_window_is_reported_with_its_closing_time():
    closes = datetime.now(timezone.utc) + timedelta(minutes=20)
    live = occurrence(verificationActive=True, verificationExpires=closes)
    entry = week([rule()], [live])[0].entries[0]
    assert entry.window_open
    assert entry.window_closes_at == closes


def test_an_expired_window_is_not_open():
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    stale = occurrence(verificationActive=True, verificationExpires=past)
    entry = week([rule()], [stale])[0].entries[0]
    assert not entry.window_open and entry.window_closes_at is None
