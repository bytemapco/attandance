"""Correct a student's or a teacher's details. Passwords, e-mail logins and face data are not reachable from here."""
from typing import Any, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.services import batch_service
from app.services.admin_service import AdminService
from app.services.agent.tools.common import ADMIN_ONLY, full_name
from app.services.agent.types import Preview, Principal, Tool, ToolResult

SHARED = ("first_name", "last_name", "phone", "department_id")
STUDENT_FIELDS = SHARED + ("enrollment_number", "batch_id")
TEACHER_FIELDS = SHARED + ("employee_id", "designation_id")


def _bad(detail: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(code, detail)


def _column(field: str) -> str:
    first, *rest = field.split("_")
    return first + "".join(part.title() for part in rest)


def _given(args: BaseModel, fields: tuple[str, ...]) -> dict[str, Any]:
    given = {field: getattr(args, field) for field in fields if getattr(args, field, None) is not None}
    if not given:
        raise _bad("Say what to change.")
    return given


async def _label(principal: Principal, field: str, value: Optional[str]) -> str:
    """Departments, batches and designations are shown by name, not by id."""
    delegates = {"department_id": (db.department, "name"), "batch_id": (db.batch, "code"), "designation_id": (db.designation, "name")}
    if field not in delegates or not value:
        return value or "-"
    delegate, attribute = delegates[field]
    found = await delegate.find_first(where={"id": value, "tenantId": principal.tenant_id})
    return getattr(found, attribute) if found else "-"


async def _table(principal: Principal, record, given: dict[str, Any]) -> list[list[str]]:
    rows = []
    for field, value in given.items():
        now = getattr(record, _column(field), None)
        if now != value:
            rows.append([field.replace("_id", "").replace("_", " ").title(), await _label(principal, field, now), await _label(principal, field, value)])
    if not rows:
        raise _bad("Nothing would change: they already have those details.")
    return rows


def _changes_table(rows: list[list[str]]) -> dict[str, Any]:
    return {"title": "Changes", "columns": ["Detail", "Now", "Becomes"], "rows": rows}


async def _unique(principal: Principal, delegate, column: str, value: Optional[str], own_id: str, label: str) -> None:
    if value and await delegate.find_first(where={"tenantId": principal.tenant_id, column: {"equals": value, "mode": "insensitive"}, "id": {"not": own_id}}):
        raise _bad(f"Another person already has the {label} {value}.", status.HTTP_409_CONFLICT)


async def _department(principal: Principal, department_id: Optional[str]) -> None:
    if department_id and not await db.department.find_first(where={"id": department_id, "tenantId": principal.tenant_id}):
        raise _bad("Department not found.", status.HTTP_404_NOT_FOUND)


class StudentArgs(BaseModel):
    student_id: str = Field(description="From find_students.")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    enrollment_number: Optional[str] = Field(None, min_length=3, max_length=30, description="The roll number.")
    department_id: Optional[str] = Field(None, description="From find_setup_items. Give the new batch_id too.")
    batch_id: Optional[str] = Field(None, description="From find_setup_items with kind batch. The student joins that batch's class.")


async def preview_student(principal: Principal, args: StudentArgs) -> Preview:
    student = await db.student.find_first(where={"id": args.student_id, "tenantId": principal.tenant_id})
    if not student:
        raise _bad("Student not found.", status.HTTP_404_NOT_FOUND)
    given = _given(args, STUDENT_FIELDS)
    await _department(principal, args.department_id)
    await _unique(principal, db.student, "enrollmentNumber", args.enrollment_number, student.id, "roll number")
    if args.department_id and args.department_id != student.departmentId and not args.batch_id:
        raise _bad("A student who changes department needs a batch in the new department.")
    try:
        if args.batch_id:
            await batch_service.resolve_assignable_batch(principal.tenant_id, args.batch_id, args.department_id or student.departmentId)
    except ValueError as exc:
        raise _bad(str(exc)) from exc
    details: dict[str, Any] = {"table": _changes_table(await _table(principal, student, given))}
    if args.batch_id:
        details["note"] = "The student leaves their current class and joins the new batch's class."
    return Preview(f"Update {full_name(student)}", details)


async def update_student(principal: Principal, args: StudentArgs) -> ToolResult:
    try:
        done = await AdminService().update_student(args.student_id, _given(args, STUDENT_FIELDS), actor=principal.user.email, tenant_id=principal.tenant_id)
    except ValueError as exc:
        raise _bad(str(exc)) from exc
    return ToolResult({"message": f"Updated {done.first_name} {done.last_name}."})


class TeacherArgs(BaseModel):
    teacher_id: str = Field(description="From find_teachers.")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    employee_id: Optional[str] = Field(None, min_length=3, max_length=30)
    department_id: Optional[str] = Field(None, description="From find_setup_items.")
    designation_id: Optional[str] = Field(None, description="From find_setup_items.")


async def preview_teacher(principal: Principal, args: TeacherArgs) -> Preview:
    teacher = await db.teacher.find_first(where={"id": args.teacher_id, "tenantId": principal.tenant_id})
    if not teacher:
        raise _bad("Teacher not found.", status.HTTP_404_NOT_FOUND)
    given = _given(args, TEACHER_FIELDS)
    await _department(principal, args.department_id)
    await _unique(principal, db.teacher, "employeeId", args.employee_id, teacher.id, "employee id")
    if args.designation_id and not await db.designation.find_first(where={"id": args.designation_id, "tenantId": principal.tenant_id}):
        raise _bad("Designation not found.", status.HTTP_404_NOT_FOUND)
    return Preview(f"Update {full_name(teacher)}", {"table": _changes_table(await _table(principal, teacher, given))})


async def update_teacher(principal: Principal, args: TeacherArgs) -> ToolResult:
    try:
        done = await AdminService().update_teacher(args.teacher_id, _given(args, TEACHER_FIELDS), actor=principal.user.email, tenant_id=principal.tenant_id)
    except ValueError as exc:
        raise _bad(str(exc)) from exc
    return ToolResult({"message": f"Updated {done.first_name} {done.last_name}."})


TOOLS = [
    Tool("update_student", "Prepare correcting a student's name, phone, roll number, department or batch. Changing the batch moves the "
         "student to that batch's class. Needs confirmation.", StudentArgs, ADMIN_ONLY, update_student, preview=preview_student),
    Tool("update_teacher", "Prepare correcting a teacher's name, phone, employee id, department or designation. Needs confirmation.",
         TeacherArgs, ADMIN_ONLY, update_teacher, preview=preview_teacher),
]
