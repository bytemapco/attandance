from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services import occurrence_closer as module

DAY = datetime(2026, 11, 20, tzinfo=timezone.utc)


def enrollment(student_id: str, enrolled: date = date(2026, 8, 1), leaves=()):
    student = SimpleNamespace(id=student_id, leaveRequests=list(leaves))
    return SimpleNamespace(student=student, enrolledAt=datetime(enrolled.year, enrolled.month, enrolled.day, tzinfo=timezone.utc))


def leave(start: date, end: date):
    return SimpleNamespace(
        startDate=datetime(start.year, start.month, start.day, tzinfo=timezone.utc),
        endDate=datetime(end.year, end.month, end.day, 23, 59, tzinfo=timezone.utc),
    )


def occurrence(enrollments, marked=()):
    return SimpleNamespace(
        id="occ-1",
        date=DAY,
        attendanceRecords=[SimpleNamespace(studentId=s) for s in marked],
        courseSection=SimpleNamespace(enrollments=enrollments),
    )


@pytest.fixture
def fake(monkeypatch):
    calls = []
    db = MagicMock()
    db.attendancerecord.create = AsyncMock(side_effect=lambda data: calls.append(("record", data)) or SimpleNamespace(id=f"rec-{data['studentId']}"))
    db.attendanceauditlog.create = AsyncMock(side_effect=lambda data: calls.append(("audit", data)))
    db.classoccurrence.update = AsyncMock(side_effect=lambda **kw: calls.append(("lock", kw["data"])))
    monkeypatch.setattr(module, "db", db)
    refresh = AsyncMock()
    monkeypatch.setattr(module, "refresh_streaks", refresh)
    return SimpleNamespace(calls=calls, refresh=refresh)


def records(fake):
    return {data["studentId"]: data for kind, data in fake.calls if kind == "record"}


async def test_students_without_a_mark_become_absent_and_the_class_locks(fake):
    occ = occurrence([enrollment("s1"), enrollment("s2")], marked=["s1"])

    created = await module.close_occurrence("t1", occ, "user-1")

    assert created == 1
    assert set(records(fake)) == {"s2"}
    assert records(fake)["s2"]["status"] == "ABSENT"
    assert "faceScore" not in records(fake)["s2"]


async def test_the_class_is_locked_only_after_every_record_is_written(fake):
    await module.close_occurrence("t1", occurrence([enrollment("s1")]), "user-1")

    assert [kind for kind, _ in fake.calls] == ["record", "audit", "lock"]
    lock = fake.calls[-1][1]
    assert lock["isAttendanceLocked"] is True and lock["lockedById"] == "user-1" and lock["lockedAt"] is not None


async def test_a_student_on_approved_leave_is_excused_not_absent(fake):
    on_leave = enrollment("s1", leaves=[leave(date(2026, 11, 19), date(2026, 11, 21))])

    await module.close_occurrence("t1", occurrence([on_leave]), "user-1")

    assert records(fake)["s1"]["status"] == "EXCUSED"
    assert records(fake)["s1"]["method"] == "SYSTEM_EXCUSED"


async def test_leave_that_does_not_cover_the_day_does_not_excuse(fake):
    elsewhere = enrollment("s1", leaves=[leave(date(2026, 11, 1), date(2026, 11, 2))])

    await module.close_occurrence("t1", occurrence([elsewhere]), "user-1")

    assert records(fake)["s1"]["status"] == "ABSENT"


async def test_a_student_who_joined_after_the_class_is_not_marked_absent(fake):
    late_joiner = enrollment("s1", enrolled=date(2026, 11, 25))

    created = await module.close_occurrence("t1", occurrence([late_joiner]), "user-1")

    assert created == 0 and records(fake) == {}


async def test_automatic_close_says_so_in_the_audit_trail(fake):
    await module.close_occurrence("t1", occurrence([enrollment("s1")]), "user-1", auto=True)

    audit = next(data for kind, data in fake.calls if kind == "audit")
    assert "closed automatically" in audit["reason"] and audit["changedById"] == "user-1"


async def test_everyone_in_the_class_gets_their_streak_refreshed(fake):
    occ = occurrence([enrollment("s1"), enrollment("s2")], marked=["s1"])

    await module.close_occurrence("t1", occ, "user-1")

    fake.refresh.assert_awaited_once_with({"s1", "s2"})
