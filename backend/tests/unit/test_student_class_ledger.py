from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services import student_class_ledger as module
from app.services.student_class_ledger import HeldClass, held_classes


def enrollment(section, since):
    return SimpleNamespace(courseSectionId=section, enrolledAt=datetime.fromisoformat(since))


def occurrence(oid, section, day):
    return SimpleNamespace(id=oid, courseSectionId=section, date=datetime.fromisoformat(day))


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.courseenrollment.find_many = AsyncMock(return_value=[enrollment("sec-1", "2026-10-01T00:00:00")])
    fake.classoccurrence.find_many = AsyncMock(return_value=[])
    fake.attendancerecord.find_many = AsyncMock(return_value=[])
    monkeypatch.setattr(module, "db", fake)
    return fake


async def test_a_student_with_no_active_subjects_has_no_classes(fake_db):
    fake_db.courseenrollment.find_many.return_value = []

    assert await held_classes("stu-1", "tenant-1") == []
    fake_db.classoccurrence.find_many.assert_not_awaited()


async def test_only_closed_conducted_classes_in_the_tenant_are_counted(fake_db):
    await held_classes("stu-1", "tenant-1")

    where = fake_db.classoccurrence.find_many.await_args.kwargs["where"]
    assert where["tenantId"] == "tenant-1"
    assert where["status"] == "CONDUCTED" and where["isAttendanceLocked"] is True


async def test_enrolments_are_limited_to_active_ones_in_the_tenant(fake_db):
    await held_classes("stu-1", "tenant-1")

    where = fake_db.courseenrollment.find_many.await_args.kwargs["where"]
    assert where["status"] == "ACTIVE" and where["endedAt"] is None
    assert where["courseSection"] == {"is": {"tenantId": "tenant-1"}}


async def test_classes_before_the_student_enrolled_do_not_count(fake_db):
    fake_db.classoccurrence.find_many.return_value = [
        occurrence("o-old", "sec-1", "2026-09-30T00:00:00"),
        occurrence("o-same-day", "sec-1", "2026-10-01T00:00:00"),
        occurrence("o-new", "sec-1", "2026-10-05T00:00:00"),
    ]

    result = await held_classes("stu-1", "tenant-1")

    assert [h.occurrence_date for h in result] == [date(2026, 10, 1), date(2026, 10, 5)]


async def test_a_class_with_no_record_has_a_none_status_not_a_made_up_one(fake_db):
    fake_db.classoccurrence.find_many.return_value = [occurrence("o-1", "sec-1", "2026-10-05T00:00:00")]

    assert await held_classes("stu-1", "tenant-1") == [HeldClass(date(2026, 10, 5), None)]


async def test_the_recorded_status_is_attached_to_its_class(fake_db):
    fake_db.classoccurrence.find_many.return_value = [
        occurrence("o-1", "sec-1", "2026-10-05T00:00:00"),
        occurrence("o-2", "sec-1", "2026-10-06T00:00:00"),
    ]
    fake_db.attendancerecord.find_many.return_value = [
        SimpleNamespace(occurrenceId="o-1", status="PRESENT"),
        SimpleNamespace(occurrenceId="o-2", status="ABSENT"),
    ]

    result = await held_classes("stu-1", "tenant-1")

    assert [h.status for h in result] == ["PRESENT", "ABSENT"]
    where = fake_db.attendancerecord.find_many.await_args.kwargs["where"]
    assert where["studentId"] == "stu-1" and where["tenantId"] == "tenant-1"
