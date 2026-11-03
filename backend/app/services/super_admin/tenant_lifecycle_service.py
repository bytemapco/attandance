from typing import Any, Dict
from fastapi import HTTPException, status
from prisma import Json
from app.core.logging_config import get_logger
from app.db.client import db
from app.schemas.super_admin import TenantDetailResponse, TenantUpdateRequest

logger = get_logger("app.super_admin.lifecycle")


from app.services.super_admin.tenant_query_service import TenantQueryService


class TenantLifecycleService:

    @staticmethod
    async def update_tenant(tenant_id: str, data: TenantUpdateRequest) -> TenantDetailResponse:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        if data.license_count is not None:
            current_usage = await db.user.count(where={"tenantId": tenant_id, "role": {"in": ["STUDENT", "TEACHER"]}})
            if data.license_count < current_usage:
                raise ValueError(
                    f"License count ({data.license_count}) cannot be less than current usage ({current_usage} students + teachers)."
                )

        if data.slug and data.slug != t.slug:
            existing_slug = await db.tenant.find_unique(where={"slug": data.slug})
            if existing_slug:
                raise ValueError(f"Tenant slug '{data.slug}' is already in use by another institution.")

        update_data: dict = {}
        if data.name:
            update_data["name"] = data.name
        if data.slug:
            update_data["slug"] = data.slug
        if data.status:
            update_data["status"] = data.status
        if data.license_count is not None:
            update_data["licenseCount"] = data.license_count
        if data.config is not None:
            update_data["config"] = Json(data.config)

        updated = await db.tenant.update(where={"id": tenant_id}, data=update_data)
        try:
            from app.db.redis import get_redis

            r = get_redis()
            if t.slug != updated.slug:
                await r.delete(f"tenant:resolved:{t.slug}")
            if data.status == "SUSPENDED":
                await r.delete(f"tenant:resolved:{updated.id}")
                await r.delete(f"tenant:resolved:{updated.slug}")
                await r.setex(f"tenant:resolved:{updated.id}", 3600, f"SUSPENDED:{updated.id}")
                await r.setex(f"tenant:resolved:{updated.slug}", 3600, f"SUSPENDED:{updated.id}")
            elif data.status == "ACTIVE":
                await r.setex(f"tenant:resolved:{updated.id}", 3600, f"ACTIVE:{updated.id}")
                await r.setex(f"tenant:resolved:{updated.slug}", 3600, f"ACTIVE:{updated.id}")
            else:
                await r.delete(f"tenant:resolved:{updated.id}")
                await r.delete(f"tenant:resolved:{updated.slug}")
        except Exception as cache_err:
            logger.warning("Failed updating tenant Redis resolution keys for %s: %s", tenant_id, cache_err)
        if data.status == "SUSPENDED":
            from app.api.websocket import manager as ws_manager

            await ws_manager.force_close_tenant(
                tenant_id, f"Institution '{updated.name}' has been suspended. Please contact your administrator."
            )
            if updated.slug:
                await ws_manager.force_close_tenant(
                    updated.slug, f"Institution '{updated.name}' has been suspended. Please contact your administrator."
                )
        return await TenantQueryService.get_tenant_by_id(tenant_id)

    @staticmethod
    async def delete_tenant(tenant_id: str, actor: str = "super_admin") -> Dict[str, Any]:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        if await db.attendancerecord.count(where={"tenantId": tenant_id}) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"'{t.name}' has attendance records and cannot be deleted. Suspend the institution instead.",
            )

        try:
            from app.api.websocket import manager as ws_manager

            await ws_manager.force_close_tenant(
                tenant_id, f"Institution '{t.name}' has been deleted by platform super admin."
            )
            if t.slug:
                await ws_manager.force_close_tenant(
                    t.slug, f"Institution '{t.name}' has been deleted by platform super admin."
                )
        except Exception as ws_err:
            logger.warning("Failed force closing websockets for deleted tenant %s: %s", tenant_id, ws_err)

        try:
            from app.db.redis import get_redis

            r = get_redis()
            await r.delete(f"tenant:resolved:{t.id}")
            await r.delete(f"tenant:resolved:{t.slug}")
        except Exception as cache_err:
            logger.warning("Failed deleting Redis keys for tenant %s: %s", tenant_id, cache_err)

        await db.licenserequest.delete_many(where={"tenantId": tenant_id})
        deleted = await db.tenant.delete(where={"id": tenant_id})

        await db.auditlog.create(
            data={
                "eventType": "DELETE_TENANT",
                "severity": "WARNING",
                "actor": actor,
                "target": tenant_id,
                "description": f"Super admin '{actor}' permanently deleted tenant '{deleted.name}' ({deleted.slug}).",
            }
        )

        return {"id": tenant_id, "slug": deleted.slug, "name": deleted.name, "status": "DELETED"}
