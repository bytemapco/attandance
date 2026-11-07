"""A notification written for one person. A message to a group is an announcement; see `services/announcements`."""
from typing import Any, Dict, Optional

from app.core.logging_config import get_logger
from app.core.tenancy import is_real_tenant
from app.db.client import db
from app.services.connection_manager import manager

logger = get_logger("app.notification")


def _record(notif) -> Dict[str, Any]:
    return {
        "id": notif.id,
        "kind": "personal",
        "user_id": notif.userId,
        "tenant_id": notif.tenantId,
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "category": notif.category,
        "link": notif.link,
        "is_read": notif.isRead,
        "created_at": notif.createdAt,
    }


async def create_in_app_notification(
    title: str,
    message: str,
    user_id: str,
    tenant_id: Optional[str] = None,
    type: str = "info",
    category: str = "system",
    link: Optional[str] = None,
) -> Dict[str, Any]:
    """Saves the notification, then tells the person if they are connected. One that is missed is in their inbox."""
    try:
        data: Dict[str, Any] = {
            "title": title,
            "message": message,
            "userId": user_id,
            "type": type,
            "category": category,
            "link": link,
        }
        if is_real_tenant(tenant_id):
            data["tenantId"] = tenant_id
        record = _record(await db.notification.create(data=data))
    except Exception as err:
        logger.error("Failed to create in-app notification: %s", err, exc_info=True)
        return {}
    try:
        await manager.send_personal_message(
            {"event": "NOTIFICATION_RECEIVED", "data": {**record, "created_at": record["created_at"].isoformat()}}, user_id
        )
    except Exception as exc:
        logger.debug("Live notification skipped: %s", exc)
    return record
