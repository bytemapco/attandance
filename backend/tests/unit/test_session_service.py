from unittest.mock import AsyncMock
import pytest
from app.services.session_service import SessionService
from app.schemas.teacher import SessionStart


class MockClass:
    def __init__(self, class_id: str = "class-1", teacher_id: str = "teacher-1"):
        self.id = class_id
        self.teacherId = teacher_id


class MockSession:
    def __init__(self, session_id: str = "sess-1", is_active: bool = True):
        self.id = session_id
        self.isActive = is_active


@pytest.mark.unit
async def test_start_session_when_active_exists_raises_value_error():
    """BUG-009: Attempting to start a session when an active session exists must raise ValueError."""
    service = SessionService()
    service.class_repo.get_by_id = AsyncMock(return_value=MockClass())
    service.session_repo.get_active_session_by_class = AsyncMock(return_value=MockSession())

    session_start_data = SessionStart(academic_class_id="class-1", duration_minutes=60)
    with pytest.raises(ValueError, match="An active session already exists for this class"):
        await service.start_session(session_start_data, teacher_id="teacher-1")
