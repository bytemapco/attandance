from unittest.mock import AsyncMock
import pytest
from fastapi import HTTPException
from app.services.auth_service import AuthService
from app.schemas.auth import UserLogin


class MockUser:
    def __init__(self, user_id: str = "user-1", role: str = "STUDENT", is_active: bool = True):
        self.id = user_id
        self.email = "student@test.edu"
        self.role = role
        self.isActive = is_active
        self.hashedPassword = "hashed_pw"
        self.mustChangePassword = False
        self.tenantId = None


class MockStudent:
    def __init__(self, student_id: str = "stud-1", device_uuid: str | None = "DEVICE-AAA"):
        self.id = student_id
        self.deviceUuid = device_uuid


@pytest.mark.unit
async def test_student_login_without_device_uuid_when_bound_raises_403(monkeypatch):
    """BUG-001: Student omitting device_uuid when account already has registered UUID must be blocked."""
    service = AuthService()
    mock_user = MockUser(role="STUDENT")
    mock_student = MockStudent(device_uuid="REGISTERED-UUID")

    service.user_repo.get_by_email = AsyncMock(return_value=mock_user)
    service.student_repo.get_by_user_id = AsyncMock(return_value=mock_student)

    monkeypatch.setattr("app.services.auth_service.verify_password", lambda plain, hashed: True)

    login_payload = UserLogin(email="student@test.edu", password="ValidPassword123")
    with pytest.raises(HTTPException) as exc_info:
        await service.authenticate(login_payload)

    assert exc_info.value.status_code == 403
    assert "Device UUID is required" in exc_info.value.detail


@pytest.mark.unit
async def test_student_login_with_mismatched_device_uuid_raises_403(monkeypatch):
    """BUG-001: Student logging in with mismatched device_uuid must be blocked."""
    service = AuthService()
    mock_user = MockUser(role="STUDENT")
    mock_student = MockStudent(device_uuid="REGISTERED-UUID")

    service.user_repo.get_by_email = AsyncMock(return_value=mock_user)
    service.student_repo.get_by_user_id = AsyncMock(return_value=mock_student)

    monkeypatch.setattr("app.services.auth_service.verify_password", lambda plain, hashed: True)

    login_payload = UserLogin(
        email="student@test.edu", password="ValidPassword123", device_uuid="DIFFERENT-UUID"
    )
    with pytest.raises(HTTPException) as exc_info:
        await service.authenticate(login_payload)

    assert exc_info.value.status_code == 403
    assert "bound to another device" in exc_info.value.detail


@pytest.mark.unit
async def test_complete_onboarding_already_active_user_raises_400():
    """BUG-020: Invitation tokens cannot be reused for already-active accounts."""
    service = AuthService()
    service.verify_invitation_token = AsyncMock(return_value={"user_id": "user-active", "email": "a@b.com"})
    active_user = MockUser(user_id="user-active", is_active=True)
    service.user_repo.get_by_id = AsyncMock(return_value=active_user)

    with pytest.raises(HTTPException) as exc_info:
        await service.complete_onboarding("valid-token", "NewPassword123")

    assert exc_info.value.status_code == 400
    assert "already been used" in exc_info.value.detail
