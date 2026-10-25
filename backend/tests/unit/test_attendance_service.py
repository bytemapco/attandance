from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
import pytest
from app.services.attendance_service import AttendanceService
from app.services.attendance.models import AttendanceSubmission


class MockSession:
    def __init__(self, is_active=True, expired=False):
        self.id = "session-100"
        self.academicClassId = "class-200"
        self.isActive = is_active
        now = datetime.now(timezone.utc)
        self.endTime = now - timedelta(minutes=10) if expired else now + timedelta(hours=1)


class MockConfig:
    def __init__(self, gps=False, face=False, background=False):
        self.isGpsVerificationEnabled = gps
        self.isFaceRecognitionEnabled = face
        self.isAiBackgroundValidationEnabled = background


@pytest.mark.unit
async def test_mark_attendance_expired_session(monkeypatch):
    service = AttendanceService()
    expired_session = MockSession(is_active=True, expired=True)

    service.session_repo.get_by_id = AsyncMock(return_value=expired_session)
    service.session_repo.deactivate = AsyncMock()

    submission = AttendanceSubmission(
        session_id="session-100",
        student_id="student-1",
        latitude=12.9716,
        longitude=77.5946,
        accuracy=5.0,
    )

    with pytest.raises(ValueError, match="Attendance session is not active or not found"):
        await service.mark_attendance(submission)


@pytest.mark.unit
async def test_mark_attendance_already_submitted(monkeypatch):
    service = AttendanceService()
    active_session = MockSession(is_active=True, expired=False)

    service.session_repo.get_by_id = AsyncMock(return_value=active_session)
    service.attendance_repo.get_by_student_and_session = AsyncMock(return_value=MagicMock(id="existing-att"))

    import app.services.attendance_service as att_module
    monkeypatch.setattr(
        att_module.SystemConfigService,
        "get_config",
        AsyncMock(return_value=MockConfig(gps=False, face=False)),
    )

    submission = AttendanceSubmission(
        session_id="session-100",
        student_id="student-1",
        latitude=12.9716,
        longitude=77.5946,
        accuracy=5.0,
    )

    with pytest.raises(ValueError, match="Attendance already submitted for this session"):
        await service.mark_attendance(submission)


@pytest.mark.unit
async def test_mark_attendance_missing_face_embedding(monkeypatch):
    service = AttendanceService()
    active_session = MockSession(is_active=True, expired=False)

    service.session_repo.get_by_id = AsyncMock(return_value=active_session)
    service.attendance_repo.get_by_student_and_session = AsyncMock(return_value=None)
    service.student_repo.get_face_embedding = AsyncMock(return_value=[])

    import app.services.attendance_service as att_module
    monkeypatch.setattr(
        att_module.SystemConfigService,
        "get_config",
        AsyncMock(return_value=MockConfig(gps=False, face=True)),
    )

    submission = AttendanceSubmission(
        session_id="session-100",
        student_id="student-1",
        latitude=12.9716,
        longitude=77.5946,
        accuracy=5.0,
        image_path="/path/to/selfie.jpg",
    )

    with pytest.raises(ValueError, match="Student face embedding is not registered"):
        await service.mark_attendance(submission)


@pytest.mark.unit
async def test_mark_attendance_missing_image_when_required(monkeypatch):
    service = AttendanceService()
    active_session = MockSession(is_active=True, expired=False)

    service.session_repo.get_by_id = AsyncMock(return_value=active_session)
    service.attendance_repo.get_by_student_and_session = AsyncMock(return_value=None)
    service.student_repo.get_face_embedding = AsyncMock(return_value=[0.1, 0.2, 0.3])

    import app.services.attendance_service as att_module
    monkeypatch.setattr(
        att_module.SystemConfigService,
        "get_config",
        AsyncMock(return_value=MockConfig(gps=False, face=True)),
    )

    submission = AttendanceSubmission(
        session_id="session-100",
        student_id="student-1",
        latitude=12.9716,
        longitude=77.5946,
        accuracy=5.0,
        image_path=None,
    )

    with pytest.raises(ValueError, match="Image is required when verification is enabled"):
        await service.mark_attendance(submission)
