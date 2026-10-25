from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from prisma.models import User

from app.api.dependencies import RoleChecker, get_current_user
from app.services.scim_service import SCIMService

# SCIM endpoints protected by Admin authentication
admin_protection = Depends(RoleChecker(allowed_roles=["ADMIN", "SUPER_ADMIN", "TENANT_ADMIN"]))
router = APIRouter(prefix="/scim/v2", tags=["SCIM 2.0 Directory Sync"], dependencies=[admin_protection])


@router.get("/ServiceProviderConfig")
async def get_service_provider_config() -> Dict[str, Any]:
    return SCIMService.get_service_provider_config()


@router.get("/Users")
async def list_scim_users(
    startIndex: int = Query(1, ge=1),
    count: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    tenant_id = getattr(current_user, "tenantId", None)
    return await SCIMService.list_users(tenant_id=tenant_id, start_index=startIndex, count=count)


@router.get("/Users/{user_id}")
async def get_scim_user(user_id: str, current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    tenant_id = getattr(current_user, "tenantId", None) if current_user.role != "SUPER_ADMIN" else None
    user = await SCIMService.get_user_by_id(user_id, tenant_id=tenant_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCIM user not found")
    return user


@router.post("/Users", status_code=status.HTTP_201_CREATED)
async def create_scim_user(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    tenant_id = getattr(current_user, "tenantId", None)
    try:
        return await SCIMService.create_user(body, tenant_id=tenant_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err))


@router.delete("/Users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scim_user(user_id: str, current_user: User = Depends(get_current_user)) -> None:
    tenant_id = getattr(current_user, "tenantId", None) if current_user.role != "SUPER_ADMIN" else None
    deleted = await SCIMService.delete_user(user_id, tenant_id=tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SCIM user not found")
