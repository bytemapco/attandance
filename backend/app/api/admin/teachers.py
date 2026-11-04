from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from prisma.models import User

from app.core.client_ip import get_client_ip
from app.api.admin.helpers import handle_generic_err
from app.api.dependencies import get_current_user, get_tenant_context
from app.core.rate_limit import rate_limiter
from app.core.url_resolver import resolve_frontend_url
from app.db.client import db
from app.schemas.admin import BulkImportResponse, TeacherBulkCreateRequest
from app.schemas.common import MessageResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.teacher import TeacherCreate, TeacherResponse, TeacherUpdate
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/users/teacher", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
@handle_generic_err
async def create_teacher(
    data: TeacherCreate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_teacher(
        data, actor=current_user.email, ip=get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/users/teachers/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_teachers(
    data: TeacherBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_teachers(
        data.teachers,
        send_invite=data.send_invite,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get(
    "/users/teachers",
    response_model=PaginatedResponse[TeacherResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_teachers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    sort_by: str | None = None,
    sort_order: str = "asc",
    q: str | None = None,
    department_id: str | None = None,
    designation_id: str | None = None,
    status: str | None = None,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_teachers(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        q=q,
        department_id=department_id,
        designation_id=designation_id,
        status=status,
        tenant_id=tenant_id,
    )


@router.get("/users/teachers/{id}", response_model=TeacherResponse)
async def get_teacher_by_id(
    id: str,
    tenant_id: str = Depends(get_tenant_context),
):
    teacher = await db.teacher.find_first(
        where={"id": id, "user": {"is": {"tenantId": tenant_id}}},
        include={"user": True, "department": True, "designation": True},
    )
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    return TeacherResponse(
        id=teacher.id,
        user_id=teacher.userId,
        email=teacher.user.email if teacher.user else "",
        employee_id=teacher.employeeId,
        first_name=teacher.firstName,
        last_name=teacher.lastName,
        name_initials=teacher.nameInitials,
        department_id=teacher.departmentId,
        designation_id=teacher.designationId,
        department=teacher.department.name if teacher.department else "",
        designation=teacher.designation.name if teacher.designation else "",
        phone=teacher.phone,
    )


@router.put("/users/teachers/{id}", response_model=TeacherResponse)
@handle_generic_err
async def update_teacher(
    id: str,
    data: TeacherUpdate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.update_teacher(
        id, data.model_dump(exclude_unset=True), actor=current_user.email, ip=get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/users/{user_id}/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
@router.put("/users/{user_id}/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def trigger_user_password_reset(
    user_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    target_user = await db.user.find_first(where={"id": user_id, "tenantId": tenant_id})
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    try:
        frontend_url = resolve_frontend_url(request)
        await admin_service.trigger_password_reset(
            user_id,
            actor=current_user.email,
            ip=get_client_ip(request),
            frontend_url=frontend_url,
        )
        return MessageResponse(
            status="success",
            message="Password reset instructions dispatched to the user's registered email address.",
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err
