from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.schemas.student import StudentCreate
from app.services.admin import (
    account_setup,
    bulk_import_common,
    bulk_import_service,
    student_admin_service,
    teacher_admin_service,
)
from app.services.admin.bulk_import_service import BulkImportService
from app.services.admin.student_admin_service import StudentAdminService
from app.services.admin.teacher_admin_service import TeacherAdminService

TENANT = "tenant-1"


def delegate(**methods):
    return SimpleNamespace(**{name: AsyncMock(return_value=value) for name, value in methods.items()})


def student_row(**over):
    row = dict(
        id="stu-1", userId="user-1", enrollmentNumber="VIT24CS001", firstName="Aarav", lastName="Sharma", phone="+91 98",
        gender="M", dateOfBirth=None, departmentId="dept-1", semester=3, batch="CSE-A-1", batchId="batch-1",
        user=SimpleNamespace(email="aarav@yopmail.com", isActive=True), department=SimpleNamespace(name="CSE"),
    )
    return SimpleNamespace(**{**row, **over})


@pytest.fixture
def fake_db(monkeypatch):
    fake = SimpleNamespace(
        department=delegate(find_first=SimpleNamespace(id="dept-1", name="CSE"), create=SimpleNamespace(id="dept-new")),
        designation=delegate(find_first=SimpleNamespace(id="desig-1"), create=SimpleNamespace(id="desig-new")),
        tenant=delegate(find_unique=SimpleNamespace(licenseCount=10)),
        user=delegate(create=SimpleNamespace(id="user-1", email="aarav@yopmail.com"), count=3, delete=None, find_unique=None),
        student=delegate(create=student_row(), find_first=student_row(), update=student_row(), count=1, find_many=[student_row()]),
        teacher=delegate(find_first=None),
        batch=delegate(find_first=SimpleNamespace(id="batch-1", code="CSE-A-1", departmentId="dept-1", status="ACTIVE")),
    )
    for module in (account_setup, student_admin_service, teacher_admin_service, bulk_import_service, bulk_import_common):
        monkeypatch.setattr(module, "db", fake)
    monkeypatch.setattr("app.services.batch_service.db", fake)
    return fake


def new_student(**over) -> StudentCreate:
    body = dict(
        email="aarav@yopmail.com", enrollment_number="VIT24CS001", first_name="Aarav", last_name="Sharma",
        department_id="dept-1", semester=3, batch_id="batch-1", phone="+91 9812345678", gender="M",
        date_of_birth=datetime(2006, 5, 1), send_invite=False,
    )
    return StudentCreate(**{**body, **over})


async def test_a_student_is_created_inside_the_institution_with_a_temporary_password(fake_db):
    response = await StudentAdminService.create_student(new_student(), TENANT)
    user = fake_db.user.create.await_args.kwargs["data"]
    assert (user["role"], user["tenantId"], user["mustChangePassword"]) == ("STUDENT", TENANT, True)
    assert fake_db.department.find_first.await_args.kwargs["where"] == {"id": "dept-1", "tenantId": TENANT}
    assert (response.enrollment_number, response.invitation_sent) == ("VIT24CS001", None)


async def test_the_invitation_result_is_reported_when_one_was_asked_for(fake_db, monkeypatch):
    monkeypatch.setattr(student_admin_service, "send_invitation", AsyncMock(return_value=True))
    response = await StudentAdminService.create_student(new_student(send_invite=True), TENANT)
    assert response.invitation_sent is True


async def test_a_student_cannot_join_a_department_of_another_institution(fake_db):
    fake_db.department.find_first.return_value = None
    with pytest.raises(ValueError, match="Department not found."):
        await StudentAdminService.create_student(new_student(), TENANT)
    fake_db.user.create.assert_not_awaited()


async def test_creation_stops_when_every_licence_seat_is_taken(fake_db):
    fake_db.user.count.return_value = 10
    with pytest.raises(ValueError, match=r"License seat quota exceeded \(10/10\)"):
        await StudentAdminService.create_student(new_student(), TENANT)


async def test_the_login_is_removed_again_when_the_profile_is_refused(fake_db):
    fake_db.student.create.side_effect = RuntimeError("duplicate enrollment")
    with pytest.raises(RuntimeError):
        await StudentAdminService.create_student(new_student(), TENANT)
    fake_db.user.delete.assert_awaited_once_with(where={"id": "user-1"})


async def test_a_student_of_another_institution_cannot_be_updated(fake_db):
    fake_db.student.find_first.return_value = None
    with pytest.raises(ValueError, match="Student not found."):
        await StudentAdminService.update_student("stu-9", {"phone": "1"}, TENANT)
    fake_db.student.update.assert_not_awaited()


async def test_moving_a_student_to_another_department_requires_a_batch_there(fake_db):
    with pytest.raises(ValueError, match="Select a batch for this student's department."):
        await StudentAdminService.update_student("stu-1", {"department_id": "dept-2"}, TENANT)


async def test_a_batch_of_another_institution_cannot_be_chosen(fake_db):
    fake_db.batch.find_first.return_value = None
    with pytest.raises(ValueError, match="Batch not found."):
        await StudentAdminService.update_student("stu-1", {"batch_id": "batch-9"}, TENANT)


async def test_the_student_list_is_limited_to_the_institution_and_filtered(fake_db):
    page = await StudentAdminService.get_all_students(
        TENANT, page=2, page_size=5, q="Patil", semester=3, department_id="all", status="active"
    )
    where = fake_db.student.find_many.await_args.kwargs["where"]
    assert where["user"] == {"is": {"tenantId": TENANT, "isActive": True}}
    assert where["semester"] == 3 and "departmentId" not in where
    assert {"user": {"is": {"email": {"contains": "Patil", "mode": "insensitive"}}}} in where["OR"]
    assert fake_db.student.find_many.await_args.kwargs["skip"] == 5
    assert (page.page, page.total_items, page.has_prev) == (2, 1, True)


async def test_a_teacher_needs_a_department_and_designation_of_the_institution(fake_db):
    fake_db.designation.find_first.return_value = None
    data = SimpleNamespace(
        email="t@yopmail.com", employee_id="VIT-T-1", first_name="A", last_name="B", name_initials=None,
        department_id="dept-1", designation_id="desig-9", phone=None, send_invite=False,
    )
    with pytest.raises(ValueError, match="Designation with id 'desig-9' not found."):
        await TeacherAdminService.create_teacher(data, TENANT)


def student_item(email="aarav@yopmail.com", enrollment="VIT24CS001", **over):
    item = dict(
        email=email, enrollment_number=enrollment, first_name="Aarav", last_name="Sharma", department_id="CSE",
        gender="M", semester=3, batch_code="CSE-A-1", phone=None, password=None,
    )
    return SimpleNamespace(**{**item, **over})


async def test_bulk_import_reports_each_rejected_row_and_keeps_the_rest(fake_db):
    fake_db.student.find_first.return_value = None
    fake_db.user.find_unique.side_effect = [SimpleNamespace(id="x"), None]
    result = await BulkImportService.bulk_create_students(
        [student_item("taken@yopmail.com"), student_item("new@yopmail.com", "VIT24CS002")], TENANT, send_invite=False
    )
    assert (result["imported_count"], result["failed_count"]) == (1, 1)
    assert result["errors"] == ["Row 1: Email 'taken@yopmail.com' already registered."]


async def test_bulk_import_refuses_an_enrollment_number_already_used_in_the_institution(fake_db):
    fake_db.student.find_first.return_value = student_row()
    result = await BulkImportService.bulk_create_students([student_item()], TENANT, send_invite=False)
    assert result["errors"] == ["Row 1: Enrollment 'VIT24CS001' already exists."]
    assert fake_db.student.find_first.await_args.kwargs["where"] == {"tenantId": TENANT, "enrollmentNumber": "VIT24CS001"}


async def test_bulk_import_stops_when_it_would_exceed_the_licence(fake_db):
    fake_db.user.count.return_value = 9
    with pytest.raises(ValueError, match="Available seats: 1, requested: 2"):
        await BulkImportService.bulk_create_students([student_item(), student_item("b@yopmail.com")], TENANT)


async def test_a_failed_profile_rolls_the_login_back_and_is_reported_with_the_email(fake_db):
    fake_db.student.find_first.return_value = None
    fake_db.student.create.side_effect = RuntimeError("boom")
    result = await BulkImportService.bulk_create_students([student_item()], TENANT, send_invite=False)
    assert result["errors"] == ["Row 1 (aarav@yopmail.com): boom"]
    fake_db.user.delete.assert_awaited_once()


async def test_teacher_rows_without_a_department_share_one_default_created_once(fake_db):
    fake_db.department.find_first.return_value = None
    fake_db.department.create.return_value = SimpleNamespace(id="dept-new")
    fake_db.teacher.create = AsyncMock()

    def teacher(email, employee):
        return SimpleNamespace(
            email=email, employee_id=employee, first_name="A", last_name="B", name_initials=None, phone=None,
            department_id=None, designation_id=None, password="Pass1234",
        )

    result = await BulkImportService.bulk_create_teachers([teacher("a@y.com", "E1"), teacher("b@y.com", "E2")], TENANT, send_invite=False)
    assert result["imported_count"] == 2
    fake_db.department.create.assert_awaited_once_with(data={"name": "General Academics", "code": "GEN", "tenantId": TENANT})


@pytest.mark.parametrize("route, method", [("students", "update_student"), ("teachers", "update_teacher")])
def test_the_update_routes_hand_the_callers_institution_to_the_service(route, method, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.api.admin import students, teachers
    from app.api.dependencies import get_current_user, get_tenant_context
    from app.services.admin_service import AdminService

    update = AsyncMock(side_effect=ValueError("Student not found."))
    monkeypatch.setattr(AdminService, method, update)
    app = FastAPI()
    app.include_router({"students": students, "teachers": teachers}[route].router)
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(email="admin@yopmail.com")
    app.dependency_overrides[get_tenant_context] = lambda: TENANT
    response = TestClient(app).put(f"/users/{route}/some-id", json={"phone": "+91 9812345678"})
    assert response.status_code == 404
    assert update.await_args.kwargs["tenant_id"] == TENANT
