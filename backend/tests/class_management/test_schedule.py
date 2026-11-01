from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi import HTTPException

from app.schemas.class_management import SectionScheduleCreate
from app.services.class_management import class_schedule_service
from class_management_support import TENANT, section, serve_terms, term

REQUEST = SectionScheduleCreate(day_of_week=1, time_slot_id="slot-1")


def _setup(fake: MagicMock, teacher: str | None = "t-1", is_break: bool = False) -> None:
    serve_terms(fake, term(sections=[section("sec-1", teacher_id=teacher)]))
    fake.timeslot.find_first.return_value = SimpleNamespace(id="slot-1", isBreak=is_break)


def _busy_on(fake: MagicMock, key: str) -> None:
    async def find_first(where):
        return SimpleNamespace(id="other") if key in where or key in str(where.get("courseSection")) else None

    fake.timetablerule.find_first = AsyncMock(side_effect=find_first)


async def _add(request: SectionScheduleCreate = REQUEST):
    return await class_schedule_service.add_slot(TENANT, "ct-1", "sec-1", request)


@pytest.mark.anyio
async def test_schedule_creates_rule_for_primary_teacher_over_semester(fake_db: MagicMock) -> None:
    _setup(fake_db)
    await _add()
    data = fake_db.timetablerule.create.await_args.kwargs["data"]
    assert (data["teacherId"], data["dayOfWeek"], data["timeSlotId"]) == ("t-1", 1, "slot-1")
    assert (data["effectiveFrom"].month, data["effectiveUntil"].month) == (7, 12)
    assert data["tenantId"] == TENANT


@pytest.mark.anyio
async def test_schedule_requires_a_teacher(fake_db: MagicMock) -> None:
    _setup(fake_db, teacher=None)
    with pytest.raises(HTTPException) as exc:
        await _add()
    assert exc.value.status_code == 400
    fake_db.timetablerule.create.assert_not_awaited()


@pytest.mark.anyio
async def test_schedule_rejects_break_slot(fake_db: MagicMock) -> None:
    _setup(fake_db, is_break=True)
    with pytest.raises(HTTPException) as exc:
        await _add()
    assert exc.value.status_code == 400


@pytest.mark.anyio
@pytest.mark.parametrize("busy,message", [("teacherId", "teacher"), ("courseSection", "class")])
async def test_schedule_rejects_conflicts(fake_db: MagicMock, busy: str, message: str) -> None:
    _setup(fake_db)
    _busy_on(fake_db, busy)
    with pytest.raises(HTTPException) as exc:
        await _add()
    assert exc.value.status_code == 409
    assert message in exc.value.detail
    fake_db.timetablerule.create.assert_not_awaited()


@pytest.mark.anyio
async def test_schedule_rejects_double_booked_room(fake_db: MagicMock) -> None:
    _setup(fake_db)
    fake_db.classroom.find_first.return_value = SimpleNamespace(id="room-1")
    _busy_on(fake_db, "classroomId")
    with pytest.raises(HTTPException) as exc:
        await _add(SectionScheduleCreate(day_of_week=1, time_slot_id="slot-1", classroom_id="room-1"))
    assert exc.value.status_code == 409


@pytest.mark.anyio
async def test_remove_keeps_history_when_attendance_exists(fake_db: MagicMock) -> None:
    _setup(fake_db)
    fake_db.timetablerule.find_first.return_value = SimpleNamespace(id="r-1")
    fake_db.attendancerecord.count.return_value = 3
    await class_schedule_service.remove_slot(TENANT, "ct-1", "sec-1", "r-1")
    assert fake_db.timetablerule.update.await_args.kwargs["data"] == {"isActive": False}
    fake_db.timetablerule.delete.assert_not_awaited()


@pytest.mark.anyio
async def test_remove_deletes_unused_rule_and_future_occurrences(fake_db: MagicMock) -> None:
    _setup(fake_db)
    fake_db.timetablerule.find_first.return_value = SimpleNamespace(id="r-1")
    fake_db.attendancerecord.count.return_value = 0
    await class_schedule_service.remove_slot(TENANT, "ct-1", "sec-1", "r-1")
    fake_db.timetablerule.delete.assert_awaited_once()
    assert fake_db.classoccurrence.delete_many.await_args.kwargs["where"]["status"] == "SCHEDULED"
