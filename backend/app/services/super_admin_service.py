"""SuperAdminService facade.

Delegates domain logic to focused super_admin services.
"""

from typing import Any, Dict, Optional

from app.schemas.super_admin import (
    SuperAdminStatsResponse,
    TenantDetailResponse,
    TenantProvisionRequest,
    TenantUpdateRequest,
)
from app.services.super_admin.global_broadcast_service import GlobalBroadcastService
from app.services.super_admin.platform_audit_service import PlatformAuditService
from app.services.super_admin.platform_license_service import PlatformLicenseService
from app.services.super_admin.system_health_service import SystemHealthService
from app.services.super_admin.tenant_admin_service import TenantAdminService
from app.services.super_admin.tenant_lifecycle_service import TenantLifecycleService
from app.services.super_admin.tenant_provisioning_service import TenantProvisioningService
from app.services.super_admin.tenant_query_service import TenantQueryService
from app.services.super_admin.user_management_service import UserManagementService


class SuperAdminService:
    @staticmethod
    async def provision_tenant(data: TenantProvisionRequest, actor: str = "super_admin") -> TenantDetailResponse:
        return await TenantProvisioningService.provision_tenant(data, actor=actor)

    @staticmethod
    async def get_all_tenants(
        page: int = 1,
        page_size: int = 10,
        q: Optional[str] = None,
        status: Optional[str] = None,
    ) -> dict:
        return await TenantQueryService.get_all_tenants(page=page, page_size=page_size, q=q, status=status)

    @staticmethod
    async def get_tenant_by_id(tenant_id: str) -> TenantDetailResponse:
        return await TenantQueryService.get_tenant_by_id(tenant_id)

    @staticmethod
    async def update_tenant(tenant_id: str, data: TenantUpdateRequest) -> TenantDetailResponse:
        return await TenantLifecycleService.update_tenant(tenant_id, data)

    @staticmethod
    async def delete_tenant(tenant_id: str, actor: str = "super_admin") -> Dict[str, Any]:
        return await TenantLifecycleService.delete_tenant(tenant_id, actor=actor)

    @staticmethod
    async def add_tenant_admin(tenant_id: str, data: Dict[str, Any], actor: str = "super_admin") -> Dict[str, Any]:
        return await TenantAdminService.add_tenant_admin(tenant_id, data, actor=actor)

    @staticmethod
    async def update_tenant_admin_email(
        tenant_id: str, admin_id: str, new_email: str, actor: str = "super_admin"
    ) -> Dict[str, Any]:
        return await TenantAdminService.update_tenant_admin_email(tenant_id, admin_id, new_email, actor=actor)

    @staticmethod
    async def delete_tenant_admin(
        tenant_id: str, admin_id: str, actor: str = "super_admin"
    ) -> Dict[str, Any]:
        return await TenantAdminService.delete_tenant_admin(tenant_id, admin_id, actor=actor)

    @staticmethod
    async def get_platform_stats() -> SuperAdminStatsResponse:
        return await SystemHealthService.get_platform_stats()

    @staticmethod
    async def get_system_health() -> Dict[str, Any]:
        return await SystemHealthService.get_system_health()

    @staticmethod
    async def get_all_users(
        page: int = 1,
        page_size: int = 20,
        q: Optional[str] = None,
        role: Optional[str] = None,
        tenant_id: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        return await UserManagementService.get_all_users(
            page=page,
            page_size=page_size,
            q=q,
            role=role,
            tenant_id=tenant_id,
            is_active=is_active,
        )

    @staticmethod
    async def set_user_status(user_id: str, is_active: bool, actor: str = "super_admin") -> Dict[str, Any]:
        return await UserManagementService.set_user_status(user_id, is_active, actor=actor)

    @staticmethod
    async def trigger_password_reset(
        user_id: str, actor: str = "super_admin", frontend_url: Optional[str] = None
    ) -> Dict[str, Any]:
        return await UserManagementService.trigger_password_reset(user_id, actor=actor, frontend_url=frontend_url)

    @staticmethod
    async def get_global_audit_logs(
        page: int = 1,
        page_size: int = 25,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        tenant_id: Optional[str] = None,
        actor: Optional[str] = None,
    ) -> Dict[str, Any]:
        return await PlatformAuditService.get_global_audit_logs(
            page=page,
            page_size=page_size,
            severity=severity,
            event_type=event_type,
            tenant_id=tenant_id,
            actor=actor,
        )

    @staticmethod
    async def get_distinct_event_types() -> list[str]:
        return await PlatformAuditService.get_distinct_event_types()

    @staticmethod
    async def create_global_broadcast(data: Dict[str, Any], actor: str = "super_admin") -> Dict[str, Any]:
        return await GlobalBroadcastService.create_global_broadcast(data, actor=actor)

    @staticmethod
    async def get_broadcast_history(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return await GlobalBroadcastService.get_broadcast_history(page=page, page_size=page_size)

    @staticmethod
    async def get_tenant_license_usage(tenant_id: str) -> Dict[str, Any]:
        return await PlatformLicenseService.get_tenant_license_usage(tenant_id)

    @staticmethod
    async def create_license_request(tenant_id: str, requested_by_user_id: str, requested_count: int) -> Dict[str, Any]:
        return await PlatformLicenseService.create_license_request(
            tenant_id=tenant_id,
            requested_by_user_id=requested_by_user_id,
            requested_count=requested_count,
        )

    @staticmethod
    async def get_license_requests(
        status: Optional[str] = None,
        tenant_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        return await PlatformLicenseService.get_license_requests(
            status=status,
            tenant_id=tenant_id,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    async def process_license_request(request_id: str, super_admin_user_id: str, approve: bool) -> Dict[str, Any]:
        return await PlatformLicenseService.process_license_request(
            request_id=request_id,
            super_admin_user_id=super_admin_user_id,
            approve=approve,
        )
