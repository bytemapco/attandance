from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from prisma.models import User
from app.api.errors import value_error_as
from app.api.dependencies import RoleChecker, get_current_user
from app.schemas.super_admin import (
    TenantAdminInput,
    TenantAdminEmailUpdateRequest,
    TenantProvisionRequest,
    TenantUpdateRequest,
    TenantDetailResponse,
    SuperAdminStatsResponse,
    GlobalUserStatusUpdateRequest,
    GlobalBroadcastRequest,
    PlatformHealthResponse,
    PaginatedBroadcastHistory,
    LicenseRequestProcessRequest,
    LicenseRequestProcessedResponse,
    PaginatedLicenseRequests,
)
from app.services.super_admin_service import SuperAdminService
from app.core.url_resolver import resolve_frontend_url

super_admin_protection = Depends(RoleChecker(allowed_roles=["SUPER_ADMIN"]))
router = APIRouter(
    prefix="/super-admin", tags=["Super Admin Platform Operations"], dependencies=[super_admin_protection]
)


@router.get("/stats", response_model=SuperAdminStatsResponse)
async def get_platform_stats():
    return await SuperAdminService.get_platform_stats()


@router.get("/tenants")
async def list_tenants(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    q: Optional[str] = None,
    status: Optional[str] = None,
):
    return await SuperAdminService.get_all_tenants(page=page, page_size=page_size, q=q, status=status)


@router.post("/tenants", response_model=TenantDetailResponse, status_code=status.HTTP_201_CREATED)
@value_error_as(400)
async def provision_tenant(data: TenantProvisionRequest, current_user: User = Depends(get_current_user)):
    return await SuperAdminService.provision_tenant(data, actor=current_user.email)


@router.get("/tenants/{tenant_id}", response_model=TenantDetailResponse)
@value_error_as(404)
async def get_tenant_details(tenant_id: str):
    return await SuperAdminService.get_tenant_by_id(tenant_id)


@router.put("/tenants/{tenant_id}", response_model=TenantDetailResponse)
@value_error_as(400)
async def update_tenant(tenant_id: str, data: TenantUpdateRequest):
    return await SuperAdminService.update_tenant(tenant_id, data)


@router.delete("/tenants/{tenant_id}")
@value_error_as(404)
async def delete_tenant(tenant_id: str, current_user: User = Depends(get_current_user)):
    return await SuperAdminService.delete_tenant(tenant_id, actor=current_user.email)


@router.get("/license-requests", response_model=PaginatedLicenseRequests)
async def list_license_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
):
    return await SuperAdminService.get_license_requests(status=status, page=page, page_size=page_size)


@router.post("/license-requests/{request_id}/process", response_model=LicenseRequestProcessedResponse)
@value_error_as(400)
async def process_license_request(
    request_id: str,
    data: LicenseRequestProcessRequest,
    current_user: User = Depends(get_current_user),
):
    return await SuperAdminService.process_license_request(
        request_id=request_id,
        super_admin_user_id=current_user.id,
        approve=data.approve,
    )


@router.post("/tenants/{tenant_id}/admins", status_code=status.HTTP_201_CREATED)
@value_error_as(400)
async def add_tenant_admin(
    tenant_id: str,
    data: TenantAdminInput,
    current_user: User = Depends(get_current_user),
):
    return await SuperAdminService.add_tenant_admin(tenant_id, data.model_dump(), actor=current_user.email)


@router.put("/tenants/{tenant_id}/admins/{admin_id}")
@value_error_as(400)
async def update_tenant_admin_email(
    tenant_id: str,
    admin_id: str,
    data: TenantAdminEmailUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    return await SuperAdminService.update_tenant_admin_email(
        tenant_id=tenant_id,
        admin_id=admin_id,
        new_email=data.email,
        actor=current_user.email,
    )


@router.delete("/tenants/{tenant_id}/admins/{admin_id}")
@value_error_as(400)
async def delete_tenant_admin(
    tenant_id: str,
    admin_id: str,
    current_user: User = Depends(get_current_user),
):
    return await SuperAdminService.delete_tenant_admin(
        tenant_id=tenant_id,
        admin_id=admin_id,
        actor=current_user.email,
    )


@router.get("/users")
async def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    role: Optional[str] = None,
    tenant_id: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    return await SuperAdminService.get_all_users(
        page=page, page_size=page_size, q=q, role=role, tenant_id=tenant_id, is_active=is_active
    )


@router.patch("/users/{user_id}/status")
@value_error_as(404)
async def set_user_status(
    user_id: str,
    data: GlobalUserStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    return await SuperAdminService.set_user_status(user_id, data.is_active, actor=current_user.email)


@router.post("/users/{user_id}/reset-password")
@value_error_as(404)
async def reset_user_password(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    frontend_url = resolve_frontend_url(request)
    return await SuperAdminService.trigger_password_reset(
        user_id, actor=current_user.email, frontend_url=frontend_url
    )


@router.get("/audit-logs")
async def get_global_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    tenant_id: Optional[str] = None,
    actor: Optional[str] = None,
):
    return await SuperAdminService.get_global_audit_logs(
        page=page, page_size=page_size, severity=severity, event_type=event_type, tenant_id=tenant_id, actor=actor
    )


@router.get("/audit-logs/event-types", response_model=list[str])
async def get_distinct_audit_event_types():
    return await SuperAdminService.get_distinct_event_types()


@router.get("/system-health", response_model=PlatformHealthResponse)
async def get_system_health():
    return await SuperAdminService.get_system_health()


@router.get("/broadcasts", response_model=PaginatedBroadcastHistory)
async def list_global_broadcasts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return await SuperAdminService.get_broadcast_history(page=page, page_size=page_size)


@router.post("/broadcast", status_code=status.HTTP_200_OK)
async def create_global_broadcast(
    data: GlobalBroadcastRequest,
    current_user: User = Depends(get_current_user),
):
    return await SuperAdminService.create_global_broadcast(data.model_dump(), current_user)
