import math
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import HTTPException, status
from prisma import Json
from prisma.models import User

from app.db.client import db
from app.services.announcements.publisher import publish

SENT_BY_PLATFORM = {"sender": {"is": {"role": "SUPER_ADMIN"}}}


class GlobalBroadcastService:
    @staticmethod
    async def create_global_broadcast(data: Dict[str, Any], sender: User) -> Dict[str, Any]:
        """An announcement from the platform owner to one audience, of one institution or of all of them."""
        tenant_id = data.get("target_tenant_id")
        if tenant_id and not await db.tenant.find_unique(where={"id": tenant_id}):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found.")
        title, message = data["title"].strip(), data["message"].strip()
        audience, msg_type = data.get("target_role") or "ALL", data.get("type", "info")

        announcement = await publish(
            sender,
            title=title,
            message=message,
            audience=audience,
            tenant_id=tenant_id,
            type=msg_type,
            category=data.get("category", "system"),
            publish_at=data.get("publish_at"),
        )
        scheduled = announcement.publishAt > datetime.now(timezone.utc)
        await db.auditlog.create(
            data={
                "eventType": "GLOBAL_BROADCAST",
                "severity": "WARNING" if msg_type in ("warning", "critical") else "INFO",
                "actor": sender.email,
                "target": f"Audience:{audience}, Tenant:{tenant_id or 'ALL'}",
                "description": f"{'Scheduled' if scheduled else 'Announced'} '{title}' for {announcement.audienceCount} people",
                "metadata": Json({"announcement_id": announcement.id, "audience": audience, "type": msg_type}),
            }
        )
        return {
            "status": "scheduled" if scheduled else "sent",
            "audience_count": announcement.audienceCount,
            "title": title,
            "audience": audience,
        }

    @staticmethod
    async def get_broadcast_history(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        total = await db.announcement.count(where=SENT_BY_PLATFORM)
        rows = await db.announcement.find_many(
            where=SENT_BY_PLATFORM,
            include={"sender": True, "tenant": True},
            order={"publishAt": "desc"},
            skip=(max(1, page) - 1) * page_size,
            take=page_size,
        )
        now = datetime.now(timezone.utc)
        items = [
            {
                "id": row.id,
                "publish_at": row.publishAt,
                "title": row.title,
                "message": row.message,
                "type": row.type,
                "audience": row.audience,
                "tenant_name": row.tenant.name if row.tenant else None,
                "sender": row.sender.email if row.sender else None,
                "audience_count": row.audienceCount,
                "status": "scheduled" if row.publishAt > now else "sent",
            }
            for row in rows
        ]
        return {
            "items": items,
            "total_items": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if total else 1,
        }
