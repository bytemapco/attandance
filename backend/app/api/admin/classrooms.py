from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.errors import PrismaError
from prisma.models import User

from app.core.client_ip import get_client_ip
from app.api.admin.helpers import handle_generic_err, logger, require_classroom_in_tenant
from app.api.dependencies import get_current_user, get_tenant_context
from app.schemas.admin import BulkImportResponse, ClassroomBulkCreateRequest
from app.schemas.common import MessageResponse
from app.schemas.master_data import ClassroomCreate, ClassroomResponse, ClassroomUpdate
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/classrooms/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_classrooms(
    data: ClassroomBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_classrooms(
        data.classrooms,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get("/classrooms", response_model=list[ClassroomResponse])
async def get_classrooms(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_classrooms(tenant_id=tenant_id)


@router.get("/classrooms/{id}", response_model=ClassroomResponse)
async def get_classroom(
    id: str,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    classroom = await admin_service.get_classroom_by_id(id, tenant_id=tenant_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom


@router.post("/classrooms", response_model=ClassroomResponse)
@handle_generic_err
async def create_classroom(
    data: ClassroomCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_classroom(data.name, tenant_id=tenant_id)


@router.put("/classrooms/{id}", response_model=ClassroomResponse)
@handle_generic_err
async def update_classroom(
    id: str,
    data: ClassroomUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await require_classroom_in_tenant(id, tenant_id)
    return await admin_service.update_classroom(id, data.model_dump(exclude_unset=True))


@router.delete("/classrooms/{id}", response_model=MessageResponse)
async def delete_classroom(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await require_classroom_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_classroom(id, actor=current_user.email, ip=get_client_ip(request))
        return MessageResponse(status="success", message="Classroom deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except PrismaError:
        raise
    except Exception as exc:
        logger.error("Failed to delete classroom %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error") from exc
