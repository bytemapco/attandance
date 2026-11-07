"""The morning briefing for institution admins. Plain counts, no model call, so no student data leaves the server."""
from datetime import datetime, timedelta
from typing import Any

from app.core.datetime_utils import get_ist_today
from app.core.logging_config import get_logger
from app.db.client import db
from app.db.redis import safe_redis
from app.services.agent.access import notice_of
from app.services.attendance_percentage import ATTENDED_STATUSES
from app.services.notification_service import create_in_app_notification
from app.services.setup_status_service import get_setup_status

logger = get_logger("app.agent.briefing")
ADMIN_ROLES = ["ADMIN", "TENANT_ADMIN"]
SENT_TTL_SECONDS = 36 * 3600


def _plural(count: int, word: str) -> str:
    return f"{count} {word}" + ("" if count == 1 else "s")


async def _yesterday(tenant_id: str) -> str:
    day = get_ist_today() - timedelta(days=1)
    where = {"tenantId": tenant_id, "occurrence": {"is": {"date": datetime(day.year, day.month, day.day), "isAttendanceLocked": True}}}
    total = await db.attendancerecord.count(where=where)
    if not total:
        return "No closed classes yesterday."
    attended = await db.attendancerecord.count(where={**where, "status": {"in": sorted(ATTENDED_STATUSES)}})
    return f"Yesterday's attendance: {round(100 * attended / total)}% ({attended} of {total} marks)."


async def build_briefing(tenant_id: str) -> dict[str, Any]:
    leaves = await db.leaverequest.count(where={"tenantId": tenant_id, "status": "PENDING"})
    devices = await db.devicechangerequest.count(where={"tenantId": tenant_id, "status": "PENDING"})
    flagged = await db.attendancerecord.count(where={"tenantId": tenant_id, "status": "FLAGGED"})
    setup = await get_setup_status(tenant_id)
    todo = [check.label for check in setup.checks if check.required and not check.done]
    lines = [
        await _yesterday(tenant_id),
        f"{_plural(flagged, 'flagged mark')} waiting for a teacher's review.",
        f"{_plural(leaves, 'leave request')} and {_plural(devices, 'device request')} waiting to be decided.",
    ]
    if todo:
        lines.append("Setup still needed: " + ", ".join(todo) + ".")
    return {"title": "Your morning briefing", "lines": lines}


async def _first_today(tenant_id: str) -> bool:
    """Only one briefing per institution per day, even if the worker runs the job twice."""
    redis = safe_redis()
    if not redis:
        return True
    key = f"agent:briefing:{tenant_id}:{get_ist_today().isoformat()}"
    return bool(await redis.set(key, "1", nx=True, ex=SENT_TTL_SECONDS))


async def send_daily_briefings(ctx: dict[str, Any]) -> int:
    """Sends each opted-in institution's admins an in-app note. Returns how many institutions got one."""
    sent = 0
    for tenant in await db.tenant.find_many(where={"status": "ACTIVE"}):
        if notice_of(tenant) is None or not await _first_today(tenant.id):
            continue
        briefing = await build_briefing(tenant.id)
        message = "\n".join(briefing["lines"])
        admins = await db.user.find_many(where={"tenantId": tenant.id, "role": {"in": ADMIN_ROLES}, "isActive": True})
        for admin in admins:
            await create_in_app_notification(
                title=briefing["title"], message=message, user_id=admin.id,
                tenant_id=tenant.id, category="briefing",
            )
        sent += 1
    logger.info("Daily briefings sent to %d institutions", sent)
    return sent
