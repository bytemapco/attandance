"""Finding the ids that setup tools need: departments, subjects, classrooms, batches, designations."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.db.client import db
from app.services import batch_service
from app.services.agent.tools.common import ADMIN_ONLY, capped, table
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.class_management import class_service

KINDS = {
    "department": (db.department, ("name", "code")),
    "subject": (db.subject, ("name", "code")),
    "classroom": (db.classroom, ("name", "building")),
    "designation": (db.designation, ("name", "code")),
}
LIMIT = 40
DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class FindArgs(BaseModel):
    kind: Literal["department", "subject", "classroom", "batch", "designation"]
    text: Optional[str] = Field(None, description="Part of a name or code. Omit to list.")
    department_id: Optional[str] = Field(None, description="For batches: only this department's.")


def _matches(row: dict, needle: str) -> bool:
    return not needle or needle in " ".join(str(v) for v in row.values() if v).lower()


async def _batches(principal: Principal, department_id: Optional[str]) -> list[dict]:
    found = await batch_service.list_all_batches(principal.tenant_id, department_id)
    return [{"batch_id": b.id, "code": b.code, "department_id": b.department_id, "status": b.status, "students": b.student_count} for b in found]


async def _plain(principal: Principal, kind: str) -> list[dict]:
    delegate, fields = KINDS[kind]
    rows = await delegate.find_many(where={"tenantId": principal.tenant_id}, order={"name": "asc"}, take=500)
    return [{f"{kind}_id": r.id, **{field: getattr(r, field, None) for field in fields}} for r in rows]


async def find_setup_items(principal: Principal, args: FindArgs) -> ToolResult:
    rows = await (_batches(principal, args.department_id) if args.kind == "batch" else _plain(principal, args.kind))
    needle = (args.text or "").strip().lower()
    matching = [r for r in rows if _matches(r, needle)][:LIMIT]
    columns = [key for key in (matching[0] if matching else {}) if not key.endswith("_id")]
    ui = [table(f"{args.kind.title()}s", [c.title() for c in columns], [[r[c] for c in columns] for r in matching])] if matching else []
    return ToolResult({"kind": args.kind, "items": capped(matching)}, ui)


class ClassesArgs(BaseModel):
    text: Optional[str] = Field(None, description="Part of a class code. Omit to list all.")


async def all_classes(principal: Principal, args: ClassesArgs) -> ToolResult:
    """Every active class, including new ones with no subjects yet (find_classes only knows classes with subjects)."""
    found = await class_service.list_classes(principal.tenant_id, None, None, args.text)
    rows = [{"class_id": c.id, "code": c.code, "department_id": c.department_id, "semester": c.semester_number,
             "students": c.member_count, "subjects": c.subject_count} for c in found]
    ui = [table("Classes", ["Code", "Semester", "Students", "Subjects"], [[r["code"], r["semester"], r["students"], r["subjects"]] for r in rows])] if rows else []
    return ToolResult({"classes": capped(rows)}, ui)


class OverviewArgs(BaseModel):
    class_id: str


async def class_overview(principal: Principal, args: OverviewArgs) -> ToolResult:
    detail = await class_service.get_class(principal.tenant_id, args.class_id)
    sections = [{"section_id": s.id, "subject": s.subject_name, "teacher": s.teacher_name, "students": s.enrolled_count,
                 "slots": [f"{DAYS[x.day_of_week]} {x.start_time}-{x.end_time}" for x in s.schedule]} for s in detail.sections]
    rows = [[s["subject"], s["teacher"] or "-", ", ".join(s["slots"]) or "-"] for s in sections]
    ui = [table(f"{detail.code}, semester {detail.semester_number}", ["Subject", "Teacher", "Timetable"], rows)] if rows else []
    return ToolResult({"class": detail.code, "semester": detail.semester_number, "students": detail.member_count,
                       "subjects": capped(sections)}, ui)


TOOLS = [
    Tool("list_all_classes", "Every class, including new ones with no subjects yet, with ids.", ClassesArgs, ADMIN_ONLY, all_classes),
    Tool("class_overview", "One class: its subjects with section ids, teachers and weekly timetable.", OverviewArgs, ADMIN_ONLY, class_overview),
    Tool("find_setup_items", "Find departments, subjects, classrooms, batches or designations by name or code, "
         "and get their ids for the setup tools.", FindArgs, ADMIN_ONLY, find_setup_items),
]
