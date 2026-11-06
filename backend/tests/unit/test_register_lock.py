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
    monkeypatch.setattr(module, "authorize_register_access", AsyncMock())
    monkeypatch.setattr(module, "refresh_streaks", AsyncMock())
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


async def test_a_corrected_locked_register_refreshes_the_streaks_of_the_changed_students(fake_db):
    fake_db.classoccurrence.find_first.return_value = occurrence(locked=True)

    await submit(reason="Correction")

    module.refresh_streaks.assert_awaited_once_with({"stu-1"})


async def test_students_outside_the_class_are_rejected_before_anything_is_written(fake_db):
    fake_db.courseenrollment.find_many.return_value = []
    fake_db.attendancerecord.create = AsyncMock()

    with pytest.raises(HTTPException) as caught:
        await submit()

    assert caught.value.status_code == 400
    fake_db.attendancerecord.update.assert_not_awaited()
    fake_db.attendancerecord.create.assert_not_awaited()


async def test_an_unchanged_mark_writes_no_audit_row(fake_db):
    fake_db.attendancerecord.find_unique.return_value = SimpleNamespace(id="rec-1", status="PRESENT", remarks=None)

    result = await submit()

    assert result["records_processed"] == 0
    fake_db.attendanceauditlog.create.assert_not_awaited()


async def test_a_new_mark_creates_the_record_and_an_audit_row(fake_db):
    fake_db.attendancerecord.find_unique.return_value = None
    fake_db.attendancerecord.create = AsyncMock(return_value=SimpleNamespace(id="rec-9"))

    await submit()

    created = fake_db.attendancerecord.create.await_args.kwargs["data"]
    assert created["tenantId"] == "tenant-1" and created["method"] == "MANUAL_REGISTER"
    audit = fake_db.attendanceauditlog.create.await_args.kwargs["data"]
    assert audit["attendanceRecordId"] == "rec-9" and audit["newStatus"] == "PRESENT"


class TestRegisterAccess:
    @staticmethod
    def teacher_db(monkeypatch, teacher):
        fake = MagicMock()
        fake.teacher.find_first = AsyncMock(return_value=teacher)
        monkeypatch.setattr(module, "db", fake)
        return fake

    @staticmethod
    def class_taken_by(faculty_id, substitute=None):
        return SimpleNamespace(tenantId="tenant-1", facultyId=faculty_id, substituteFacultyId=substitute)

    async def test_admins_skip_the_teacher_check(self, monkeypatch):
        fake = self.teacher_db(monkeypatch, None)

        await module.authorize_register_access(self.class_taken_by("t-1"), SimpleNamespace(id="u", role="ADMIN"))

        fake.teacher.find_first.assert_not_awaited()

    async def test_the_assigned_teacher_may_open_the_register(self, monkeypatch):
        self.teacher_db(monkeypatch, SimpleNamespace(id="t-1"))

        await module.authorize_register_access(self.class_taken_by("t-1"), SimpleNamespace(id="u", role="TEACHER"))

    async def test_a_substitute_may_open_the_register(self, monkeypatch):
        self.teacher_db(monkeypatch, SimpleNamespace(id="t-2"))

        await module.authorize_register_access(
            self.class_taken_by("t-1", substitute="t-2"), SimpleNamespace(id="u", role="TEACHER")
        )

    async def test_another_teacher_is_refused(self, monkeypatch):
        self.teacher_db(monkeypatch, SimpleNamespace(id="t-9"))

        with pytest.raises(HTTPException) as caught:
            await module.authorize_register_access(self.class_taken_by("t-1"), SimpleNamespace(id="u", role="TEACHER"))

        assert caught.value.status_code == 403

    async def test_a_teacher_profile_from_another_tenant_is_not_found(self, monkeypatch):
        fake = self.teacher_db(monkeypatch, None)

        with pytest.raises(HTTPException):
            await module.authorize_register_access(self.class_taken_by("t-1"), SimpleNamespace(id="u", role="TEACHER"))

        assert fake.teacher.find_first.await_args.kwargs["where"] == {"userId": "u", "tenantId": "tenant-1"}


class TestScheduleRange:
    def test_a_single_day_is_allowed(self):
        from datetime import date

        module.validate_schedule_range(date(2026, 11, 2), date(2026, 11, 2))

    def test_an_end_before_the_start_is_refused(self):
        from datetime import date

        with pytest.raises(HTTPException) as caught:
            module.validate_schedule_range(date(2026, 11, 3), date(2026, 11, 2))
        assert caught.value.status_code == 400

    def test_31_days_is_refused_and_30_days_apart_is_the_longest_allowed(self):
        from datetime import date

        module.validate_schedule_range(date(2026, 11, 1), date(2026, 12, 1))
        with pytest.raises(HTTPException):
            module.validate_schedule_range(date(2026, 11, 1), date(2026, 12, 2))
