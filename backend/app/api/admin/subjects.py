from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.errors import PrismaError
from prisma.models import User

from app.api.admin.helpers import get_client_ip, handle_generic_err, logger, require_department_in_tenant, require_subject_in_tenant
from app.api.dependencies import get_current_user, get_tenant_context
from app.schemas.admin import BulkImportResponse, SubjectBulkCreateRequest
from app.schemas.common import MessageResponse
from app.schemas.master_data import SubjectCreate, SubjectResponse, SubjectUpdate
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/subjects/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_subjects(
    data: SubjectBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_subjects(
        data.subjects,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get("/subjects", response_model=list[SubjectResponse])
async def get_subjects(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_subjects(tenant_id=tenant_id)


@router.get("/subjects/{id}", response_model=SubjectResponse)
async def get_subject(
    id: str,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    subject = await admin_service.get_subject_by_id(id, tenant_id=tenant_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.post("/subjects", response_model=SubjectResponse)
@handle_generic_err
async def create_subject(
    data: SubjectCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    if data.department_id:
        await require_department_in_tenant(data.department_id, tenant_id)
    return await admin_service.create_subject(
        data.name, data.code, data.description, department_id=data.department_id, tenant_id=tenant_id
    )


@router.put("/subjects/{id}", response_model=SubjectResponse)
@handle_generic_err
async def update_subject(
    id: str,
    data: SubjectUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await require_subject_in_tenant(id, tenant_id)
    if data.department_id:
        await require_department_in_tenant(data.department_id, tenant_id)
    return await admin_service.update_subject(id, data.model_dump(exclude_unset=True), tenant_id=tenant_id)


@router.delete("/subjects/{id}", response_model=MessageResponse)
async def delete_subject(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await require_subject_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_subject(id, actor=current_user.email, ip=get_client_ip(request))
        return MessageResponse(status="success", message="Subject deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except PrismaError:
        raise
    except Exception as exc:
        logger.error("Failed to delete subject %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
