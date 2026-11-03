from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.schemas.timetable import AttendanceRegisterItem
from app.services import occurrence_register_service as module
from app.services.occurrence_register_service import OccurrenceRegisterService

USER = SimpleNamespace(id="user-1")


def occurrence(locked: bool):
    return SimpleNamespace(id="occ-1", courseSectionId="sec-1", isAttendanceLocked=locked)


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.classoccurrence.find_first = AsyncMock(return_value=occurrence(locked=False))
    fake.classoccurrence.update = AsyncMock()
    fake.courseenrollment.find_many = AsyncMock(return_value=[SimpleNamespace(studentId="stu-1")])
    fake.attendancerecord.find_unique = AsyncMock(return_value=SimpleNamespace(id="rec-1", status="ABSENT", remarks=None))
    fake.attendancerecord.update = AsyncMock()
    fake.attendanceauditlog.create = AsyncMock()
    monkeypatch.setattr(module, "db", fake)
    monkeypatch.setattr(module, "_authorize_register_access", AsyncMock())
    return fake


def mark_present():
    return [AttendanceRegisterItem(student_id="stu-1", status="PRESENT")]


async def submit(reason=None):
    return await OccurrenceRegisterService.update_register_bulk(
        tenant_id="tenant-1", user=USER, occurrence_id="occ-1", updates=mark_present(), reason=reason
    )


async def test_the_occurrence_is_looked_up_inside_the_callers_tenant(fake_db):
    await submit()

    where = fake_db.classoccurrence.find_first.await_args.kwargs["where"]
    assert where == {"id": "occ-1", "tenantId": "tenant-1"}


async def test_a_locked_register_cannot_be_edited_without_a_reason(fake_db):
    fake_db.classoccurrence.find_first.return_value = occurrence(locked=True)

    for blank in (None, "", "   "):
        with pytest.raises(HTTPException) as caught:
            await submit(reason=blank)
        assert caught.value.status_code == 409

    fake_db.attendancerecord.update.assert_not_awaited()
    fake_db.attendanceauditlog.create.assert_not_awaited()


async def test_a_locked_register_can_be_corrected_and_the_reason_is_audited(fake_db):
    fake_db.classoccurrence.find_first.return_value = occurrence(locked=True)

    result = await submit(reason="Marked the wrong student, confirmed with HOD")

    assert result["records_processed"] == 1
    audit = fake_db.attendanceauditlog.create.await_args.kwargs["data"]
    assert audit["previousStatus"] == "ABSENT" and audit["newStatus"] == "PRESENT"
    assert audit["changedById"] == "user-1"
    assert audit["reason"] == "Marked the wrong student, confirmed with HOD"


async def test_correcting_a_locked_register_keeps_the_original_conducted_time(fake_db):
    fake_db.classoccurrence.find_first.return_value = occurrence(locked=True)

    await submit(reason="Correction")

    fake_db.classoccurrence.update.assert_not_awaited()


async def test_an_open_register_is_marked_conducted_when_saved(fake_db):
    await submit()

    data = fake_db.classoccurrence.update.await_args.kwargs["data"]
    assert data["status"] == "CONDUCTED"
