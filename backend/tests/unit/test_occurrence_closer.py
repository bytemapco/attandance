from contextlib import asynccontextmanager
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
    """A database whose transaction records the writes in order. `taken_by` lists students whose own mark landed
    first, so the bulk insert skips them as the real one does."""
    calls = []
    state = SimpleNamespace(taken_by=set(), transactions=0)

    async def create_many(data, skip_duplicates=False):
        assert skip_duplicates is True
        written = [r for r in data if r["studentId"] not in state.taken_by]
        calls.append(("records", written))
        return len(written)

    async def find_many(where):
        wanted = set(where["id"]["in"])
        return [SimpleNamespace(id=r["id"]) for kind, rows in calls if kind == "records" for r in rows if r["id"] in wanted]

    async def audit_many(data):
        calls.append(("audit", data))

    async def lock(where, data):
        calls.append(("lock", data))

    tx = MagicMock()
    tx.attendancerecord.create_many = create_many
    tx.attendancerecord.find_many = find_many
    tx.attendanceauditlog.create_many = audit_many
    tx.classoccurrence.update = lock

    @asynccontextmanager
    async def transaction():
        state.transactions += 1
        yield tx

    db = MagicMock()
    db.tx = transaction
    monkeypatch.setattr(module, "db", db)
    refresh = AsyncMock()
    monkeypatch.setattr(module, "refresh_streaks", refresh)
    return SimpleNamespace(calls=calls, refresh=refresh, state=state)


def records(fake):
    return {r["studentId"]: r for kind, rows in fake.calls if kind == "records" for r in rows}


def audit_entries(fake):
    return [a for kind, rows in fake.calls if kind == "audit" for a in rows]


async def test_students_without_a_mark_become_absent_and_the_class_locks(fake):
    occ = occurrence([enrollment("s1"), enrollment("s2")], marked=["s1"])

    created = await module.close_occurrence("t1", occ, "user-1")

    assert created == 1
    assert set(records(fake)) == {"s2"}
    assert records(fake)["s2"]["status"] == "ABSENT"
    assert "faceScore" not in records(fake)["s2"]


async def test_the_class_is_locked_only_after_every_record_is_written(fake):
    await module.close_occurrence("t1", occurrence([enrollment("s1")]), "user-1")

    assert [kind for kind, _ in fake.calls] == ["records", "audit", "lock"]
    lock = fake.calls[-1][1]
    assert lock["isAttendanceLocked"] is True and lock["lockedById"] == "user-1" and lock["lockedAt"] is not None


async def test_records_audit_entries_and_the_lock_are_one_transaction(fake):
    await module.close_occurrence("t1", occurrence([enrollment("s1"), enrollment("s2")]), "user-1")

    assert fake.state.transactions == 1


async def test_the_number_of_writes_does_not_grow_with_the_class(fake):
    await module.close_occurrence("t1", occurrence([enrollment(f"s{i}") for i in range(60)]), "user-1")

    assert [kind for kind, _ in fake.calls] == ["records", "audit", "lock"]
    assert len(records(fake)) == 60 and len(audit_entries(fake)) == 60


async def test_every_audit_entry_points_at_the_record_it_describes(fake):
    await module.close_occurrence("t1", occurrence([enrollment("s1"), enrollment("s2")]), "user-1")

    record_ids = {r["id"] for r in records(fake).values()}
    assert {a["attendanceRecordId"] for a in audit_entries(fake)} == record_ids
    assert all(a["previousStatus"] == "ABSENT" and a["newStatus"] == "ABSENT" for a in audit_entries(fake))


async def test_a_student_who_marked_themselves_a_moment_ago_keeps_their_record_and_gets_no_audit_entry(fake):
    fake.state.taken_by = {"s2"}

    created = await module.close_occurrence("t1", occurrence([enrollment("s1"), enrollment("s2")]), "user-1")

    assert created == 1
    assert set(records(fake)) == {"s1"}
    assert len(audit_entries(fake)) == 1


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


async def test_a_class_with_nobody_to_mark_still_locks(fake):
    await module.close_occurrence("t1", occurrence([], marked=["s1"]), "user-1")

    assert [kind for kind, _ in fake.calls] == ["lock"]


async def test_automatic_close_says_so_in_the_audit_trail(fake):
    await module.close_occurrence("t1", occurrence([enrollment("s1")]), "user-1", auto=True)

    audit = audit_entries(fake)[0]
    assert "closed automatically" in audit["reason"] and audit["changedById"] == "user-1"


async def test_everyone_in_the_class_gets_their_streak_refreshed(fake):
    occ = occurrence([enrollment("s1"), enrollment("s2")], marked=["s1"])

    await module.close_occurrence("t1", occ, "user-1")

    fake.refresh.assert_awaited_once_with({"s1", "s2"})
