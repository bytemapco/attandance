from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.core.security import hash_password


class DummyUser:
    def __init__(
        self,
        user_id="user-1",
        email="student@univ.edu",
        role="STUDENT",
        is_active=True,
        tenant_id="tenant-1",
    ):
        self.id = user_id
        self.email = email
        self.role = role
        self.isActive = is_active
        self.tenantId = tenant_id
        self.hashedPassword = hash_password("ValidPassword123!")
        self.mustChangePassword = False


class DummyStudent:
    def __init__(self, student_id="student-1", device_uuid=None):
        self.id = student_id
        self.deviceUuid = device_uuid


class DummyTenant:
    def __init__(self, name="Test University", status="ACTIVE", slug="test-univ"):
        self.id = "tenant-1"
        self.name = name
        self.status = status
        self.slug = slug


@pytest.mark.integration
async def test_login_validation_error_shape(async_client):
    # Missing password and invalid email
    response = await async_client.post("/api/v1/auth/login", json={"email": "not-an-email"})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]
    assert len(data["error"]["details"]) > 0


@pytest.mark.integration
async def test_login_inactive_user_blocked(async_client, mock_db):
    inactive_user = DummyUser(is_active=False)
    mock_db.user.find_unique = AsyncMock(return_value=inactive_user)

    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "student@univ.edu", "password": "ValidPassword123!"},
    )
    assert response.status_code == 403
    assert "inactive" in response.json().get("detail", "").lower()


@pytest.mark.integration
async def test_login_student_device_mismatch_blocked(async_client, mock_db):
    user = DummyUser(role="STUDENT")
    student = DummyStudent(device_uuid="registered-hardware-uuid")

    mock_db.user.find_unique = AsyncMock(return_value=user)
    mock_db.student.find_unique = AsyncMock(return_value=student)

    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "student@univ.edu",
            "password": "ValidPassword123!",
            "device_uuid": "attacker-different-uuid",
        },
    )
    assert response.status_code == 403
    assert "bound to another device" in response.json().get("detail", "")


@pytest.mark.integration
async def test_login_suspended_tenant_blocked(async_client, mock_db):
    user = DummyUser(tenant_id="tenant-1")
    suspended_tenant = DummyTenant(status="SUSPENDED")

    mock_db.user.find_unique = AsyncMock(return_value=user)
    mock_db.student.find_unique = AsyncMock(return_value=DummyStudent())
    mock_db.tenant.find_unique = AsyncMock(return_value=suspended_tenant)

    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "student@univ.edu", "password": "ValidPassword123!"},
    )
    assert response.status_code == 403
    assert "suspended" in response.json().get("detail", "").lower()


@pytest.mark.integration
async def test_request_device_change_validation_error(async_client):
    response = await async_client.post(
        "/api/v1/auth/request-device-change",
        json={"identifier": "test"},
    )
    assert response.status_code == 422


@pytest.mark.integration
async def test_request_device_change_success(async_client, mock_db):
    user = DummyUser()
    student = DummyStudent(device_uuid="old-device-uuid")
    academic_class = MagicMock()
    academic_class.id = "class-1"
    academic_class.teacherId = "teacher-1"

    enrollment = MagicMock()
    enrollment.id = "enr-1"
    enrollment.academicClass = academic_class

    mock_db.user.find_unique = AsyncMock(return_value=user)
    mock_db.student.find_first = AsyncMock(return_value=student)
    mock_db.enrollment.find_first = AsyncMock(return_value=enrollment)
    mock_db.devicechangerequest.find_first = AsyncMock(return_value=None)
    mock_db.devicechangerequest.create = AsyncMock()

    with patch(
        "app.services.device_change_service.email_service.send_device_change_requested_email",
        new_callable=AsyncMock,
    ):
        response = await async_client.post(
            "/api/v1/auth/request-device-change",
            json={
                "email": "student@univ.edu",
                "password": "ValidPassword123!",
                "new_device_uuid": "new-phone-uuid-1234",
                "reason": "Screen cracked",
            },
        )
    assert response.status_code == 200
    assert "submitted" in response.json()["message"].lower()


@pytest.mark.integration
async def test_request_device_change_no_teacher_returns_400(async_client, mock_db):
    user = DummyUser()
    student = DummyStudent(device_uuid="old-device-uuid")

    mock_db.user.find_unique = AsyncMock(return_value=user)
    mock_db.student.find_first = AsyncMock(return_value=student)
    mock_db.enrollment.find_first = AsyncMock(return_value=None)

    response = await async_client.post(
        "/api/v1/auth/request-device-change",
        json={
            "email": "student@univ.edu",
            "password": "ValidPassword123!",
            "new_device_uuid": "new-phone-uuid-1234",
            "reason": "New phone",
        },
    )
    assert response.status_code == 400
    assert "no teacher assigned yet" in response.json()["detail"].lower()

