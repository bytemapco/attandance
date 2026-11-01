from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token


def _auth_headers(sub: str, role: str) -> dict[str, str]:
    token = create_access_token(subject=sub, role=role, extra_data={"tenant_id": "test-tenant-id"})
    return {"X-Tenant-ID": "test-tenant-id", "Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_auth_me_student_profile(async_client: AsyncClient) -> None:
    mock_user = AsyncMock(
        id="usr-stud-1",
        email="student@univ.edu",
        role="STUDENT",
        isActive=True,
        tenantId="test-tenant-id",
        mustChangePassword=False,
    )
    mock_student = AsyncMock(
        id="stud-1",
        userId="usr-stud-1",
        enrollmentNumber="EN-1001",
        firstName="Alice",
        lastName="Smith",
        phone="1234567890",
        gender="Female",
        branch="CS",
        semester=4,
        batch="CS-A-1",
        batchId="batch-1",
        departmentId="dept-1",
        department=SimpleNamespace(name="Computer Science"),
    )

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_user), \
         patch("app.api.auth.db") as mock_db, \
         patch("app.repositories.student_repository.StudentRepository.get_face_embedding", return_value=[0.1, 0.2]):
        mock_db.student.find_unique = AsyncMock(return_value=mock_student)
        mock_db.tenant.find_unique = AsyncMock(return_value=SimpleNamespace(id="test-tenant-id", slug="univ", name="University", status="ACTIVE"))

        res = await async_client.get("/auth/me", headers=_auth_headers("usr-stud-1", "STUDENT"))
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "student@univ.edu"
        assert data["role"] == "STUDENT"
        assert data["student_profile"]["enrollment_number"] == "EN-1001"
        assert data["student_profile"]["face_registered"] is True


@pytest.mark.anyio
async def test_auth_me_teacher_profile(async_client: AsyncClient) -> None:
    mock_user = AsyncMock(
        id="usr-teach-1",
        email="teacher@univ.edu",
        role="TEACHER",
        isActive=True,
        tenantId="test-tenant-id",
        mustChangePassword=False,
    )
    mock_teacher = AsyncMock(
        id="teach-1",
        userId="usr-teach-1",
        employeeId="EMP-501",
        firstName="Dr. Robert",
        lastName="Miller",
        departmentId="dept-1",
        designationId="desig-1",
        department=SimpleNamespace(name="Computer Science"),
        designation=SimpleNamespace(name="Professor"),
    )

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_user), \
         patch("app.api.auth.db") as mock_db:
        mock_db.teacher.find_unique = AsyncMock(return_value=mock_teacher)
        mock_db.tenant.find_unique = AsyncMock(return_value=SimpleNamespace(id="test-tenant-id", slug="univ", name="University", status="ACTIVE"))

        res = await async_client.get("/auth/me", headers=_auth_headers("usr-teach-1", "TEACHER"))
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "teacher@univ.edu"
        assert data["role"] == "TEACHER"
        assert data["teacher_profile"]["employee_id"] == "EMP-501"


@pytest.mark.anyio
async def test_auth_change_password(async_client: AsyncClient) -> None:
    mock_user = AsyncMock(id="usr-stud-1", email="student@univ.edu", role="STUDENT", isActive=True, tenantId="test-tenant-id")

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_user), \
         patch("app.services.auth_service.AuthService.change_password", return_value=None):

        res = await async_client.post(
            "/auth/change-password",
            json={"current_password": "OldPassword123!", "new_password": "NewSecurePassword456!"},
            headers=_auth_headers("usr-stud-1", "STUDENT"),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "success"


@pytest.mark.anyio
async def test_auth_forgot_and_reset_password(async_client: AsyncClient) -> None:
    with patch("app.services.auth_service.AuthService.request_password_reset", return_value=None), \
         patch("app.services.auth_service.AuthService.reset_password", return_value=None):

        res_forgot = await async_client.post("/auth/forgot-password", json={"email": "student@univ.edu"})
        assert res_forgot.status_code == 200
        assert "reset link sent" in res_forgot.json()["message"]

        res_reset = await async_client.post(
            "/auth/reset-password",
            json={"token": "mock-reset-token-xyz", "new_password": "FreshNewPassword789!"},
        )
        assert res_reset.status_code == 200
        assert res_reset.json()["status"] == "success"
