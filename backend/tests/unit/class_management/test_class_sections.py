from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.schemas.class_management import ClassSectionCreate, ClassSectionUpdate, SectionScheduleCreate
from app.services.class_management import class_schedule_service as schedule
from app.services.class_management import class_section_service as sections
from app.services.class_management import teacher_availability as availability


def section(section_id="sec-1", subject_id="sub-1", teacher_id="t-1", room_id=None):
    faculties = [SimpleNamespace(isPrimary=True, teacherId=teacher_id)] if teacher_id else []
    return SimpleNamespace(id=section_id, subjectId=subject_id, faculties=faculties, defaultRoomId=room_id)


def group(*course_sections):
    return SimpleNamespace(
        id="g-1",
        batch="A-1",
        departmentId="dep-1",
        department=SimpleNamespace(code="CE"),
        courseSections=list(course_sections),
        members=[SimpleNamespace(studentId="s1")],
    )


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    for model in ("subject", "classroom", "teacher"):
        getattr(fake, model).find_first = AsyncMock(return_value=SimpleNamespace(id="x"))
    fake.coursesection.create = AsyncMock(return_value=SimpleNamespace(id="sec-new"))
    fake.coursesection.delete = AsyncMock()
    fake.coursefaculty.delete_many = AsyncMock()
    fake.coursefaculty.create = AsyncMock()
    fake.timetablerule.find_many = AsyncMock(return_value=[])
    fake.timetablerule.find_first = AsyncMock(return_value=None)
    fake.timetablerule.update_many = AsyncMock()
    fake.timetablerule.create = AsyncMock()
    fake.timetablerule.update = AsyncMock()
    fake.timetablerule.delete = AsyncMock()
    fake.classoccurrence.update_many = AsyncMock()
    fake.classoccurrence.delete_many = AsyncMock()
    fake.attendancerecord.count = AsyncMock(return_value=0)
    for module in (sections, schedule, availability):
        monkeypatch.setattr(module, "db", fake)
    monkeypatch.setattr(sections, "enroll_students", AsyncMock())
    monkeypatch.setattr(sections, "build_detail", lambda g: g)
    monkeypatch.setattr(schedule, "build_detail", lambda g: g)
    return fake


@pytest.fixture
def current_group(monkeypatch):
    holder = SimpleNamespace(value=group(section()))

    async def get_group(tenant_id, class_id):
        return holder.value

    monkeypatch.setattr(sections, "get_class_group", get_group)
    monkeypatch.setattr(schedule, "get_class_group", get_group)
    return holder


class TestSections:
    async def test_adding_a_subject_enrols_every_current_member(self, fake_db, current_group):
        current_group.value = group()

        await sections.create_section("tenant-1", "g-1", ClassSectionCreate(subject_id="sub-9", primary_teacher_id="t-1"))

        sections.enroll_students.assert_awaited_once_with(["sec-new"], ["s1"])
        assert fake_db.coursesection.create.await_args.kwargs["data"]["tenantId"] == "tenant-1"

    async def test_a_subject_from_another_tenant_is_a_404(self, fake_db, current_group):
        fake_db.subject.find_first.return_value = None

        with pytest.raises(HTTPException) as caught:
            await sections.create_section("tenant-1", "g-1", ClassSectionCreate(subject_id="sub-9"))

        assert caught.value.status_code == 404
        assert fake_db.subject.find_first.await_args.kwargs["where"] == {"id": "sub-9", "tenantId": "tenant-1"}

    async def test_the_same_subject_cannot_be_added_twice(self, fake_db, current_group):
        with pytest.raises(HTTPException) as caught:
            await sections.create_section("tenant-1", "g-1", ClassSectionCreate(subject_id="sub-1"))
        assert caught.value.status_code == 409

    async def test_changing_the_teacher_updates_rules_and_only_future_unlocked_classes(self, fake_db, current_group):
        await sections.update_section("tenant-1", "g-1", "sec-1", ClassSectionUpdate(primary_teacher_id="t-2"))

        assert fake_db.timetablerule.update_many.await_args.kwargs["data"] == {"teacherId": "t-2"}
        where = fake_db.classoccurrence.update_many.await_args.kwargs["where"]
        assert where["status"] == "SCHEDULED" and where["isAttendanceLocked"] is False
        assert "gte" in where["date"]

    async def test_a_teacher_with_a_clashing_class_is_refused_before_anything_changes(self, fake_db, current_group):
        fake_db.timetablerule.find_many.return_value = [
            SimpleNamespace(dayOfWeek=1, startTime="09:00", endTime="10:00")
        ]
        fake_db.timetablerule.find_first.return_value = SimpleNamespace(id="clash")

        with pytest.raises(HTTPException) as caught:
            await sections.update_section("tenant-1", "g-1", "sec-1", ClassSectionUpdate(primary_teacher_id="t-2"))

        assert caught.value.status_code == 409 and "Mon" in caught.value.detail
        fake_db.coursefaculty.delete_many.assert_not_awaited()
        fake_db.classoccurrence.update_many.assert_not_awaited()

    async def test_a_subject_with_attendance_cannot_be_removed(self, fake_db, current_group):
        fake_db.attendancerecord.count.return_value = 3

        with pytest.raises(HTTPException) as caught:
            await sections.delete_section("tenant-1", "g-1", "sec-1")

        assert caught.value.status_code == 409
        fake_db.coursesection.delete.assert_not_awaited()

    async def test_a_subject_without_attendance_can_be_removed(self, fake_db, current_group):
        await sections.delete_section("tenant-1", "g-1", "sec-1")
        fake_db.coursesection.delete.assert_awaited_once_with(where={"id": "sec-1"})

    async def test_a_section_from_another_class_is_a_404(self, fake_db, current_group):
        with pytest.raises(HTTPException) as caught:
            await sections.delete_section("tenant-1", "g-1", "sec-elsewhere")
        assert caught.value.status_code == 404


def slot(**overrides):
    return SectionScheduleCreate(**{"day_of_week": 1, "start_time": "09:00", "end_time": "10:00", **overrides})


class TestSchedule:
    @pytest.fixture(autouse=True)
    def saturday_config(self, monkeypatch):
        service = MagicMock()
        service.get_config = AsyncMock(return_value=SimpleNamespace(saturdayEnabled=False))
        monkeypatch.setattr(schedule, "SystemConfigService", lambda: service)
        return service

    async def test_a_subject_needs_a_teacher_before_it_can_be_scheduled(self, fake_db, current_group):
        current_group.value = group(section(teacher_id=None))

        with pytest.raises(HTTPException) as caught:
            await schedule.add_slot("tenant-1", "g-1", "sec-1", slot())

        assert caught.value.status_code == 400

    async def test_saturday_is_refused_when_the_institution_has_it_off(self, fake_db, current_group):
        with pytest.raises(HTTPException) as caught:
            await schedule.add_slot("tenant-1", "g-1", "sec-1", slot(day_of_week=6))
        assert caught.value.status_code == 400

    async def test_saturday_is_allowed_when_switched_on(self, fake_db, current_group, saturday_config):
        saturday_config.get_config.return_value = SimpleNamespace(saturdayEnabled=True)
        await schedule.add_slot("tenant-1", "g-1", "sec-1", slot(day_of_week=6))
        fake_db.timetablerule.create.assert_awaited_once()

    async def test_a_new_slot_starts_today_and_never_ends(self, fake_db, current_group):
        await schedule.add_slot("tenant-1", "g-1", "sec-1", slot())

        data = fake_db.timetablerule.create.await_args.kwargs["data"]
        assert data["effectiveUntil"] is None and data["isActive"] is True
        assert data["teacherId"] == "t-1" and data["tenantId"] == "tenant-1"

    @pytest.mark.parametrize(
        "clash, message",
        [(0, "teacher"), (1, "room"), (2, "another subject")],
    )
    async def test_each_kind_of_overlap_is_a_409(self, fake_db, current_group, clash, message):
        current_group.value = group(section(room_id="room-1"))
        answers = [None, None, None, None]
        answers[clash] = SimpleNamespace(id="clash")
        fake_db.timetablerule.find_first.side_effect = answers

        with pytest.raises(HTTPException) as caught:
            await schedule.add_slot("tenant-1", "g-1", "sec-1", slot())

        assert caught.value.status_code == 409 and message in caught.value.detail
        fake_db.timetablerule.create.assert_not_awaited()

    async def test_removing_a_slot_with_attendance_only_deactivates_it(self, fake_db, current_group):
        fake_db.timetablerule.find_first.return_value = SimpleNamespace(id="rule-1")
        fake_db.attendancerecord.count.return_value = 4

        await schedule.remove_slot("tenant-1", "g-1", "sec-1", "rule-1")

        fake_db.timetablerule.update.assert_awaited_once_with(where={"id": "rule-1"}, data={"isActive": False})
        fake_db.timetablerule.delete.assert_not_awaited()

    async def test_removing_a_slot_always_clears_its_unstarted_classes(self, fake_db, current_group):
        fake_db.timetablerule.find_first.return_value = SimpleNamespace(id="rule-1")

        await schedule.remove_slot("tenant-1", "g-1", "sec-1", "rule-1")

        where = fake_db.classoccurrence.delete_many.await_args.kwargs["where"]
        assert where == {"timetableRuleId": "rule-1", "status": "SCHEDULED"}
        fake_db.timetablerule.delete.assert_awaited_once()
