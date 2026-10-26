from unittest.mock import AsyncMock
import pytest
from app.services.leave_service import LeaveService


class MockLeave:
    def __init__(self, leave_id: str = "leave-10", student_id: str = "student-10"):
        self.id = leave_id
        self.studentId = student_id
        self.startDate = None
        self.endDate = None


@pytest.mark.unit
async def test_teacher_with_no_classes_cannot_approve_leave(monkeypatch):
    """BUG-008: A teacher with no assigned classes cannot approve any leave requests."""
    service = LeaveService()
    mock_leave = MockLeave()
    service.leave_repo.get_by_id = AsyncMock(return_value=mock_leave)

    import app.services.leave_service as leave_module
    from unittest.mock import MagicMock
    mock_db = MagicMock()
    mock_db.academicclass = MagicMock(find_many=AsyncMock(return_value=[]))
    monkeypatch.setattr(leave_module, "db", mock_db)

    approval_result = await service.approve_leave(
        leave_id="leave-10",
        teacher_id="teacher-no-classes",
        status="APPROVED",
    )

    assert approval_result is None
