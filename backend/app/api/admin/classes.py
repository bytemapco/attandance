from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.models import User

from app.api.admin.helpers import (
    get_client_ip,
    handle_generic_err,
    handle_value_err,
    require_class_in_tenant,
    require_teacher_in_tenant,
)
from app.api.dependencies import get_current_user, get_tenant_context
from app.core.rate_limit import rate_limiter
from app.db.client import db
from app.schemas.admin import (
    AssignTeacherRequest,
    BulkImportResponse,
    ClassBulkCreateRequest,
    ClassCreate,
    ClassResponse,
    ClassUpdate,
    EnrollRequest,
    EnrollStudentsResponse,
)
from app.schemas.pagination import PaginatedResponse
from app.services.admin_service import AdminService

router = APIRouter()


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
@handle_value_err
async def create_class(
    data: ClassCreate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_class(
        data, actor=current_user.email, ip=get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/classes/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@handle_generic_err
async def bulk_create_classes(
    data: ClassBulkCreateRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.bulk_create_classes(
        data.classes,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get(
    "/classes",
    response_model=PaginatedResponse[ClassResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_classes(
    page: int = 1,
    page_size: int = 10,
    sort_by: str | None = None,
    sort_order: str = "asc",
    q: str | None = None,
    subject_id: str | None = None,
    term_id: str | None = None,
    active_only: bool = False,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_classes(
        page=page,
        page_size=min(page_size, 100),
        sort_by=sort_by,
        sort_order=sort_order,
        q=q,
        subject_id=subject_id,
        term_id=term_id,
        active_only=active_only,
        tenant_id=tenant_id,
    )


@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class_by_id(
    class_id: str,
    tenant_id: str = Depends(get_tenant_context),
):
    academic_class = await db.academicclass.find_first(
        where={"id": class_id, "tenantId": tenant_id},
        include={"subject": True, "classroom": True, "enrollments": True},
    )
    if not academic_class:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return ClassResponse(
        id=academic_class.id,
        name=academic_class.name,
        subject_name=academic_class.subject.name if academic_class.subject else "",
        subject_code=academic_class.subject.code if academic_class.subject else "",
        teacherId=academic_class.teacherId,
        classroom_name=academic_class.classroom.name if academic_class.classroom else None,
        semester=academic_class.semester,
        batch=academic_class.batch,
        enrolled_count=len(academic_class.enrollments) if academic_class.enrollments else 0,
        enrolled_student_ids=[enrollment.studentId for enrollment in academic_class.enrollments]
        if academic_class.enrollments
        else [],
    )


@router.put("/classes/{class_id}", response_model=ClassResponse)
@handle_generic_err
async def update_class(
    class_id: str,
    data: ClassUpdate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    await require_class_in_tenant(class_id, tenant_id)
    return await admin_service.update_class(
        class_id, data.model_dump(exclude_unset=True), actor=current_user.email, ip=get_client_ip(request)
    )


@router.put("/classes/{class_id}/assign-teacher", response_model=ClassResponse)
@handle_value_err
async def assign_teacher(
    class_id: str,
    data: AssignTeacherRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    await require_class_in_tenant(class_id, tenant_id)
    await require_teacher_in_tenant(data.teacher_id, tenant_id)
    return await admin_service.assign_teacher(
        class_id=class_id, teacher_id=data.teacher_id, actor=current_user.email, ip=get_client_ip(request)
    )


@router.post("/classes/{class_id}/enroll", response_model=EnrollStudentsResponse, status_code=status.HTTP_200_OK)
@handle_value_err
async def enroll_students(
    class_id: str,
    data: EnrollRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> EnrollStudentsResponse:
    await require_class_in_tenant(class_id, tenant_id)
    enrolled_count = await admin_service.enroll_students(
        class_id=class_id,
        student_ids=data.student_ids,
        actor=current_user.email,
        ip=get_client_ip(request),
        tenant_id=tenant_id,
    )
    return EnrollStudentsResponse(
        enrolled_count=enrolled_count, class_id=class_id, message=f"Successfully enrolled {enrolled_count} students"
    )
