"""Saving an announcement and telling the people who are connected. It is saved first; someone who misses the push
finds it in their inbox."""
from datetime import datetime, timezone
from typing import Optional

from prisma.models import Announcement, User

from app.core.logging_config import get_logger
from app.db.client import db
from app.services.announcements.audience import roles_for
from app.services.connection_manager import manager

logger = get_logger("app.announcements")


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def audience_size(tenant_id: Optional[str], audience: str) -> int:
    """How many active people an announcement is meant for."""
    where: dict = {"isActive": True}
    if tenant_id is not None:
        where["tenantId"] = tenant_id
    roles = roles_for(audience)
    if roles is not None:
        where["role"] = {"in": sorted(roles)}
    return await db.user.count(where=where)


async def publish(
    sender: User,
    *,
    title: str,
    message: str,
    audience: str,
    tenant_id: Optional[str],
    type: str = "info",
    category: str = "system",
    link: Optional[str] = None,
    publish_at: Optional[datetime] = None,
) -> Announcement:
    """Saves one announcement. It shows from `publish_at`, or at once when that is missing or already past."""
    now = _now()
    announcement = await db.announcement.create(
        data={
            "senderId": sender.id,
            "tenantId": tenant_id,
            "audience": audience,
            "title": title,
            "message": message,
            "type": type,
            "category": category,
            "link": link,
            "publishAt": publish_at if publish_at and publish_at > now else now,
            "audienceCount": await audience_size(tenant_id, audience),
        }
    )
    await push_due()
    return announcement


def _live_payload(announcement: Announcement) -> dict:
    return {
        "event": "NOTIFICATION_RECEIVED",
        "data": {
            "id": announcement.id,
            "kind": "announcement",
            "sender_id": announcement.senderId,
            "tenant_id": announcement.tenantId,
            "title": announcement.title,
            "message": announcement.message,
            "type": announcement.type,
            "category": announcement.category,
            "link": announcement.link,
            "is_read": False,
            "created_at": announcement.publishAt.isoformat(),
        },
    }


async def push_due() -> int:
    """Tells connected people about each announcement that has come due and was not yet pushed, and returns how many.
    Each is claimed before it is sent, so it goes out once even when the API and the worker both run this."""
    now = _now()
    pushed = 0
    for announcement in await db.announcement.find_many(where={"pushedAt": None, "publishAt": {"lte": now}}):
        if not await db.announcement.update_many(where={"id": announcement.id, "pushedAt": None}, data={"pushedAt": now}):
            continue
        try:
            await manager.broadcast(_live_payload(announcement), roles_for(announcement.audience), tenant_id=announcement.tenantId)
        except Exception as exc:
            logger.warning("Could not push announcement %s live; it is in the inbox: %s", announcement.id, exc)
        pushed += 1
    return pushed
