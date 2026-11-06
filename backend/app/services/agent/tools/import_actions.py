"""Import students or teachers the admin pasted from a spreadsheet. The model maps the columns; a dry run shows the problems."""
from typing import Literal, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.db.client import db
from app.schemas.admin.bulk import StudentBulkItem, TeacherBulkItem
from app.services.admin.admin_bulk_service import AdminBulkService
from app.services.admin.bulk_import_common import check_license_capacity, find_by_reference
from app.services.agent.tools.common import ADMIN_ONLY
from app.services.agent.types import Preview, Principal, Tool, ToolResult

MAX_ROWS = 200
SHOWN_PROBLEMS = 15
INVITE_NOTE = "Each imported person gets an invitation e-mail with their sign-in details."


class StudentRow(BaseModel):
    email: EmailStr
    enrollment_number: str = Field(min_length=3, max_length=30)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    department: str = Field(description="Department code or name, as written in the sheet.")
    batch_code: Optional[str] = Field(None, description="For example CE-A-1.")
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[Literal["M", "F", "O"]] = None


class TeacherRow(BaseModel):
    email: EmailStr
    employee_id: str = Field(min_length=3, max_length=30)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    department: Optional[str] = Field(None, description="Department code or name.")
    designation: Optional[str] = Field(None, description="Designation code or name.")
    phone: Optional[str] = Field(None, max_length=20)


class StudentsArgs(BaseModel):
    rows: list[StudentRow] = Field(min_length=1, max_length=MAX_ROWS)


class TeachersArgs(BaseModel):
    rows: list[TeacherRow] = Field(min_length=1, max_length=MAX_ROWS)


async def _problem_student(tenant_id: str, row: StudentRow) -> Optional[str]:
    department = await find_by_reference(db.department, row.department, tenant_id)
    if not department:
        return f"department '{row.department}' not found"
    if row.batch_code:
        batch = await db.batch.find_first(where={"tenantId": tenant_id, "departmentId": department.id, "code": row.batch_code.strip()})
        if not batch or batch.status != "ACTIVE":
            return f"active batch '{row.batch_code}' not found"
    if await db.student.find_first(where={"tenantId": tenant_id, "enrollmentNumber": row.enrollment_number}):
        return "enrollment number already exists"
    return None


async def _problem_teacher(tenant_id: str, row: TeacherRow) -> Optional[str]:
    if row.department and not await find_by_reference(db.department, row.department, tenant_id):
        return f"department '{row.department}' not found"
    if row.designation and not await find_by_reference(db.designation, row.designation, tenant_id):
        return f"designation '{row.designation}' not found"
    if await db.teacher.find_first(where={"tenantId": tenant_id, "employeeId": row.employee_id}):
        return "employee id already exists"
    return None


async def _dry_run(tenant_id: str, rows: list, key: str, check) -> list[list]:
    """One [row number, name, reason] per row that would be skipped."""
    problems, seen = [], set()
    for number, row in enumerate(rows, start=1):
        reason = None
        if row.email in seen or getattr(row, key) in seen:
            reason = "appears twice in this list"
        elif await db.user.find_unique(where={"email": row.email}):
            reason = "email already registered"
        else:
            reason = await check(tenant_id, row)
        seen.update({row.email, getattr(row, key)})
        if reason:
            problems.append([number, f"{row.first_name} {row.last_name}", reason])
    return problems


async def _preview(principal: Principal, rows: list, key: str, check, noun: str) -> Preview:
    problems = await _dry_run(principal.tenant_id, rows, key, check)
    importable = len(rows) - len(problems)
    if importable == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"No row can be imported. First problems: {problems[:3]}")
    try:
        await check_license_capacity(principal.tenant_id, importable)
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    details: dict = {"note": INVITE_NOTE}
    if problems:
        details["table"] = {"title": "Rows that will be skipped", "columns": ["Row", "Name", "Why"], "rows": problems[:SHOWN_PROBLEMS]}
    skipped = f" ({len(problems)} will be skipped)" if problems else ""
    return Preview(f"Import {importable} {noun}{'s' if importable != 1 else ''}{skipped}", details)


def _done(noun: str, result: dict) -> ToolResult:
    message = f"Imported {result['imported_count']} {noun}s."
    if result["failed_count"]:
        message += f" {result['failed_count']} skipped: {'; '.join(result['errors'][:3])}"
    return ToolResult({"message": message, **{k: result[k] for k in ("imported_count", "failed_count")}})


async def preview_students(principal: Principal, args: StudentsArgs) -> Preview:
    return await _preview(principal, args.rows, "enrollment_number", _problem_student, "student")


async def import_students(principal: Principal, args: StudentsArgs) -> ToolResult:
    items = [StudentBulkItem(email=r.email, enrollment_number=r.enrollment_number, first_name=r.first_name, last_name=r.last_name,
                             department_id=r.department, batch_code=r.batch_code, phone=r.phone, gender=r.gender) for r in args.rows]
    return _done("student", await AdminBulkService.bulk_create_students(items, True, principal.user.email, None, principal.tenant_id))


async def preview_teachers(principal: Principal, args: TeachersArgs) -> Preview:
    return await _preview(principal, args.rows, "employee_id", _problem_teacher, "teacher")


async def import_teachers(principal: Principal, args: TeachersArgs) -> ToolResult:
    items = [TeacherBulkItem(email=r.email, employee_id=r.employee_id, first_name=r.first_name, last_name=r.last_name,
                             department_id=r.department, designation_id=r.designation, phone=r.phone) for r in args.rows]
    return _done("teacher", await AdminBulkService.bulk_create_teachers(items, True, principal.user.email, None, principal.tenant_id))


TOOLS = [
    Tool("import_students", "Prepare importing students from rows the admin pasted. Map the sheet's columns yourself, even if the "
         "headers are odd; fix obvious typos in case and spacing, never invent data. The card lists rows that would be skipped. Needs confirmation.",
         StudentsArgs, ADMIN_ONLY, import_students, preview=preview_students),
    Tool("import_teachers", "Prepare importing teachers from rows the admin pasted, mapped the same way. Needs confirmation.",
         TeachersArgs, ADMIN_ONLY, import_teachers, preview=preview_teachers),
]
