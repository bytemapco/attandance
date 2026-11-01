from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.core.datetime_utils import get_ist_today
from app.services.teacher_schedule_service import TeacherScheduleService

TENANT = "t-1"


def _occurrence(**overrides) -> SimpleNamespace:
    base = dict(
        id="occ-1", tenantId=TENANT, facultyId="fac-1", substituteFacultyId=None, isAttendanceLocked=False,
        status="SCHEDULED", date=datetime.combine(get_ist_today(), datetime.min.time()),
        courseSection=SimpleNamespace(academicYear=SimpleNamespace(verificationWindowMin=30)),
    )
    return SimpleNamespace(**{**base, **overrides})


async def _start(occurrence: SimpleNamespace | None, teacher_id: str = "fac-1"):
    with patch("app.services.teacher_schedule_service.db") as db:
        db.classoccurrence.find_first = AsyncMock(return_value=occurrence)
        db.classoccurrence.update = AsyncMock(return_value=SimpleNamespace(verificationActive=True))
        return await TeacherScheduleService.start_occurrence_attendance(TENANT, teacher_id, "occ-1"), db


@pytest.mark.anyio
async def test_owner_can_start_today() -> None:
    started, db = await _start(_occurrence())
    assert started.verificationActive is True
    assert db.classoccurrence.update.await_args.kwargs["data"]["status"] == "CONDUCTED"


@pytest.mark.anyio
async def test_substitute_can_start() -> None:
    started, _ = await _start(_occurrence(substituteFacultyId="fac-2"), teacher_id="fac-2")
    assert started.verificationActive is True


@pytest.mark.anyio
@pytest.mark.parametrize(
    "occurrence,code",
    [
        (None, 404),
        (_occurrence(), 403),
        (_occurrence(isAttendanceLocked=True), 400),
        (_occurrence(status="CANCELLED"), 400),
        (_occurrence(date=datetime.combine(get_ist_today() - timedelta(days=1), datetime.min.time())), 400),
        (_occurrence(date=datetime.combine(get_ist_today() + timedelta(days=1), datetime.min.time())), 400),
    ],
)
async def test_start_rejections(occurrence: SimpleNamespace | None, code: int) -> None:
    teacher = "someone-else" if code == 403 else "fac-1"
    with pytest.raises(HTTPException) as exc:
        await _start(occurrence, teacher_id=teacher)
    assert exc.value.status_code == code
