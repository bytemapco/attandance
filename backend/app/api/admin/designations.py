from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.errors import PrismaError
from prisma.models import User

from app.api.admin.helpers import get_client_ip, handle_generic_err, logger, require_designation_in_tenant
from app.api.dependencies import get_current_user, get_tenant_context
from app.schemas.admin import BulkImportResponse, DesignationBulkCreateRequest
from app.schemas.common import MessageResponse
from app.schemas.master_data import DesignationCreate, DesignationResponse, DesignationUpdate
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/designations/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_designations(
    data: DesignationBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_designations(
        data.designations,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get("/designations", response_model=list[DesignationResponse])
async def get_designations(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_designations(tenant_id=tenant_id)


@router.get("/designations/{id}", response_model=DesignationResponse)
async def get_designation(
    id: str,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    designation = await admin_service.get_designation_by_id(id, tenant_id=tenant_id)
    if not designation:
        raise HTTPException(status_code=404, detail="Designation not found")
    return designation


@router.post("/designations", response_model=DesignationResponse)
@handle_generic_err
async def create_designation(
    data: DesignationCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_designation(data.name, data.code, data.description, tenant_id=tenant_id)


@router.put("/designations/{id}", response_model=DesignationResponse)
@handle_generic_err
async def update_designation(
    id: str,
    data: DesignationUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await require_designation_in_tenant(id, tenant_id)
    return await admin_service.update_designation(id, data.model_dump(exclude_unset=True))


@router.delete("/designations/{id}", response_model=MessageResponse)
async def delete_designation(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await require_designation_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_designation(id, actor=current_user.email, ip=get_client_ip(request))
        return MessageResponse(status="success", message="Designation deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PrismaError:
        raise
    except Exception as exc:
        logger.error("Failed to delete designation %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
