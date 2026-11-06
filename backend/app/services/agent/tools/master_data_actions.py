"""Create departments, subjects and classrooms in bulk. Existing names and codes are refused before anything is saved."""
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.schemas.admin.bulk import ClassroomBulkItem, DepartmentBulkItem, SubjectBulkItem
from app.services.admin.admin_bulk_service import AdminBulkService
from app.services.agent.tools.common import ADMIN_ONLY
from app.services.agent.types import Preview, Principal, Tool, ToolResult

MAX_ITEMS = 50


def _taken(kind: str, names: list[str]) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, f"These {kind} already exist: {', '.join(names)}.")


def _distinct(values: list[str], label: str) -> None:
    lowered = [v.strip().lower() for v in values]
    if len(set(lowered)) != len(lowered):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"The same {label} appears twice in this list.")


def _outcome(kind: str, result: dict) -> ToolResult:
    message = f"Created {result['imported_count']} {kind}."
    if result["failed_count"]:
        message += f" {result['failed_count']} failed: {'; '.join(result['errors'][:3])}"
    return ToolResult({"message": message, **result})


class DepartmentItem(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    code: str = Field(min_length=2, max_length=20, description="Short code, for example CE.")


class DepartmentsArgs(BaseModel):
    items: list[DepartmentItem] = Field(min_length=1, max_length=MAX_ITEMS)


async def preview_departments(principal: Principal, args: DepartmentsArgs) -> Preview:
    _distinct([i.code for i in args.items], "code")
    clash = await db.department.find_many(
        where={"tenantId": principal.tenant_id, "code": {"in": [i.code for i in args.items], "mode": "insensitive"}}
    )
    if clash:
        raise _taken("departments (code)", [d.code for d in clash])
    rows = [[i.name, i.code] for i in args.items]
    return Preview(f"Create {len(rows)} department{'s' if len(rows) != 1 else ''}", {"table": {"title": "Departments", "columns": ["Name", "Code"], "rows": rows}})


async def create_departments(principal: Principal, args: DepartmentsArgs) -> ToolResult:
    items = [DepartmentBulkItem(name=i.name, code=i.code) for i in args.items]
    return _outcome("departments", await AdminBulkService.bulk_create_departments(items, principal.user.email, None, principal.tenant_id))


class SubjectItem(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    code: str = Field(min_length=2, max_length=20, description="Unique subject code, for example CS101.")
    department_id: Optional[str] = Field(None, description="From find_setup_items.")


class SubjectsArgs(BaseModel):
    items: list[SubjectItem] = Field(min_length=1, max_length=MAX_ITEMS)


async def preview_subjects(principal: Principal, args: SubjectsArgs) -> Preview:
    _distinct([i.code for i in args.items], "code")
    clash = await db.subject.find_many(where={"tenantId": principal.tenant_id, "code": {"in": [i.code for i in args.items], "mode": "insensitive"}})
    if clash:
        raise _taken("subjects (code)", [s.code for s in clash])
    wanted = {i.department_id for i in args.items if i.department_id}
    known = {d.id for d in await db.department.find_many(where={"tenantId": principal.tenant_id, "id": {"in": list(wanted)}})}
    if wanted - known:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "A department in this list was not found.")
    rows = [[i.name, i.code] for i in args.items]
    return Preview(f"Create {len(rows)} subject{'s' if len(rows) != 1 else ''}", {"table": {"title": "Subjects", "columns": ["Name", "Code"], "rows": rows}})


async def create_subjects(principal: Principal, args: SubjectsArgs) -> ToolResult:
    items = [SubjectBulkItem(name=i.name, code=i.code, department_id=i.department_id) for i in args.items]
    return _outcome("subjects", await AdminBulkService.bulk_create_subjects(items, principal.user.email, None, principal.tenant_id))


class ClassroomItem(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    building: Optional[str] = Field(None, max_length=100)


class ClassroomsArgs(BaseModel):
    items: list[ClassroomItem] = Field(min_length=1, max_length=MAX_ITEMS)


async def preview_classrooms(principal: Principal, args: ClassroomsArgs) -> Preview:
    _distinct([i.name for i in args.items], "room name")
    clash = await db.classroom.find_many(where={"tenantId": principal.tenant_id, "name": {"in": [i.name for i in args.items], "mode": "insensitive"}})
    if clash:
        raise _taken("classrooms", [c.name for c in clash])
    rows = [[i.name, i.building or "-"] for i in args.items]
    return Preview(f"Create {len(rows)} classroom{'s' if len(rows) != 1 else ''}", {"table": {"title": "Classrooms", "columns": ["Name", "Building"], "rows": rows}})


async def create_classrooms(principal: Principal, args: ClassroomsArgs) -> ToolResult:
    items = [ClassroomBulkItem(name=i.name, building=i.building) for i in args.items]
    return _outcome("classrooms", await AdminBulkService.bulk_create_classrooms(items, principal.user.email, None, principal.tenant_id))


TOOLS = [
    Tool("create_departments", "Prepare new departments (name and short code). Nothing is saved until the admin confirms.",
         DepartmentsArgs, ADMIN_ONLY, create_departments, preview=preview_departments),
    Tool("create_subjects", "Prepare new subjects (name, unique code, optional department_id). Nothing is saved until the admin confirms.",
         SubjectsArgs, ADMIN_ONLY, create_subjects, preview=preview_subjects),
    Tool("create_classrooms", "Prepare new classrooms (room name, optional building). Nothing is saved until the admin confirms.",
         ClassroomsArgs, ADMIN_ONLY, create_classrooms, preview=preview_classrooms),
]
