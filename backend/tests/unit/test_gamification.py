from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
import pytest
from app.services.gamification_service import GamificationService


class DummySession:
    def __init__(self, session_id: str, start_time: datetime, is_active: bool = False):
        self.id = session_id
        self.academicClassId = "class-1"
        self.startTime = start_time
        self.endTime = start_time + timedelta(hours=1)
        self.isActive = is_active


class DummyAttendance:
    def __init__(self, session_id: str, status: str):
        self.sessionId = session_id
        self.status = status


class DummyLeave:
    def __init__(self, start_date: datetime, end_date: datetime):
        self.startDate = start_date
        self.endDate = end_date


@pytest.mark.unit
async def test_streak_consecutive_present(monkeypatch):
    service = GamificationService()
    now = datetime.now(timezone.utc)

    dummy_student = MagicMock(id="student-1", highestStreak=2)
    service.student_repo.get_by_id = AsyncMock(return_value=dummy_student)
    service.student_repo.update_streak = AsyncMock()
    service._update_redis_score = AsyncMock()

    sessions = [
        DummySession("s3", now - timedelta(days=1)),
        DummySession("s2", now - timedelta(days=2)),
        DummySession("s1", now - timedelta(days=3)),
    ]
    attendances = [
        DummyAttendance("s3", "Present"),
        DummyAttendance("s2", "Present"),
        DummyAttendance("s1", "Present"),
    ]

    import app.db.client as db_module
    mock_db = MagicMock()
    mock_db.enrollment.find_many = AsyncMock(return_value=[MagicMock(academicClassId="class-1")])
    mock_db.session.find_many = AsyncMock(return_value=sessions)
    mock_db.attendance.find_many = AsyncMock(return_value=attendances)
    mock_db.leaverequest.find_many = AsyncMock(return_value=[])
    monkeypatch.setattr(db_module, "db", mock_db)

    result = await service.recalculate_student_streak("student-1")
    assert result["current_streak"] == 3
    assert result["highest_streak"] == 3


@pytest.mark.unit
async def test_streak_with_approved_leave(monkeypatch):
    service = GamificationService()
    now = datetime.now(timezone.utc)

    dummy_student = MagicMock(id="student-1", highestStreak=1)
    service.student_repo.get_by_id = AsyncMock(return_value=dummy_student)
    service.student_repo.update_streak = AsyncMock()
    service._update_redis_score = AsyncMock()

    # s2 was during approved leave
    s2_time = now - timedelta(days=2)
    sessions = [
        DummySession("s3", now - timedelta(days=1)),
        DummySession("s2", s2_time),
        DummySession("s1", now - timedelta(days=3)),
    ]
    attendances = [
        DummyAttendance("s3", "Present"),
        DummyAttendance("s1", "Present"),
    ]
    leaves = [DummyLeave(s2_time - timedelta(hours=2), s2_time + timedelta(hours=2))]

    import app.db.client as db_module
    mock_db = MagicMock()
    mock_db.enrollment.find_many = AsyncMock(return_value=[MagicMock(academicClassId="class-1")])
    mock_db.session.find_many = AsyncMock(return_value=sessions)
    mock_db.attendance.find_many = AsyncMock(return_value=attendances)
    mock_db.leaverequest.find_many = AsyncMock(return_value=leaves)
    monkeypatch.setattr(db_module, "db", mock_db)

    result = await service.recalculate_student_streak("student-1")
    # s3 present, s2 excused on leave, s1 present -> current streak is 2
    assert result["current_streak"] == 2


@pytest.mark.unit
async def test_streak_broken_by_absence(monkeypatch):
    service = GamificationService()
    now = datetime.now(timezone.utc)

    dummy_student = MagicMock(id="student-1", highestStreak=5)
    service.student_repo.get_by_id = AsyncMock(return_value=dummy_student)
    service.student_repo.update_streak = AsyncMock()
    service._update_redis_score = AsyncMock()

    # s3 has no attendance (absent)
    sessions = [
        DummySession("s3", now - timedelta(days=1)),
        DummySession("s2", now - timedelta(days=2)),
        DummySession("s1", now - timedelta(days=3)),
    ]
    attendances = [
        DummyAttendance("s2", "Present"),
        DummyAttendance("s1", "Present"),
    ]

    import app.db.client as db_module
    mock_db = MagicMock()
    mock_db.enrollment.find_many = AsyncMock(return_value=[MagicMock(academicClassId="class-1")])
    mock_db.session.find_many = AsyncMock(return_value=sessions)
    mock_db.attendance.find_many = AsyncMock(return_value=attendances)
    mock_db.leaverequest.find_many = AsyncMock(return_value=[])
    monkeypatch.setattr(db_module, "db", mock_db)

    result = await service.recalculate_student_streak("student-1")
    assert result["current_streak"] == 0
    assert result["highest_streak"] == 5
