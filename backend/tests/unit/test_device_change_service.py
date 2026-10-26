from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException

from app.core.security import hash_password
from app.schemas.auth import DeviceChangeRequestCreate
from app.services.device_change_service import DeviceChangeService


class DummyUser:
    def __init__(
        self,
        user_id: str = "user-student-1",
        email: str = "student@univ.edu",
        role: str = "STUDENT",
        tenant_id: str = "tenant-1",
    ):
        self.id = user_id
        self.email = email
        self.role = role
        self.tenantId = tenant_id
        self.hashedPassword = hash_password("ValidPassword123!")


class DummyStudent:
    def __init__(
        self,
        student_id: str = "student-1",
        enrollment_number: str = "ENR2026001",
        first_name: str = "Alice",
        last_name: str = "Smith",
        device_uuid: str = "old-device-uuid",
        user: DummyUser | None = None,
    ):
        self.id = student_id
        self.enrollmentNumber = enrollment_number
        self.firstName = first_name
        self.lastName = last_name
        self.deviceUuid = device_uuid
        self.user = user


class DummyAcademicClass:
    def __init__(self, class_id: str = "class-1", teacher_id: str = "teacher-1"):
        self.id = class_id
        self.teacherId = teacher_id


class DummyEnrollment:
    def __init__(
        self,
        enrollment_id: str = "enr-1",
        student_id: str = "student-1",
        academic_class: DummyAcademicClass | None = None,
    ):
        self.id = enrollment_id
        self.studentId = student_id
        self.academicClass = academic_class or DummyAcademicClass()


class DummyDeviceChangeRequestRecord:
    def __init__(
        self,
        request_id: str = "req-1",
        student_id: str = "student-1",
        new_device_uuid: str = "new-uuid-1234",
        reason: str = "Screen cracked",
        status: str = "PENDING",
        student: DummyStudent | None = None,
    ):
        self.id = request_id
        self.studentId = student_id
        self.newDeviceUuid = new_device_uuid
        self.reason = reason
        self.status = status
        self.approvedBy = None
        self.createdAt = datetime.now(timezone.utc)
        self.updatedAt = datetime.now(timezone.utc)
        self.student = student or DummyStudent()


@pytest.mark.unit
async def test_request_device_change_invalid_credentials(mock_db):
    user_repo = MagicMock()
    user_repo.get_by_email = AsyncMock(return_value=None)
    student_repo = MagicMock()
    student_repo.get_by_enrollment = AsyncMock(return_value=None)

    service = DeviceChangeService()
    service.user_repo = user_repo
    service.student_repo = student_repo
    data = DeviceChangeRequestCreate(
        email="invalid@univ.edu",
        password="WrongPassword!",
        new_device_uuid="new-uuid-1234",
        reason="Upgraded phone",
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.request_device_change(data)

    assert exc_info.value.status_code == 401
    assert "Invalid credentials" in exc_info.value.detail


@pytest.mark.unit
async def test_request_device_change_student_not_found(mock_db):
    user = DummyUser()
    user_repo = MagicMock()
    user_repo.get_by_email = AsyncMock(return_value=user)
    student_repo = MagicMock()
    student_repo.get_by_user_id = AsyncMock(return_value=None)

    service = DeviceChangeService()
    service.user_repo = user_repo
    service.student_repo = student_repo
    data = DeviceChangeRequestCreate(
        email=user.email,
        password="ValidPassword123!",
        new_device_uuid="new-uuid-1234",
        reason="Lost device",
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.request_device_change(data)

    assert exc_info.value.status_code == 404
    assert "Student record not found" in exc_info.value.detail


@pytest.mark.unit
async def test_request_device_change_no_teacher_assigned(mock_db):
    user = DummyUser()
    student = DummyStudent(user=user)
    user_repo = MagicMock()
    user_repo.get_by_email = AsyncMock(return_value=user)
    student_repo = MagicMock()
    student_repo.get_by_user_id = AsyncMock(return_value=student)

    mock_db.enrollment.find_first = AsyncMock(return_value=None)

    service = DeviceChangeService()
    service.user_repo = user_repo
    service.student_repo = student_repo
    data = DeviceChangeRequestCreate(
        email=user.email,
        password="ValidPassword123!",
        new_device_uuid="new-uuid-1234",
        reason="Upgraded phone",
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.request_device_change(data)

    assert exc_info.value.status_code == 400
    assert "No teacher assigned yet" in exc_info.value.detail


@pytest.mark.unit
async def test_request_device_change_create_new_success(mock_db):
    user = DummyUser()
    student = DummyStudent(user=user)
    user_repo = MagicMock()
    user_repo.get_by_email = AsyncMock(return_value=user)
    student_repo = MagicMock()
    student_repo.get_by_user_id = AsyncMock(return_value=student)

    enrollment = DummyEnrollment(academic_class=DummyAcademicClass(teacher_id="teacher-1"))
    mock_db.enrollment.find_first = AsyncMock(return_value=enrollment)
    mock_db.devicechangerequest.find_first = AsyncMock(return_value=None)
    mock_db.devicechangerequest.create = AsyncMock()

    service = DeviceChangeService()
    service.user_repo = user_repo
    service.student_repo = student_repo
    data = DeviceChangeRequestCreate(
        email=user.email,
        password="ValidPassword123!",
        new_device_uuid="new-uuid-5678",
        reason="New smartphone",
    )

    with patch("app.services.device_change_service.email_service.send_device_change_requested_email", new_callable=AsyncMock) as mock_email:
        await service.request_device_change(data)

        mock_db.devicechangerequest.create.assert_awaited_once()
        create_args = mock_db.devicechangerequest.create.await_args[1]["data"]
        assert create_args["studentId"] == student.id
        assert create_args["newDeviceUuid"] == "new-uuid-5678"
        assert create_args["status"] == "PENDING"
        mock_email.assert_awaited_once()


@pytest.mark.unit
async def test_request_device_change_update_existing_pending(mock_db):
    user = DummyUser()
    student = DummyStudent(user=user)
    user_repo = MagicMock()
    user_repo.get_by_email = AsyncMock(return_value=user)
    student_repo = MagicMock()
    student_repo.get_by_user_id = AsyncMock(return_value=student)

    enrollment = DummyEnrollment(academic_class=DummyAcademicClass(teacher_id="teacher-1"))
    existing_request = DummyDeviceChangeRequestRecord(request_id="req-99")

    mock_db.enrollment.find_first = AsyncMock(return_value=enrollment)
    mock_db.devicechangerequest.find_first = AsyncMock(return_value=existing_request)
    mock_db.devicechangerequest.update = AsyncMock()

    service = DeviceChangeService()
    service.user_repo = user_repo
    service.student_repo = student_repo
    data = DeviceChangeRequestCreate(
        email=user.email,
        password="ValidPassword123!",
        new_device_uuid="updated-uuid-9999",
        reason="Correction",
    )

    with patch("app.services.device_change_service.email_service.send_device_change_requested_email", new_callable=AsyncMock):
        await service.request_device_change(data)

        mock_db.devicechangerequest.update.assert_awaited_once()
        update_args = mock_db.devicechangerequest.update.await_args[1]["data"]
        assert update_args["newDeviceUuid"] == "updated-uuid-9999"
        assert update_args["reason"] == "Correction"


@pytest.mark.unit
async def test_get_pending_requests(mock_db):
    service = DeviceChangeService()
    mock_db.academicclass.find_many = AsyncMock(return_value=[DummyAcademicClass(class_id="class-1")])

    req_record = DummyDeviceChangeRequestRecord(
        request_id="req-1",
        student=DummyStudent(student_id="student-1", first_name="John", last_name="Doe"),
    )
    mock_db.devicechangerequest.find_many = AsyncMock(return_value=[req_record])

    results = await service.get_pending_requests("teacher-1")
    assert len(results) == 1
    assert results[0].id == "req-1"
    assert results[0].student_name == "John Doe"
    assert results[0].status == "PENDING"


@pytest.mark.unit
async def test_approve_request_success(mock_db):
    service = DeviceChangeService()
    user = DummyUser(user_id="user-1", tenant_id="tenant-1")
    student = DummyStudent(student_id="student-1", user=user)
    req_record = DummyDeviceChangeRequestRecord(
        request_id="req-1",
        student_id="student-1",
        new_device_uuid="new-device-abc",
        status="PENDING",
        student=student,
    )

    teacher_user = DummyUser(user_id="user-t-1", role="TEACHER", tenant_id="tenant-1")
    teacher = MagicMock()
    teacher.id = "teacher-1"
    teacher.user = teacher_user

    mock_db.devicechangerequest.find_unique = AsyncMock(return_value=req_record)
    mock_db.teacher.find_unique = AsyncMock(return_value=teacher)
    mock_db.academicclass.find_first = AsyncMock(return_value=DummyAcademicClass())
    mock_db.student.update = AsyncMock()
    mock_db.devicechangerequest.update = AsyncMock()

    with patch("app.services.device_change_service.email_service.send_device_change_reviewed_email", new_callable=AsyncMock) as mock_email:
        result = await service.approve_request("req-1", "teacher-1", "APPROVED")

        assert result is True
        mock_db.student.update.assert_awaited_once_with(
            where={"id": "student-1"},
            data={"deviceUuid": "new-device-abc"},
        )
        mock_db.devicechangerequest.update.assert_awaited_once_with(
            where={"id": "req-1"},
            data={"status": "APPROVED", "approvedBy": "teacher-1"},
        )
        mock_email.assert_awaited_once()


@pytest.mark.unit
async def test_reject_request_success(mock_db):
    service = DeviceChangeService()
    user = DummyUser(user_id="user-1", tenant_id="tenant-1")
    student = DummyStudent(student_id="student-1", user=user)
    req_record = DummyDeviceChangeRequestRecord(
        request_id="req-1",
        student_id="student-1",
        new_device_uuid="new-device-abc",
        status="PENDING",
        student=student,
    )

    teacher_user = DummyUser(user_id="user-t-1", role="TEACHER", tenant_id="tenant-1")
    teacher = MagicMock()
    teacher.id = "teacher-1"
    teacher.user = teacher_user

    mock_db.devicechangerequest.find_unique = AsyncMock(return_value=req_record)
    mock_db.teacher.find_unique = AsyncMock(return_value=teacher)
    mock_db.academicclass.find_first = AsyncMock(return_value=DummyAcademicClass())
    mock_db.student.update = AsyncMock()
    mock_db.devicechangerequest.update = AsyncMock()

    with patch("app.services.device_change_service.email_service.send_device_change_reviewed_email", new_callable=AsyncMock) as mock_email:
        result = await service.approve_request("req-1", "teacher-1", "REJECTED")

        assert result is True
        mock_db.student.update.assert_not_awaited()
        mock_db.devicechangerequest.update.assert_awaited_once_with(
            where={"id": "req-1"},
            data={"status": "REJECTED", "approvedBy": "teacher-1"},
        )
        mock_email.assert_awaited_once()
