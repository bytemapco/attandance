"""What an admin checks on the institution itself: its attendance rules, licence seats, and who changed what."""
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.core.datetime_utils import IST
from app.db.client import db
from app.services.agent.tools.admin_insights import NoArgs
from app.services.agent.tools.common import ADMIN_ONLY, capped, full_name, link, table
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.super_admin_service import SuperAdminService
from app.services.system_config_service import SystemConfigService

LIMIT = 50


def _yes(value: bool) -> str:
    return "on" if value else "off"


async def institution_settings(principal: Principal, args: NoArgs) -> ToolResult:
    """Shows the rules and seats. Changing the rules is a separate tool that waits for Confirm."""
    config = await SystemConfigService().get_config(tenant_id=principal.tenant_id)
    seats = await SuperAdminService.get_tenant_license_usage(principal.tenant_id)
    rules = {
        "minimum_attendance_percent": config.minAttendancePct, "attendance_window_minutes": config.verificationWindowMin,
        "saturday_classes": _yes(config.saturdayEnabled), "face_recognition": _yes(config.isFaceRecognitionEnabled),
        "location_check": _yes(config.isGpsVerificationEnabled), "location_radius_meters": config.geofenceRadiusMeters,
        "campus_location_set": config.campusLatitude is not None and config.campusLongitude is not None,
    }
    licence = {"seats": seats["license_count"], "used": seats["total_used"], "left": seats["remaining"],
               "students": seats["student_count"], "teachers": seats["teacher_count"]}
    ui = [table("Attendance rules", ["Rule", "Value"], [[key.replace("_", " ").capitalize(), value] for key, value in rules.items()]),
          table("Licence seats", ["Seats", "Used", "Left"], [[licence["seats"], licence["used"], licence["left"]]]),
          link("Open settings", "/admin/settings")]
    return ToolResult({"rules": rules, "licence": licence, "note": "To change them, ask for a change, or use the Settings page."}, ui)


class AuditArgs(BaseModel):
    kind: Literal["attendance_changes", "admin_actions"] = Field(
        description="attendance_changes: marks changed after the fact, with who and why. admin_actions: setup and people changes by admins.")
    days: int = Field(7, ge=1, le=90, description="How many days back.")
    student_id: Optional[str] = Field(None, description="attendance_changes only: one student, from find_students.")


def _when(moment: datetime) -> str:
    return moment.astimezone(IST).strftime("%d %b %H:%M")


async def _attendance_changes(principal: Principal, args: AuditArgs, since: datetime) -> ToolResult:
    record: dict = {"tenantId": principal.tenant_id}
    if args.student_id:
        record["studentId"] = args.student_id
    changes = await db.attendanceauditlog.find_many(
        where={"timestamp": {"gte": since}, "attendanceRecord": {"is": record}}, order={"timestamp": "desc"}, take=LIMIT,
        include={"changedBy": True, "attendanceRecord": {"include": {"student": True, "occurrence": {"include": {"courseSection": True}}}}})
    rows = [{"when": _when(c.timestamp), "student": full_name(c.attendanceRecord.student),
             "class": c.attendanceRecord.occurrence.courseSection.name, "date": c.attendanceRecord.occurrence.date.date().isoformat(),
             "from": str(c.previousStatus), "to": str(c.newStatus), "by": c.changedBy.email, "reason": c.reason} for c in changes]
    ui = [table("Attendance changes", ["When", "Student", "Class", "Class date", "From", "To", "By", "Reason"],
                [list(r.values()) for r in rows])] if rows else []
    return ToolResult({"changes": capped(rows)}, ui)


async def _admin_actions(principal: Principal, since: datetime) -> ToolResult:
    events = await db.auditlog.find_many(where={"tenantId": principal.tenant_id, "timestamp": {"gte": since}}, order={"timestamp": "desc"}, take=LIMIT)
    rows = [{"when": _when(e.timestamp), "by": e.actor, "event": e.eventType, "what": e.description} for e in events]
    ui = [table("Admin actions", ["When", "By", "Event", "What"], [list(r.values()) for r in rows])] if rows else []
    return ToolResult({"actions": capped(rows)}, ui)


async def audit_trail(principal: Principal, args: AuditArgs) -> ToolResult:
    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    if args.kind == "attendance_changes":
        return await _attendance_changes(principal, args, since)
    return await _admin_actions(principal, since)


TOOLS = [
    Tool("institution_settings", "The institution's attendance rules (minimum %, window, Saturday, location check, campus location) and licence seats.",
         NoArgs, ADMIN_ONLY, institution_settings),
    Tool("audit_trail", "Who changed attendance marks after the fact (with reasons), or what admins changed in setup and people, "
         "over the last days.", AuditArgs, ADMIN_ONLY, audit_trail),
]
