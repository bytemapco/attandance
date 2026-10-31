from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from prisma.models import User

from app.api.dependencies import get_current_user, get_tenant_context
from app.schemas.super_admin import LicenseRequestCreate
from app.services.super_admin_service import SuperAdminService

router = APIRouter()


@router.get("/licenses")
async def get_license_usage(
    tenant_id: str = Depends(get_tenant_context),
):
    try:
        return await SuperAdminService.get_tenant_license_usage(tenant_id=tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/licenses/request", status_code=status.HTTP_201_CREATED)
async def create_license_request(
    data: LicenseRequestCreate,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    try:
        return await SuperAdminService.create_license_request(
            tenant_id=tenant_id,
            requested_by_user_id=current_user.id,
            requested_count=data.requested_count,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/licenses/requests")
async def list_tenant_license_requests(
    tenant_id: str = Depends(get_tenant_context),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
):
    return await SuperAdminService.get_license_requests(
        status=status,
        tenant_id=tenant_id,
        page=page,
        page_size=page_size,
    )
