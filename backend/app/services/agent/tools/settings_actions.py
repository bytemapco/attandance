"""Change the institution's attendance rules (minimum %, window, Saturday, location). Only through a Confirm card, and each change is audited.

Face recognition and AI checks are not here: biometric settings stay out of the assistant."""
from typing import Any, Optional

from fastapi import HTTPException, status
from prisma import Json
from pydantic import BaseModel, Field

from app.db.client import db
from app.services.agent.tools.common import ADMIN_ONLY
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.system_config_service import SystemConfigService

# Assistant argument -> (SystemConfigService argument, shown label, value shown on the card)
FIELDS = {
    "min_attendance_pct": ("min_attendance_pct", "Minimum attendance %"),
    "verification_window_min": ("verification_window_min", "Attendance window (minutes)"),
    "saturday_enabled": ("saturday_enabled", "Saturday classes"),
    "is_gps_verification_enabled": ("is_gps_verification_enabled", "Location check"),
    "geofence_radius_meters": ("geofence_radius_meters", "Location radius (metres)"),
    "campus_latitude": ("campus_latitude", "Campus latitude"),
    "campus_longitude": ("campus_longitude", "Campus longitude"),
}
CURRENT = {
    "min_attendance_pct": "minAttendancePct", "verification_window_min": "verificationWindowMin", "saturday_enabled": "saturdayEnabled",
    "is_gps_verification_enabled": "isGpsVerificationEnabled", "geofence_radius_meters": "geofenceRadiusMeters",
    "campus_latitude": "campusLatitude", "campus_longitude": "campusLongitude",
}


class SettingsArgs(BaseModel):
    min_attendance_pct: Optional[float] = Field(None, ge=0, le=100, description="The minimum attendance percentage.")
    verification_window_min: Optional[int] = Field(None, ge=5, le=360, description="Minutes attendance stays open for a class.")
    saturday_enabled: Optional[bool] = Field(None, description="Whether Saturday classes are on.")
    is_gps_verification_enabled: Optional[bool] = Field(None, description="Whether the location check is on.")
    geofence_radius_meters: Optional[int] = Field(None, gt=0, le=5000, description="How close students must be to campus, in metres.")
    campus_latitude: Optional[float] = Field(None, ge=-90, le=90, description="Campus latitude.")
    campus_longitude: Optional[float] = Field(None, ge=-180, le=180, description="Campus longitude.")


def _given(args: SettingsArgs) -> dict[str, Any]:
    given = {key: getattr(args, key) for key in FIELDS if getattr(args, key) is not None}
    if not given:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Say which setting to change.")
    return given


def _shown(value: Any) -> str:
    if isinstance(value, bool):
        return "on" if value else "off"
    return "-" if value is None else str(value)


async def preview_settings(principal: Principal, args: SettingsArgs) -> Preview:
    current = (await SystemConfigService().get_config(tenant_id=principal.tenant_id)).model_dump(by_alias=True)
    rows = [[FIELDS[key][1], _shown(current[CURRENT[key]]), _shown(value)]
            for key, value in _given(args).items() if current[CURRENT[key]] != value]
    if not rows:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Nothing would change: the settings already have those values.")
    return Preview(f"Change {len(rows)} attendance setting{'s' if len(rows) != 1 else ''}",
                   {"table": {"title": "Settings", "columns": ["Setting", "Now", "Becomes"], "rows": rows},
                    "note": "Applies to every class from now on. The change is recorded in the audit log."})


async def update_settings(principal: Principal, args: SettingsArgs) -> ToolResult:
    given = _given(args)
    await SystemConfigService().update_config(tenant_id=principal.tenant_id, **{FIELDS[k][0]: v for k, v in given.items()})
    await db.auditlog.create(data={
        "tenantId": principal.tenant_id, "actorId": principal.user.id, "actor": principal.user.email, "eventType": "UPDATE_SYSTEM_CONFIG",
        "severity": "WARNING", "target": "SYSTEM_CONFIG", "description": "Changed attendance settings through the assistant",
        "metadata": Json(given),
    })
    return ToolResult({"message": f"Updated {len(given)} setting{'s' if len(given) != 1 else ''}.", "changed": sorted(given)})


TOOLS = [
    Tool("update_institution_settings", "Prepare changing the attendance rules: minimum %, attendance window, Saturday classes, "
         "location check, location radius or campus coordinates. Needs confirmation.",
         SettingsArgs, ADMIN_ONLY, update_settings, preview=preview_settings),
]
