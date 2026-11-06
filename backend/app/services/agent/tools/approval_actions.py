"""Decide leave and device-change requests from the teacher's own students."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.db.client import db
from app.repositories.student_repository import taught_by
from app.services.agent.tools.common import TEACHER_ONLY
from app.services.agent.tools.occurrence_access import bad_request
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.device_change_review_service import DeviceChangeReviewService
from app.services.leave_service import LeaveService

MAX_REQUESTS = 20
Decision = Literal["APPROVED", "REJECTED"]


def _name(student) -> str:
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or student.enrollmentNumber


def _plural(count: int, word: str) -> str:
    return f"{count} {word}" + ("" if count == 1 else "s")


class LeaveArgs(BaseModel):
    leave_ids: list[str] = Field(min_length=1, max_length=MAX_REQUESTS, description="leave_id values from pending_approvals.")
    decision: Decision
    note: Optional[str] = Field(None, max_length=300, description="Optional note the student will see.")


async def preview_leaves(principal: Principal, args: LeaveArgs) -> Preview:
    wanted = set(args.leave_ids)
    leaves = await db.leaverequest.find_many(
        where={"id": {"in": list(wanted)}, "tenantId": principal.tenant_id, "status": "PENDING",
               "student": {"is": taught_by(principal.teacher.id)}},
        include={"student": True},
    )
    if len(leaves) != len(wanted):
        raise bad_request("Some of these leave requests are not pending, or are not from your students.")
    rows = [[_name(x.student), x.startDate.date().isoformat(), x.endDate.date().isoformat(), x.reason] for x in leaves]
    verb = "Approve" if args.decision == "APPROVED" else "Reject"
    details = {"table": {"title": "Leave requests", "columns": ["Student", "From", "To", "Reason"], "rows": rows}}
    if args.decision == "APPROVED":
        details["note"] = "Approving marks the student excused for closed classes in those dates."
    return Preview(f"{verb} {_plural(len(leaves), 'leave request')}", details)


async def decide_leaves(principal: Principal, args: LeaveArgs) -> ToolResult:
    service, decided = LeaveService(), 0
    for leave_id in args.leave_ids:
        if await service.approve_leave(leave_id, principal.teacher, args.decision, args.note):
            decided += 1
    skipped = len(args.leave_ids) - decided
    note = f" {_plural(skipped, 'request')} could not be decided." if skipped else ""
    return ToolResult({"message": f"{_plural(decided, 'leave request')} {args.decision.lower()}.{note}", "decided": decided})


class DeviceArgs(BaseModel):
    request_ids: list[str] = Field(min_length=1, max_length=MAX_REQUESTS, description="request_id values from pending_approvals.")
    decision: Decision


async def preview_devices(principal: Principal, args: DeviceArgs) -> Preview:
    wanted = set(args.request_ids)
    pending = [r for r in await DeviceChangeReviewService.get_pending_requests(principal.teacher) if r.id in wanted]
    if len(pending) != len(wanted):
        raise bad_request("Some of these device requests are not pending, or are not from your students.")
    rows = [[r.student_name, r.enrollment_number, r.reason or ""] for r in pending]
    verb = "Approve" if args.decision == "APPROVED" else "Reject"
    details = {"table": {"title": "Device requests", "columns": ["Student", "Roll", "Reason"], "rows": rows}}
    if args.decision == "APPROVED":
        details["note"] = "Approve only if you know this is the student's own new phone. Their account moves to it."
    return Preview(f"{verb} {_plural(len(pending), 'device request')}", details)


async def decide_device_changes(principal: Principal, args: DeviceArgs) -> ToolResult:
    decided = 0
    for request_id in args.request_ids:
        if await DeviceChangeReviewService.approve_request(request_id, principal.teacher, args.decision):
            decided += 1
    return ToolResult({"message": f"{_plural(decided, 'device request')} {args.decision.lower()}.", "decided": decided})


TOOLS = [
    Tool("decide_leaves", "Prepare approving or rejecting pending leave requests from the teacher's students (leave_ids from "
         "pending_approvals). Nothing is decided until the teacher confirms.",
         LeaveArgs, TEACHER_ONLY, decide_leaves, preview=preview_leaves, editable=frozenset({"note"})),
    Tool("decide_device_changes", "Prepare approving or rejecting pending new-phone requests from the teacher's students. "
         "Remind the teacher to approve only phones they know are the student's. Nothing is decided until they confirm.",
         DeviceArgs, TEACHER_ONLY, decide_device_changes, preview=preview_devices),
]
