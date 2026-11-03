from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from prisma.models import User

from app.core.client_ip import get_client_ip
from app.api.admin.helpers import handle_generic_err
from app.api.dependencies import get_current_user, get_tenant_context
from app.core.rate_limit import rate_limiter
from app.db.client import db
from app.schemas.admin import (
    BulkImportResponse,
    StudentBulkCreateRequest,
    StudentFilterFacetsResponse,
)
from app.schemas.pagination import PaginatedResponse
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/users/student", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
@handle_generic_err
async def create_student(
    data: StudentCreate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_student(
        data, actor=current_user.email, ip=get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/users/students/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_students(
    data: StudentBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_students(
        data.students,
        send_invite=data.send_invite,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get(
    "/users/students",
    response_model=PaginatedResponse[StudentResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    sort_by: str | None = None,
    sort_order: str = "asc",
    q: str | None = None,
    department_id: str | None = None,
    semester: int | None = None,
    batch_id: str | None = None,
    status: str | None = None,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_students(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        q=q,
        department_id=department_id,
        semester=semester,
        batch_id=batch_id,
        status=status,
        tenant_id=tenant_id,
    )


@router.get("/users/students/facets", response_model=StudentFilterFacetsResponse)
async def get_student_filter_facets(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_student_filter_facets(tenant_id=tenant_id)


@router.get("/users/students/{id}", response_model=StudentResponse)
async def get_student_by_id(
    id: str,
    tenant_id: str = Depends(get_tenant_context),
):
    student = await db.student.find_first(
        where={"id": id, "user": {"is": {"tenantId": tenant_id}}},
        include={"user": True, "department": True},
    )
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return StudentResponse(
        id=student.id,
        user_id=student.userId,
        enrollment_number=student.enrollmentNumber,
        email=student.user.email if student.user else "",
        first_name=student.firstName,
        last_name=student.lastName,
        phone=student.phone,
        gender=student.gender,
        date_of_birth=student.dateOfBirth,
        department_id=student.departmentId,
        department_name=student.department.name if student.department else None,
        semester=student.semester,
        batch=student.batch,
        batch_id=student.batchId,
    )


@router.put("/users/students/{id}", response_model=StudentResponse)
@handle_generic_err
async def update_student(
    id: str,
    data: StudentUpdate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.update_student(
        id, data.model_dump(exclude_unset=True), actor=current_user.email, ip=get_client_ip(request), tenant_id=tenant_id
    )
