"""Edit or remove departments, subjects, classrooms, designations and batches. Removal is refused while a record is in use."""
from typing import Any, Literal, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.services import batch_service
from app.services.admin_service import AdminService
from app.services.agent.tools.common import ADMIN_ONLY
from app.services.agent.types import Preview, Principal, Tool, ToolResult

Kind = Literal["department", "subject", "classroom", "designation"]
FIELDS = {
    "department": ("name", "code", "head", "description"),
    "subject": ("name", "code", "description", "department_id"),
    "classroom": ("name", "building"),
    "designation": ("name", "code", "description"),
}
DELEGATES = {"department": db.department, "subject": db.subject, "classroom": db.classroom, "designation": db.designation}
UNIQUE = {"department": "code", "subject": "code", "classroom": "name", "designation": "code"}
ALL_FIELDS = ("name", "code", "description", "head", "building", "department_id")
BATCH_NOTES = {
    "archive": "Students keep their batch; an archived batch takes no new students.",
    "activate": "New students can join it again.",
    "delete": "This cannot be undone.",
}


def _bad(detail: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(code, detail)


def _column(field: str) -> str:
    first, *rest = field.split("_")
    return first + "".join(part.title() for part in rest)


async def _record(principal: Principal, kind: str, item_id: str):
    found = await DELEGATES[kind].find_first(where={"id": item_id, "tenantId": principal.tenant_id})
    if not found:
        raise _bad(f"{kind.title()} not found.", status.HTTP_404_NOT_FOUND)
    return found


class EditArgs(BaseModel):
    kind: Kind
    item_id: str = Field(description="From find_setup_items.")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=255)
    head: Optional[str] = Field(None, max_length=100, description="A department's head, by name.")
    building: Optional[str] = Field(None, max_length=100, description="A classroom's building.")
    department_id: Optional[str] = Field(None, description="A subject's department, from find_setup_items.")


def _changes(args: EditArgs) -> dict[str, Any]:
    given = {field: getattr(args, field) for field in ALL_FIELDS if getattr(args, field) is not None}
    foreign = sorted(set(given) - set(FIELDS[args.kind]))
    if foreign:
        raise _bad(f"A {args.kind} has no {', '.join(foreign)}.")
    if not given:
        raise _bad("Say what to change.")
    return given


async def _check_free(principal: Principal, args: EditArgs, given: dict[str, Any]) -> None:
    key = UNIQUE[args.kind]
    if key in given:
        clash = await DELEGATES[args.kind].find_first(where={
            "tenantId": principal.tenant_id, key: {"equals": given[key], "mode": "insensitive"}, "id": {"not": args.item_id}})
        if clash:
            raise _bad(f"Another {args.kind} already uses the {key} {given[key]}.", status.HTTP_409_CONFLICT)
    if given.get("department_id") and not await db.department.find_first(where={"id": given["department_id"], "tenantId": principal.tenant_id}):
        raise _bad("Department not found.", status.HTTP_404_NOT_FOUND)


async def preview_edit(principal: Principal, args: EditArgs) -> Preview:
    record = await _record(principal, args.kind, args.item_id)
    given = _changes(args)
    await _check_free(principal, args, given)
    rows = [[field.replace("_", " ").title(), getattr(record, _column(field), None) or "-", value]
            for field, value in given.items() if getattr(record, _column(field), None) != value]
    if not rows:
        raise _bad("Nothing would change: it already has those values.")
    return Preview(f"Update {args.kind} {record.name}", {"table": {"title": "Changes", "columns": ["Field", "Now", "Becomes"], "rows": rows}})


async def edit_item(principal: Principal, args: EditArgs) -> ToolResult:
    service = AdminService()
    update = {"department": service.update_department, "subject": service.update_subject,
              "classroom": service.update_classroom, "designation": service.update_designation}[args.kind]
    try:
        updated = await update(args.item_id, _changes(args), tenant_id=principal.tenant_id)
    except ValueError as exc:
        raise _bad(str(exc)) from exc
    return ToolResult({"message": f"Updated {args.kind} {updated.name}."})


class DeleteArgs(BaseModel):
    kind: Kind
    item_id: str = Field(description="From find_setup_items.")


async def _uses(kind: str, item_id: str) -> int:
    """How many records still point at this one, counted the way the delete itself counts."""
    if kind == "department":
        return await db.teacher.count(where={"departmentId": item_id}) + await db.student.count(where={"departmentId": item_id})
    if kind == "subject":
        return await db.coursesection.count(where={"subjectId": item_id})
    if kind == "classroom":
        return await db.coursesection.count(where={"defaultRoomId": item_id}) + await db.timetablerule.count(where={"classroomId": item_id})
    return await db.teacher.count(where={"designationId": item_id})


async def preview_delete(principal: Principal, args: DeleteArgs) -> Preview:
    record = await _record(principal, args.kind, args.item_id)
    if await _uses(args.kind, args.item_id):
        raise _bad(f"Cannot delete {args.kind} {record.name} because it is currently assigned.", status.HTTP_409_CONFLICT)
    return Preview(f"Delete {args.kind} {record.name}", {"note": "This cannot be undone."})


async def delete_item(principal: Principal, args: DeleteArgs) -> ToolResult:
    service = AdminService()
    remove = {"department": service.delete_department, "subject": service.delete_subject,
              "classroom": service.delete_classroom, "designation": service.delete_designation}[args.kind]
    try:
        await remove(args.item_id, actor=principal.user.email, tenant_id=principal.tenant_id)
    except ValueError as exc:
        raise _bad(str(exc), status.HTTP_409_CONFLICT) from exc
    return ToolResult({"message": f"Deleted the {args.kind}."})


class BatchArgs(BaseModel):
    batch_id: str = Field(description="From find_setup_items with kind batch.")
    action: Literal["archive", "activate", "delete"]


async def _batch(principal: Principal, batch_id: str):
    found = next((b for b in await batch_service.list_all_batches(principal.tenant_id) if b.id == batch_id), None)
    if not found:
        raise _bad("Batch not found.", status.HTTP_404_NOT_FOUND)
    return found


async def preview_batch(principal: Principal, args: BatchArgs) -> Preview:
    batch = await _batch(principal, args.batch_id)
    if args.action == "delete" and (batch.student_count or batch.class_count):
        raise _bad("Batch has students or classes. Archive it instead of deleting.", status.HTTP_409_CONFLICT)
    already = {"archive": "ARCHIVED", "activate": "ACTIVE"}.get(args.action)
    if batch.status == already:
        raise _bad(f"Batch {batch.code} is already {batch.status.lower()}.")
    return Preview(f"{args.action.title()} batch {batch.code}", {"note": BATCH_NOTES[args.action]})


async def change_batch(principal: Principal, args: BatchArgs) -> ToolResult:
    batch = await _batch(principal, args.batch_id)
    if args.action == "delete":
        await batch_service.delete_batch(principal.tenant_id, args.batch_id)
    else:
        await batch_service.set_batch_status(principal.tenant_id, args.batch_id, "ARCHIVED" if args.action == "archive" else "ACTIVE")
    return ToolResult({"message": f"Batch {batch.code}: {args.action} done."})


TOOLS = [
    Tool("update_master_item", "Prepare changing a department, subject, classroom or designation (name, code, description, head, building, "
         "or a subject's department). Needs confirmation.", EditArgs, ADMIN_ONLY, edit_item, preview=preview_edit),
    Tool("delete_master_item", "Prepare deleting an unused department, subject, classroom or designation. Refused while it is in use. "
         "Needs confirmation.", DeleteArgs, ADMIN_ONLY, delete_item, preview=preview_delete),
    Tool("change_batch", "Prepare archiving, re-activating or deleting a batch. A batch with students or classes can only be archived. "
         "Needs confirmation.", BatchArgs, ADMIN_ONLY, change_batch, preview=preview_batch),
]
