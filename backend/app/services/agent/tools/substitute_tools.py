"""Cover for an absent teacher: find who is free, then assign them after the admin confirms."""
from datetime import date

from pydantic import BaseModel, Field

from app.services import substitute_service as cover
from app.services.agent.tools.common import ADMIN_ONLY, capped, table
from app.services.agent.types import Preview, Principal, Tool, ToolResult


class FindArgs(BaseModel):
    teacher_id: str = Field(description="The absent teacher, from find_teachers.")
    day: date = Field(description="The day, YYYY-MM-DD.")


async def find_substitutes(principal: Principal, args: FindArgs) -> ToolResult:
    classes = [o for o in await cover.teacher_classes_on(principal.tenant_id, args.teacher_id, args.day)
               if o.facultyId == args.teacher_id and not o.isAttendanceLocked]
    rows, found = [], []
    for occurrence in classes:
        options = await cover.free_teachers(principal.tenant_id, occurrence)
        found.append({
            "occurrence_id": occurrence.id, "time": f"{occurrence.startTime}-{occurrence.endTime}",
            "class": occurrence.courseSection.name, "subject": occurrence.courseSection.subject.name,
            "covered_by": occurrence.substituteFacultyId,
            "free_teachers": [{"teacher_id": t.id, "name": cover.teacher_name(t), "department": t.department.name} for t in options],
        })
        rows.append([found[-1]["time"], found[-1]["class"], found[-1]["subject"],
                     ", ".join(cover.teacher_name(t) for t in options) or "no one free"])
    ui = [table("Classes needing cover", ["Time", "Class", "Subject", "Free teachers"], rows)] if rows else []
    return ToolResult({"classes": capped(found)}, ui)


class AssignArgs(BaseModel):
    occurrence_id: str = Field(description="The class to cover, from find_substitutes.")
    teacher_id: str = Field(description="The covering teacher, from find_substitutes.")


async def preview_assign(principal: Principal, args: AssignArgs) -> Preview:
    occurrence, teacher = await cover.require_coverable(principal.tenant_id, args.occurrence_id, args.teacher_id)
    section = occurrence.courseSection
    return Preview(
        f"{cover.teacher_name(teacher)} covers {section.name} {section.subject.name} {occurrence.startTime}-{occurrence.endTime}",
        {"day": occurrence.date.date().isoformat(), "note": "The covering teacher is told. The original teacher keeps the class."},
    )


async def assign_substitute(principal: Principal, args: AssignArgs) -> ToolResult:
    _, teacher = await cover.assign_substitute(principal.tenant_id, args.occurrence_id, args.teacher_id, principal.user.email)
    return ToolResult({"message": f"{cover.teacher_name(teacher)} now covers this class and has been told."})


TOOLS = [
    Tool("find_substitutes", "For an absent teacher on a day: each of their open classes and the teachers free at that time "
         "(same department first).", FindArgs, ADMIN_ONLY, find_substitutes),
    Tool("assign_substitute", "Prepare assigning a free teacher to cover one class. Nothing changes until the admin confirms.",
         AssignArgs, ADMIN_ONLY, assign_substitute, preview=preview_assign),
]
