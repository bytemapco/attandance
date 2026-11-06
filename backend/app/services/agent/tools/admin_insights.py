"""What an institution admin asks about the whole institution: headline numbers and what is left to set up."""
from pydantic import BaseModel

from app.services.admin.audit_export_service import AuditExportService
from app.services.agent.tools.common import ADMIN_ONLY, link, table
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.setup_status_service import get_setup_status


class NoArgs(BaseModel):
    pass


async def institution_stats(principal: Principal, args: NoArgs) -> ToolResult:
    stats = await AuditExportService.get_stats(tenant_id=principal.tenant_id)
    data = {
        "students": stats["studentCount"], "teachers": stats["teacherCount"], "active_classes": stats["classCount"],
        "attendance_records": stats["attendanceCount"], "overall_attendance_percent": stats["attendanceRate"],
    }
    rows = [[label, data[key]] for label, key in (("Students", "students"), ("Teachers", "teachers"),
            ("Active classes", "active_classes"), ("Attendance records", "attendance_records"),
            ("Overall attendance %", "overall_attendance_percent"))]
    return ToolResult(data, [table("Institution at a glance", ["Measure", "Value"], rows)])


async def setup_checks(principal: Principal, args: NoArgs) -> ToolResult:
    status = await get_setup_status(principal.tenant_id)
    todo = [c for c in status.checks if not c.done]
    ui = [table("Still to set up", ["Item", "Required", "Why"],
                [[c.label, "yes" if c.required else "no", c.blocker_message or ""] for c in todo])] if todo else []
    ui += [link(c.label, c.href) for c in todo[:3]]
    data = {
        "setup_percent": status.score, "completed": status.completed, "ready_to_complete": status.ready_to_complete,
        "licence_seats_left": status.license_remaining,
        "to_do": [{"item": c.label, "required": c.required, "reason": c.blocker_message, "page": c.href} for c in todo],
    }
    return ToolResult(data, ui)


TOOLS = [
    Tool("institution_stats", "Headline numbers: students, teachers, active classes, attendance records, overall attendance %.",
         NoArgs, ADMIN_ONLY, institution_stats),
    Tool("setup_checks", "What is still missing before attendance can run (departments, classes, campus location...), with page links.",
         NoArgs, ADMIN_ONLY, setup_checks),
]
