"""Turn names the person says into the ids other tools need. The model never asks the person for an id."""
from typing import Optional

from pydantic import BaseModel, Field

from app.db.client import db
from app.repositories.student_repository import taught_by
from app.services.agent.tools.common import ADMIN_ONLY, BOTH, capped, teacher_id_of
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.reports.loader import load_filters

FOUND_LIMIT = 15


class FindClassesArgs(BaseModel):
    text: Optional[str] = Field(None, description="Part of a class code, subject name or department. Omit for all.")


async def find_classes(principal: Principal, args: FindClassesArgs) -> ToolResult:
    filters = await load_filters(principal.tenant_id, teacher_id_of(principal))
    needle = (args.text or "").strip().lower()
    classes = [c for c in filters.classes if needle in f"{c.code} {c.department_name}".lower()]
    subjects = [s for s in filters.subjects if needle in f"{s.class_code} {s.subject_name} {s.subject_code}".lower()]
    classes_out = [{"class_id": c.id, "class": c.code, "department": c.department_name, "semester": c.semester} for c in classes]
    subjects_out = [{"section_id": s.section_id, "class_id": s.class_id, "class": s.class_code, "subject": s.subject_name} for s in subjects]
    return ToolResult({"classes": capped(classes_out), "subjects": capped(subjects_out), "minimum_percent": filters.threshold})


class FindPeopleArgs(BaseModel):
    text: str = Field(min_length=2, description="Part of a name, roll number or employee id.")


def _name(person) -> str:
    return f"{person.firstName or ''} {person.lastName or ''}".strip()


async def find_students(principal: Principal, args: FindPeopleArgs) -> ToolResult:
    where: dict = {
        "tenantId": principal.tenant_id,
        "OR": [{"firstName": {"contains": args.text, "mode": "insensitive"}},
               {"lastName": {"contains": args.text, "mode": "insensitive"}},
               {"enrollmentNumber": {"contains": args.text, "mode": "insensitive"}}],
    }
    if principal.teacher:
        where.update(taught_by(principal.teacher.id))
    students = await db.student.find_many(where=where, take=FOUND_LIMIT, order={"enrollmentNumber": "asc"})
    rows = [{"student_id": s.id, "name": _name(s), "roll": s.enrollmentNumber} for s in students]
    return ToolResult({"students": rows})


async def find_teachers(principal: Principal, args: FindPeopleArgs) -> ToolResult:
    teachers = await db.teacher.find_many(
        where={"tenantId": principal.tenant_id,
               "OR": [{"firstName": {"contains": args.text, "mode": "insensitive"}},
                      {"lastName": {"contains": args.text, "mode": "insensitive"}},
                      {"employeeId": {"contains": args.text, "mode": "insensitive"}}]},
        take=FOUND_LIMIT, order={"employeeId": "asc"},
    )
    rows = [{"teacher_id": t.id, "name": _name(t), "employee_id": t.employeeId} for t in teachers]
    return ToolResult({"teachers": rows})


TOOLS = [
    Tool("find_classes", "Find classes and subjects by name. Gives the class_id and section_id other tools need.",
         FindClassesArgs, BOTH, find_classes),
    Tool("find_students", "Find students by name or roll number. Teachers only find their own students.",
         FindPeopleArgs, BOTH, find_students),
    Tool("find_teachers", "Find teachers by name or employee id.", FindPeopleArgs, ADMIN_ONLY, find_teachers),
]
