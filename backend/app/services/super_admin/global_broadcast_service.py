import math
from datetime import datetime, timezone
from typing import Any, Dict
from prisma import Json
from app.core.logging_config import get_logger
from app.db.client import db

logger = get_logger("app.super_admin.broadcast")


class GlobalBroadcastService:
    @staticmethod
    async def create_global_broadcast(data: Dict[str, Any], actor: str = "super_admin") -> Dict[str, Any]:
        title = data["title"].strip()
        message = data["message"].strip()
        target_role = data.get("target_role")
        target_tenant_id = data.get("target_tenant_id")
        msg_type = data.get("type", "info")
        category = data.get("category", "system")

        where: dict = {}
        if target_role and target_role != "ALL":
            where["role"] = target_role
        if target_tenant_id:
            where["tenantId"] = target_tenant_id

        users = await db.user.find_many(where=where, take=5000)

        created_count = 0
        for u in users:
            await db.notification.create(
                data={
                    "userId": u.id,
                    "role": u.role,
                    "title": title,
                    "message": message,
                    "type": msg_type,
                    "category": category,
                }
            )
            created_count += 1

        await db.auditlog.create(
            data={
                "eventType": "GLOBAL_BROADCAST",
                "severity": "WARNING" if msg_type in ["warning", "critical"] else "INFO",
                "actor": actor,
                "target": f"Role:{target_role or 'ALL'}, Tenant:{target_tenant_id or 'ALL'}",
                "description": f"Broadcasted '{title}': {message[:80]} ({created_count} recipients)",
                "metadata": Json(
                    {
                        "title": title,
                        "delivered_count": created_count,
                        "type": msg_type,
                        "category": category,
                        "target_role": target_role or "ALL",
                    }
                ),
            }
        )

        try:
            from app.api.websocket import manager as ws_manager

            payload = {
                "type": "notification",
                "event": "NOTIFICATION_RECEIVED",
                "data": {
                    "title": title,
                    "message": message,
                    "type": msg_type,
                    "category": category,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
                "title": title,
                "message": message,
                "category": category,
                "severity": msg_type,
            }
            await ws_manager.broadcast(
                message=payload,
                target_role=target_role if target_role != "ALL" else None,
                tenant_id=target_tenant_id,
            )
        except Exception as ws_err:
            logger.warning("WebSocket real-time broadcast skipped: %s", ws_err)

        return {
            "status": "success",
            "delivered_count": created_count,
            "title": title,
            "target_role": target_role or "ALL",
        }

    @staticmethod
    async def get_broadcast_history(
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        where: Dict[str, Any] = {"eventType": "GLOBAL_BROADCAST"}
        total = await db.auditlog.count(where=where)
        skip = (max(1, page) - 1) * page_size
        logs = await db.auditlog.find_many(
            where=where,
            order={"timestamp": "desc"},
            skip=skip,
            take=page_size,
        )

        items = []
        for log in logs:
            meta = log.metadata if isinstance(log.metadata, dict) else {}
            title = meta.get("title")
            delivered_count = meta.get("delivered_count", 0)
            if not title and "Broadcasted '" in log.description:
                try:
                    title = log.description.split("Broadcasted '")[1].split("'")[0]
                except Exception:
                    title = log.description

            items.append(
                {
                    "id": log.id,
                    "timestamp": log.timestamp,
                    "title": title or log.description,
                    "description": log.description,
                    "severity": log.severity,
                    "actor": log.actor,
                    "target": log.target,
                    "delivered_count": delivered_count,
                }
            )

        return {
            "items": items,
            "total_items": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size > 0 and total > 0 else 1,
        }
