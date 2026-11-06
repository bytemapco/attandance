"""Pending leave and device-change requests. Teachers decide them for their own students; admins see the backlog."""
from datetime import datetime, timezone

from pydantic import BaseModel

from app.db.client import db
from app.repositories.leave_repository import LeaveRepository
from app.services.agent.tools.common import ADMIN_ONLY, TEACHER_ONLY, capped, link, table
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.device_change_review_service import DeviceChangeReviewService

OLDEST_SHOWN = 10


class NoArgs(BaseModel):
    pass


def _name(student) -> str:
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or student.enrollmentNumber


def _days_waiting(created) -> int:
    return (datetime.now(timezone.utc) - created).days


async def pending_approvals(principal: Principal, args: NoArgs) -> ToolResult:
    leaves = await LeaveRepository().get_pending_for_teacher(principal.tenant_id, principal.teacher.id)
    devices = await DeviceChangeReviewService.get_pending_requests(principal.teacher)
    leave_rows = [{"leave_id": x.id, "student": _name(x.student), "from": x.startDate.date().isoformat(),
                   "to": x.endDate.date().isoformat(), "reason": x.reason, "waiting_days": _days_waiting(x.createdAt)} for x in leaves]
    device_rows = [{"request_id": d.id, "student": d.student_name, "reason": d.reason} for d in devices]
    ui = []
    if leave_rows:
        ui.append(table("Leave requests", ["Student", "From", "To", "Reason", "Waiting (days)"],
                        [[r["student"], r["from"], r["to"], r["reason"], r["waiting_days"]] for r in leave_rows]))
    if device_rows:
        ui.append(table("Device-change requests", ["Student", "Reason"], [[r["student"], r["reason"] or ""] for r in device_rows]))
    if ui:
        ui += [link("Leave requests", "/teacher/leaves"), link("Device changes", "/teacher/device-changes")]
    return ToolResult({"leaves": capped(leave_rows), "device_changes": capped(device_rows)}, ui)


async def approvals_backlog(principal: Principal, args: NoArgs) -> ToolResult:
    """Teachers decide these. An admin sees what is waiting and for how long."""
    scope = {"tenantId": principal.tenant_id, "status": "PENDING"}
    leaves = await db.leaverequest.find_many(where=scope, include={"student": True}, order={"createdAt": "asc"}, take=OLDEST_SHOWN)
    leave_total = await db.leaverequest.count(where=scope)
    device_total = await db.devicechangerequest.count(where=scope)
    oldest = [{"student": _name(x.student), "from": x.startDate.date().isoformat(), "waiting_days": _days_waiting(x.createdAt)} for x in leaves]
    ui = [table("Oldest waiting leave requests", ["Student", "From", "Waiting (days)"],
                [[r["student"], r["from"], r["waiting_days"]] for r in oldest])] if oldest else []
    return ToolResult({"pending_leaves": leave_total, "pending_device_changes": device_total, "oldest_leaves": oldest}, ui)


TOOLS = [
    Tool("pending_approvals", "This teacher's pending leave and device-change requests from their students.",
         NoArgs, TEACHER_ONLY, pending_approvals),
    Tool("approvals_backlog", "How many leave and device-change requests are waiting in the institution, and the oldest ones.",
         NoArgs, ADMIN_ONLY, approvals_backlog),
]
