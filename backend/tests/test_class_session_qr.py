from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.core.security import create_access_token, decode_access_token
from app.services import occurrence_marking_service as marking
from app.services import occurrence_qr_service as qr
from app.services import teacher_class_session_service as sessions

STUDENT = SimpleNamespace(id="stu-1", userId="usr-1", tenantId="t-1")
TEACHER = SimpleNamespace(id="tch-1", tenantId="t-1")


def _occurrence(**kw) -> SimpleNamespace:
    base = dict(
        id="occ-1", courseSectionId="sec-1", verificationActive=True, isAttendanceLocked=False, status="CONDUCTED",
        verificationExpires=datetime.now(timezone.utc) + timedelta(minutes=30),
    )
    return SimpleNamespace(**{**base, **kw})


@pytest.fixture
def qr_env():
    config = SimpleNamespace(isGpsVerificationEnabled=False)
    with patch.object(marking, "db") as db, patch.object(qr, "SystemConfigService") as cfg:
        db.classoccurrence.find_first = AsyncMock(return_value=_occurrence())
        db.courseenrollment.find_first = AsyncMock(return_value=SimpleNamespace(id="enr-1"))
        db.attendancerecord.find_unique = AsyncMock(return_value=None)
        db.attendancerecord.create = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        db.attendanceauditlog.create = AsyncMock()
        cfg.return_value.get_config = AsyncMock(return_value=config)
        yield SimpleNamespace(db=db, config=config)


def test_qr_token_cannot_authenticate_as_a_user() -> None:
    token = qr.issue_qr(_occurrence())["qr_token"]
    payload = decode_access_token(token)
    assert (payload["sub"], payload["type"], payload["occurrence_id"]) == ("occ-1", "occurrence_qr", "occ-1")


def test_qr_is_only_issued_while_attendance_is_open() -> None:
    with pytest.raises(HTTPException) as exc:
        qr.issue_qr(_occurrence(verificationActive=False))
    assert exc.value.status_code == 409


@pytest.mark.anyio
async def test_qr_scan_marks_present_without_scores(qr_env) -> None:
    token = qr.issue_qr(_occurrence())["qr_token"]
    _, _, newly_marked = await qr.mark_by_qr(STUDENT, token, 19.0, 72.0, 5.0)
    data = qr_env.db.attendancerecord.create.await_args.kwargs["data"]
    assert (data["status"], data["method"], data["faceScore"], data["livenessScore"]) == ("PRESENT", "QR_CODE", None, None)
    assert newly_marked


@pytest.mark.anyio
async def test_repeat_scan_returns_original_record(qr_env) -> None:
    original = SimpleNamespace(id="rec-0", status="PRESENT")
    qr_env.db.attendancerecord.find_unique.return_value = original
    token = qr.issue_qr(_occurrence())["qr_token"]
    record, _, newly_marked = await qr.mark_by_qr(STUDENT, token, 19.0, 72.0, 5.0)
    assert record is original and not newly_marked
    qr_env.db.attendancerecord.create.assert_not_awaited()


@pytest.mark.anyio
@pytest.mark.parametrize(
    "token",
    [
        "not-a-token",
        create_access_token(subject="usr-9", role="TEACHER", extra_data={"type": "teacher_smart_pass"}),
        create_access_token(
            subject="occ-1", role="QR", expires_delta=timedelta(seconds=-1),
            extra_data={"type": "occurrence_qr", "occurrence_id": "occ-1"},
        ),
    ],
)
async def test_invalid_or_expired_qr_is_rejected(qr_env, token: str) -> None:
    with pytest.raises(HTTPException) as exc:
        await qr.mark_by_qr(STUDENT, token, 19.0, 72.0, 5.0)
    assert exc.value.status_code == 400
    qr_env.db.attendancerecord.create.assert_not_awaited()


@pytest.mark.anyio
async def test_qr_scan_after_teacher_closed_window_is_rejected(qr_env) -> None:
    token = qr.issue_qr(_occurrence())["qr_token"]
    qr_env.db.classoccurrence.find_first.return_value = _occurrence(isAttendanceLocked=True)
    with pytest.raises(HTTPException) as exc:
        await qr.mark_by_qr(STUDENT, token, 19.0, 72.0, 5.0)
    assert exc.value.status_code == 409


SLOTS = [
    SimpleNamespace(id="s1", name="Period 1", startTime="09:00", endTime="10:00"),
    SimpleNamespace(id="s2", name="Period 2", startTime="10:00", endTime="11:00"),
]


@pytest.fixture
def start_env():
    with patch.object(sessions, "db") as db, patch.object(sessions, "get_ist_now") as now, patch.object(
        sessions.TeacherScheduleService, "start_occurrence_attendance", AsyncMock()
    ) as start:
        db.coursesection.find_first = AsyncMock(return_value=SimpleNamespace(id="sec-1", defaultRoomId=None, occurrences=[]))
        db.timeslot.find_many = AsyncMock(return_value=SLOTS)
        db.classoccurrence.find_unique = AsyncMock(return_value=None)
        db.classoccurrence.create = AsyncMock(return_value=SimpleNamespace(id="occ-new"))
        now.return_value = datetime(2026, 11, 2, 10, 30)
        start.return_value = SimpleNamespace(id="occ-new", verificationExpires=None)
        yield SimpleNamespace(db=db, now=now, start=start)


@pytest.mark.anyio
async def test_start_creates_occurrence_in_current_period_for_this_teacher(start_env) -> None:
    result = await sessions.start_class_session("t-1", TEACHER, "sec-1")
    data = start_env.db.classoccurrence.create.await_args.kwargs["data"]
    assert (data["timeSlotId"], data["facultyId"], data["tenantId"]) == ("s2", "tch-1", "t-1")
    assert result["occurrence_id"] == "occ-new"
    where = start_env.db.coursesection.find_first.await_args.kwargs["where"]
    assert where["tenantId"] == "t-1" and where["faculties"] == {"some": {"teacherId": "tch-1"}}


@pytest.mark.anyio
async def test_start_while_live_returns_the_same_session(start_env) -> None:
    live = _occurrence(id="occ-live")
    start_env.db.coursesection.find_first.return_value = SimpleNamespace(id="sec-1", defaultRoomId=None, occurrences=[live])
    result = await sessions.start_class_session("t-1", TEACHER, "sec-1")
    assert result["occurrence_id"] == "occ-live"
    start_env.db.classoccurrence.create.assert_not_awaited()
    start_env.start.assert_not_awaited()


@pytest.mark.anyio
async def test_start_refuses_a_period_already_closed(start_env) -> None:
    start_env.db.classoccurrence.find_unique.return_value = SimpleNamespace(id="occ-old", isAttendanceLocked=True)
    with pytest.raises(HTTPException) as exc:
        await sessions.start_class_session("t-1", TEACHER, "sec-1")
    assert exc.value.status_code == 409


@pytest.mark.anyio
async def test_start_on_unassigned_class_is_not_found(start_env) -> None:
    start_env.db.coursesection.find_first.return_value = None
    with pytest.raises(HTTPException) as exc:
        await sessions.start_class_session("t-1", TEACHER, "sec-x")
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_start_without_time_slots_asks_for_admin_setup(start_env) -> None:
    start_env.db.timeslot.find_many.return_value = []
    with pytest.raises(HTTPException) as exc:
        await sessions.start_class_session("t-1", TEACHER, "sec-1")
    assert exc.value.status_code == 409 and "time slots" in exc.value.detail
