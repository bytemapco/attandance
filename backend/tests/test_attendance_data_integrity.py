from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.schemas.admin import ClassCreate
from app.schemas.student import StudentCreate
from app.services.admin.class_admin_service import ClassAdminService
from app.services.admin.student_admin_service import StudentAdminService
from app.services.student_service import StudentService


def _db_with_subject_and_teacher(**overrides: object) -> MagicMock:
    mock_db = MagicMock()
    mock_db.is_connected.return_value = True
    mock_db.subject.find_first = AsyncMock(return_value=SimpleNamespace(id="sub-1"))
    mock_db.teacher.find_first = AsyncMock(return_value=None)
    for name, value in overrides.items():
        setattr(mock_db, name, value)
    return mock_db


@pytest.mark.anyio
async def test_class_creation_never_borrows_a_teacher_from_another_tenant() -> None:
    mock_db = _db_with_subject_and_teacher()
    with patch("app.services.admin.class_admin_service.db", mock_db):
        with pytest.raises(ValueError, match="No teacher profile available"):
            await ClassAdminService().create_class(ClassCreate(subject_id="sub-1"), tenant_id="tenant-a")

    for call in mock_db.teacher.find_first.call_args_list:
        assert call.kwargs["where"].get("tenantId") == "tenant-a"


@pytest.mark.anyio
async def test_class_creation_rejects_teacher_and_subject_from_other_tenants() -> None:
    mock_db = _db_with_subject_and_teacher()
    with patch("app.services.admin.class_admin_service.db", mock_db):
        with pytest.raises(ValueError, match="Teacher profile not found"):
            await ClassAdminService().create_class(
                ClassCreate(subject_id="sub-1", teacher_id="teacher-of-b"), tenant_id="tenant-a"
            )
        assert mock_db.teacher.find_first.call_args.kwargs["where"] == {"id": "teacher-of-b", "tenantId": "tenant-a"}

        mock_db.teacher.find_first = AsyncMock(return_value=SimpleNamespace(id="teacher-a"))
        mock_db.subject.find_first = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="Subject with id"):
            await ClassAdminService().create_class(
                ClassCreate(subject_id="sub-of-b", teacher_id="teacher-a"), tenant_id="tenant-a"
            )
        assert mock_db.subject.find_first.call_args.kwargs["where"] == {"id": "sub-of-b", "tenantId": "tenant-a"}


@pytest.mark.anyio
async def test_created_student_carries_its_tenant_id() -> None:
    database = MagicMock()
    database.is_connected.return_value = True
    database.department.find_first = AsyncMock(return_value=SimpleNamespace(id="dept-1"))
    database.tenant.find_unique = AsyncMock(return_value=SimpleNamespace(licenseCount=100))
    database.user.count = AsyncMock(return_value=1)
    database.user.create = AsyncMock(return_value=SimpleNamespace(id="user-1", email="sam.lee@yopmail.com"))
    database.user.delete = AsyncMock()
    database.student.create = AsyncMock(side_effect=RuntimeError("stop after capture"))
    database.batch.find_first = AsyncMock(
        return_value=SimpleNamespace(id="batch-1", code="CE-A-1", departmentId="dept-1", status="ACTIVE")
    )

    payload = StudentCreate(
        email="sam.lee@yopmail.com", enrollment_number="EN-001", first_name="Sam", last_name="Lee",
        department_id="dept-1", semester=3, batch_id="batch-1", phone="9999999999",
        gender="F", date_of_birth=datetime(2005, 1, 1), send_invite=False,
    )
    with pytest.raises(RuntimeError):
        await StudentAdminService.create_student(payload, tenant_id="tenant-a", db_client=database)

    student_data = database.student.create.call_args.kwargs["data"]
    assert student_data["tenantId"] == "tenant-a"
    assert (student_data["batchId"], student_data["batch"]) == ("batch-1", "CE-A-1")


@pytest.mark.anyio
async def test_history_totals_conducted_classes_across_subjects_and_scopes_tenant() -> None:
    subjects = [SimpleNamespace(conducted=4, attended=3), SimpleNamespace(conducted=4, attended=1)]
    section = SimpleNamespace(id="sec-1", name="CSE-A-1", subject=SimpleNamespace(name="Maths"))
    record = SimpleNamespace(
        id="rec-1", occurrenceId="occ-1", status="FLAGGED", verifiedAt=datetime(2026, 11, 1),
        faceScore=0.4, livenessScore=0.9, remarks=None, occurrence=SimpleNamespace(courseSection=section),
    )
    mock_db = MagicMock()
    mock_db.attendancerecord.find_many = AsyncMock(return_value=[record])
    student = SimpleNamespace(id="stud-1", tenantId="tenant-a")

    service = StudentService()
    with patch("app.services.student_service.db", mock_db), \
         patch("app.services.student_service.student_subjects_service.list_subjects", AsyncMock(return_value=subjects)), \
         patch.object(service, "get_student_by_user_id", AsyncMock(return_value=student)):
        result = await service.get_student_attendance_history("user-1")

    assert result.overall_attendance_percentage == 50.0
    assert (result.history[0].status, result.history[0].session_id) == ("Flagged", "occ-1")
    assert mock_db.attendancerecord.find_many.call_args.kwargs["where"] == {"studentId": "stud-1", "tenantId": "tenant-a"}


def _admin_headers() -> dict[str, str]:
    token = create_access_token(subject="admin-1", role="ADMIN", extra_data={"tenant_id": "test-tenant-id"})
    return {"X-Tenant-ID": "test-tenant-id", "Authorization": f"Bearer {token}"}


@pytest.mark.anyio
@pytest.mark.parametrize("resource", ["students", "teachers", "classes"])
@pytest.mark.parametrize("query", ["page=0", "page=-1", "page_size=0", "page_size=-5"])
async def test_admin_lists_reject_non_positive_paging(async_client: AsyncClient, resource: str, query: str) -> None:
    admin = SimpleNamespace(id="admin-1", role="ADMIN", tenantId="test-tenant-id", isActive=True)
    path = "/admin/classes" if resource == "classes" else f"/admin/users/{resource}"
    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=admin):
        response = await async_client.get(f"{path}?{query}", headers=_admin_headers())
    assert response.status_code == 422
