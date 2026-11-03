from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.errors import PrismaError
from prisma.models import User

from app.core.client_ip import get_client_ip
from app.api.admin.helpers import handle_generic_err, logger, require_department_in_tenant
from app.api.dependencies import get_current_user, get_tenant_context
from app.schemas.admin import BulkImportResponse, DepartmentBulkCreateRequest, DepartmentCreate, DepartmentResponse, DepartmentUpdate
from app.schemas.common import MessageResponse
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/departments/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_departments(
    data: DepartmentBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_departments(
        data.departments,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get("/departments", response_model=list[DepartmentResponse])
async def get_departments(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_departments(tenant_id=tenant_id)


@router.get("/departments/{id}", response_model=DepartmentResponse)
async def get_department(
    id: str,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    department = await admin_service.get_department_by_id(id, tenant_id=tenant_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.post("/departments", response_model=DepartmentResponse)
@handle_generic_err
async def create_department(
    data: DepartmentCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_department(data.name, data.code, data.head, data.description, tenant_id=tenant_id)


@router.put("/departments/{id}", response_model=DepartmentResponse)
@handle_generic_err
async def update_department(
    id: str,
    data: DepartmentUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await require_department_in_tenant(id, tenant_id)
    return await admin_service.update_department(id, data.model_dump(exclude_unset=True))


@router.delete("/departments/{id}", response_model=MessageResponse)
async def delete_department(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await require_department_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_department(id, actor=current_user.email, ip=get_client_ip(request))
        return MessageResponse(status="success", message="Department deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PrismaError:
        raise
    except Exception as exc:
        logger.error("Failed to delete department %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
