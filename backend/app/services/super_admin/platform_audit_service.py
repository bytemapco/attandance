from typing import Any, Dict, Optional
from app.db.client import db


class PlatformAuditService:
    @staticmethod
    async def get_global_audit_logs(
        page: int = 1,
        page_size: int = 25,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        tenant_id: Optional[str] = None,
        actor: Optional[str] = None,
    ) -> Dict[str, Any]:
        where: dict = {}
        if severity and severity != "ALL":
            where["severity"] = severity
        if event_type and event_type != "ALL":
            where["eventType"] = event_type
        if tenant_id and tenant_id != "ALL":
            where["tenantId"] = tenant_id
        if actor and actor.strip():
            where["actor"] = {"contains": actor.strip(), "mode": "insensitive"}

        total_items = await db.auditlog.count(where=where)
        skip = (page - 1) * page_size
        logs = await db.auditlog.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"timestamp": "desc"},
            include={"tenant": True},
        )

        items = [
            {
                "id": entry.id,
                "timestamp": entry.timestamp,
                "event_type": entry.eventType,
                "severity": entry.severity,
                "actor": entry.actor,
                "target": entry.target,
                "description": entry.description,
                "ip_address": entry.ipAddress,
                "tenant_id": entry.tenantId,
                "tenant_name": entry.tenant.name if entry.tenant else "Platform Global",
                "metadata": entry.metadata if isinstance(entry.metadata, dict) else {},
            }
            for entry in logs
        ]

        total_pages = max(1, (total_items + page_size - 1) // page_size) if total_items > 0 else 1
        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    @staticmethod
    async def get_distinct_event_types() -> list[str]:
        rows = await db.query_raw(
            """
            SELECT DISTINCT event_type as val
            FROM audit_logs
            WHERE event_type IS NOT NULL AND TRIM(event_type) != ''
            ORDER BY val ASC
            """
        )
        return [str(r["val"]).strip() for r in rows if r.get("val")]
