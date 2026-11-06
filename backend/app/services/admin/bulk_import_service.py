"""Importing many students or teachers at once. Rows that fail are reported; the rest are still imported."""
from typing import Any

from app.db.client import db
from app.services.admin.account_setup import create_user_with_profile, initial_credentials, user_record
from app.services.admin.bulk_import_common import (
    Invite,
    RowRejected,
    check_license_capacity,
    find_by_reference,
    reject_if_taken,
    run_import,
)
from app.services.class_management.batch_placement import place_in_batch_class

DEFAULT_DEPARTMENT = {"name": "General Academics", "code": "GEN"}
DEFAULT_DESIGNATION = {"name": "Lecturer", "code": "LEC"}


async def _import_student(item, tenant_id: str, row: int) -> Invite:
    await reject_if_taken(
        item.email, tenant_id, db.student, {"enrollmentNumber": item.enrollment_number},
        f"Enrollment '{item.enrollment_number}' already exists.",
    )
    department = await find_by_reference(db.department, item.department_id, tenant_id)
    if not department:
        raise RowRejected(f"Department '{item.department_id}' not found.")

    batch_id = batch_code = None
    if item.batch_code:
        batch = await db.batch.find_first(
            where={"tenantId": tenant_id, "departmentId": department.id, "code": item.batch_code.strip()}
        )
        if not batch or batch.status != "ACTIVE":
            raise RowRejected(f"Active batch '{item.batch_code}' not found in this department.")
        batch_id, batch_code = batch.id, batch.code

    password, must_change = initial_credentials(item.password)
    profile = {
        "tenantId": tenant_id,
        "enrollmentNumber": item.enrollment_number,
        "firstName": item.first_name,
        "lastName": item.last_name,
        "gender": item.gender,
        "phone": item.phone,
        "batchId": batch_id,
        "batch": batch_code,
        "departmentId": department.id,
    }
    user, student = await create_user_with_profile(
        user_record(item.email, "STUDENT", tenant_id, password, must_change),
        lambda user_id: db.student.create(data={"userId": user_id, **{k: v for k, v in profile.items() if v is not None}}),
    )
    await place_in_batch_class(tenant_id, student.id, batch_id)
    name = f"{item.first_name} {item.last_name}".strip() or "Student"
    return Invite(row, user.id, user.email, name, "STUDENT", "Enrollment Number", item.enrollment_number,
                  password if must_change else None)


class _TeacherDefaults:
    """The department and designation a teacher row falls back to, created once if the institution has none."""

    def __init__(self, tenant_id: str) -> None:
        self.tenant_id = tenant_id
        self._ids: dict[str, str] = {}

    async def _get(self, key: str, delegate: Any, fallback: dict) -> str:
        if key not in self._ids:
            record = await delegate.find_first(where={"tenantId": self.tenant_id})
            record = record or await delegate.create(data={**fallback, "tenantId": self.tenant_id})
            self._ids[key] = record.id
        return self._ids[key]

    async def department(self) -> str:
        return await self._get("department", db.department, DEFAULT_DEPARTMENT)

    async def designation(self) -> str:
        return await self._get("designation", db.designation, DEFAULT_DESIGNATION)


async def _import_teacher(item, tenant_id: str, row: int, defaults: _TeacherDefaults) -> Invite:
    await reject_if_taken(
        item.email, tenant_id, db.teacher, {"employeeId": item.employee_id},
        f"Employee ID '{item.employee_id}' already exists.",
    )
    if item.department_id:
        department = await find_by_reference(db.department, item.department_id, tenant_id)
        if not department:
            raise RowRejected(f"Department '{item.department_id}' not found.")
        department_id = department.id
    else:
        department_id = await defaults.department()
    if item.designation_id:
        designation = await find_by_reference(db.designation, item.designation_id, tenant_id)
        if not designation:
            raise RowRejected(f"Designation '{item.designation_id}' not found.")
        designation_id = designation.id
    else:
        designation_id = await defaults.designation()

    password, must_change = initial_credentials(item.password)
    profile = {
        "tenantId": tenant_id,
        "employeeId": item.employee_id,
        "firstName": item.first_name,
        "lastName": item.last_name,
        "nameInitials": item.name_initials,
        "phone": item.phone,
        "departmentId": department_id,
        "designationId": designation_id,
    }
    user, _ = await create_user_with_profile(
        user_record(item.email, "TEACHER", tenant_id, password, must_change),
        lambda user_id: db.teacher.create(data={"userId": user_id, **{k: v for k, v in profile.items() if v is not None}}),
    )
    name = f"{item.first_name} {item.last_name}".strip() or "Faculty"
    return Invite(row, user.id, user.email, name, "TEACHER", "Employee ID", item.employee_id,
                  password if must_change else None)


class BulkImportService:
    @staticmethod
    async def bulk_create_students(students: list, tenant_id: str, send_invite: bool = True) -> dict:
        await check_license_capacity(tenant_id, len(students))
        return await run_import(students, lambda item, row: _import_student(item, tenant_id, row), send_invite)

    @staticmethod
    async def bulk_create_teachers(teachers: list, tenant_id: str, send_invite: bool = True) -> dict:
        await check_license_capacity(tenant_id, len(teachers))
        defaults = _TeacherDefaults(tenant_id)
        return await run_import(teachers, lambda item, row: _import_teacher(item, tenant_id, row, defaults), send_invite)
