from functools import wraps
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from prisma.models import User

from app.api.dependencies import RoleChecker, get_current_user, get_tenant_context
from app.db.client import db
from app.repositories.attendance_repo import AttendanceRepository
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate
from app.schemas.teacher import TeacherCreate, TeacherResponse, TeacherUpdate
from app.schemas.admin import (
    ClassCreate,
    ClassUpdate,
    ClassResponse,
    AssignTeacherRequest,
    EnrollRequest,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    AuditLogResponse,
    AdminStatsResponse,
    EnrollStudentsResponse,
    StudentBulkCreateRequest,
    TeacherBulkCreateRequest,
    ClassBulkCreateRequest,
    BulkImportResponse,
    DepartmentBulkCreateRequest,
    SubjectBulkCreateRequest,
    ClassroomBulkCreateRequest,
    DesignationBulkCreateRequest,
    AbsenteeAnomalyItem,
    StudentFilterFacetsResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.master_data import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    ClassroomCreate,
    ClassroomUpdate,
    ClassroomResponse,
    DesignationCreate,
    DesignationUpdate,
    DesignationResponse,
)
from app.schemas.pagination import PaginatedResponse
from app.schemas.super_admin import LicenseRequestCreate
from app.core.rate_limit import rate_limiter
from app.services.admin_service import AdminService
from app.services.super_admin_service import SuperAdminService
from app.services.absentee_scanner import run_absentee_scan
from app.core.logging_config import get_logger

logger = get_logger("app.api.admin")

admin_protection = Depends(RoleChecker(allowed_roles=["ADMIN"]))
router = APIRouter(prefix="/admin", tags=["Admin System Operations"], dependencies=[admin_protection])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _handle_value_err(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as err:
            err_msg = str(err)
            if "not found" in err_msg.lower():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        except Exception as err:
            logger.error("Admin operation error: %s", err, exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    return wrapper


def _handle_generic_err(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as err:
            err_msg = str(err)
            if "not found" in err_msg.lower():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        except Exception as err:
            logger.error("Admin generic operation error: %s", err, exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    return wrapper


# ---------------------------------------------------------------------------
# Ownership guard helpers — always filter by BOTH id AND tenantId
# ---------------------------------------------------------------------------


async def _require_student_in_tenant(student_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.student.find_first(where={"id": student_id, "user": {"is": {"tenantId": tenant_id}}})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")


async def _require_teacher_in_tenant(teacher_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.teacher.find_first(where={"id": teacher_id, "user": {"is": {"tenantId": tenant_id}}})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found.")


async def _require_class_in_tenant(class_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.academicclass.find_first(where={"id": class_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")


async def _require_department_in_tenant(dept_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.department.find_first(where={"id": dept_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")


async def _require_subject_in_tenant(subject_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.subject.find_first(where={"id": subject_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")


async def _require_classroom_in_tenant(classroom_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.classroom.find_first(where={"id": classroom_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")


async def _require_designation_in_tenant(desig_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.designation.find_first(where={"id": desig_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Designation not found.")


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------


@router.post("/users/student", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
@_handle_generic_err
async def create_student(
    data: StudentCreate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_student(
        data, actor=current_user.email, ip=_get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/users/students/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get(
    "/users/students",
    response_model=PaginatedResponse[StudentResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_students(
    page: int = 1,
    page_size: int = 10,
    sort_by: str | None = None,
    sort_order: str = "asc",
    q: str | None = None,
    department_id: str | None = None,
    semester: int | None = None,
    batch: str | None = None,
    branch: str | None = None,
    status: str | None = None,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_all_students(
        page=page,
        page_size=min(page_size, 1000),
        sort_by=sort_by,
        sort_order=sort_order,
        q=q,
        department_id=department_id,
        semester=semester,
        batch=batch,
        branch=branch,
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
    )


@router.put("/users/students/{id}", response_model=StudentResponse)
@_handle_generic_err
async def update_student(
    id: str,
    data: StudentUpdate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    await _require_student_in_tenant(id, tenant_id)
    return await admin_service.update_student(
        id, data.model_dump(exclude_unset=True), actor=current_user.email, ip=_get_client_ip(request)
    )


# ---------------------------------------------------------------------------
# Teachers
# ---------------------------------------------------------------------------


@router.post("/users/teacher", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
@_handle_generic_err
async def create_teacher(
    data: TeacherCreate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_teacher(
        data, actor=current_user.email, ip=_get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/users/teachers/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
        tenant_id=tenant_id,
    )


@router.get(
    "/users/teachers",
    response_model=PaginatedResponse[TeacherResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_teachers(
    page: int = 1,
    page_size: int = 10,
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
        page_size=min(page_size, 100),
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
        department_id=teacher.departmentId,
        designation_id=teacher.designationId,
        department=teacher.department.name if teacher.department else "",
        designation=teacher.designation.name if teacher.designation else "",
        phone=teacher.phone,
        qualification=teacher.qualification,
        specialization=teacher.specialization,
        experience_years=teacher.experienceYears,
        joining_date=teacher.joiningDate,
    )


@router.put("/users/teachers/{id}", response_model=TeacherResponse)
@_handle_generic_err
async def update_teacher(
    id: str,
    data: TeacherUpdate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    await _require_teacher_in_tenant(id, tenant_id)
    return await admin_service.update_teacher(
        id, data.model_dump(exclude_unset=True), actor=current_user.email, ip=_get_client_ip(request)
    )


# ---------------------------------------------------------------------------
# Password Reset
# ---------------------------------------------------------------------------


@router.post("/users/{user_id}/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
@router.put("/users/{user_id}/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def trigger_user_password_reset(
    user_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    # Verify the target user belongs to this tenant before resetting their password
    target_user = await db.user.find_first(where={"id": user_id, "tenantId": tenant_id})
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    try:
        from app.core.url_resolver import resolve_frontend_url

        frontend_url = resolve_frontend_url(request)
        await admin_service.trigger_password_reset(
            user_id,
            actor=current_user.email,
            ip=_get_client_ip(request),
            frontend_url=frontend_url,
        )
        return MessageResponse(
            status="success",
            message="Password reset instructions dispatched to the user's registered email address.",
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


# ---------------------------------------------------------------------------
# Classes
# ---------------------------------------------------------------------------


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
@_handle_value_err
async def create_class(
    data: ClassCreate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_class(
        data, actor=current_user.email, ip=_get_client_ip(request), tenant_id=tenant_id
    )


@router.post("/classes/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
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
        tenant_id=tenant_id,
    )


@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class_by_id(
    class_id: str,
    tenant_id: str = Depends(get_tenant_context),
):
    cls = await db.academicclass.find_first(
        where={"id": class_id, "tenantId": tenant_id},
        include={"subject": True, "classroom": True, "enrollments": True},
    )
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return ClassResponse(
        id=cls.id,
        name=cls.name,
        subject_name=cls.subject.name if cls.subject else "",
        subject_code=cls.subject.code if cls.subject else "",
        teacherId=cls.teacherId,
        classroom_name=cls.classroom.name if cls.classroom else None,
        semester=cls.semester,
        batch=cls.batch,
        enrolled_count=len(cls.enrollments) if cls.enrollments else 0,
        enrolled_student_ids=[e.studentId for e in cls.enrollments] if cls.enrollments else [],
    )


@router.put("/classes/{class_id}", response_model=ClassResponse)
@_handle_generic_err
async def update_class(
    class_id: str,
    data: ClassUpdate,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    await _require_class_in_tenant(class_id, tenant_id)
    return await admin_service.update_class(
        class_id, data.model_dump(exclude_unset=True), actor=current_user.email, ip=_get_client_ip(request)
    )


@router.put("/classes/{class_id}/assign-teacher", response_model=ClassResponse)
@_handle_value_err
async def assign_teacher(
    class_id: str,
    data: AssignTeacherRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    await _require_class_in_tenant(class_id, tenant_id)
    await _require_teacher_in_tenant(data.teacher_id, tenant_id)
    return await admin_service.assign_teacher(
        class_id=class_id, teacher_id=data.teacher_id, actor=current_user.email, ip=_get_client_ip(request)
    )


@router.post("/classes/{class_id}/enroll", response_model=EnrollStudentsResponse, status_code=status.HTTP_200_OK)
@_handle_value_err
async def enroll_students(
    class_id: str,
    data: EnrollRequest,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> EnrollStudentsResponse:
    await _require_class_in_tenant(class_id, tenant_id)
    enrolled_count = await admin_service.enroll_students(
        class_id=class_id,
        student_ids=data.student_ids,
        actor=current_user.email,
        ip=_get_client_ip(request),
        tenant_id=tenant_id,
    )
    return EnrollStudentsResponse(
        enrolled_count=enrolled_count, class_id=class_id, message=f"Successfully enrolled {enrolled_count} students"
    )


# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------


@router.post("/departments/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
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
    dept = await admin_service.get_department_by_id(id, tenant_id=tenant_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.post("/departments", response_model=DepartmentResponse)
@_handle_generic_err
async def create_department(
    data: DepartmentCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_department(data.name, data.code, data.head, data.description, tenant_id=tenant_id)


@router.put("/departments/{id}", response_model=DepartmentResponse)
@_handle_generic_err
async def update_department(
    id: str,
    data: DepartmentUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await _require_department_in_tenant(id, tenant_id)
    return await admin_service.update_department(id, data.model_dump(exclude_unset=True))


@router.delete("/departments/{id}", response_model=MessageResponse)
async def delete_department(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await _require_department_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_department(id, actor=current_user.email, ip=_get_client_ip(request))
        return MessageResponse(status="success", message="Department deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        logger.error("Failed to delete department %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------


@router.post("/subjects/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
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
    sub = await admin_service.get_subject_by_id(id, tenant_id=tenant_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
    return sub


@router.post("/subjects", response_model=SubjectResponse)
@_handle_generic_err
async def create_subject(
    data: SubjectCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    if data.department_id:
        await _require_department_in_tenant(data.department_id, tenant_id)
    return await admin_service.create_subject(
        data.name, data.code, data.description, department_id=data.department_id, tenant_id=tenant_id
    )


@router.put("/subjects/{id}", response_model=SubjectResponse)
@_handle_generic_err
async def update_subject(
    id: str,
    data: SubjectUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await _require_subject_in_tenant(id, tenant_id)
    if data.department_id:
        await _require_department_in_tenant(data.department_id, tenant_id)
    return await admin_service.update_subject(id, data.model_dump(exclude_unset=True), tenant_id=tenant_id)


@router.delete("/subjects/{id}", response_model=MessageResponse)
async def delete_subject(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await _require_subject_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_subject(id, actor=current_user.email, ip=_get_client_ip(request))
        return MessageResponse(status="success", message="Subject deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        logger.error("Failed to delete subject %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ---------------------------------------------------------------------------
# Classrooms
# ---------------------------------------------------------------------------


@router.post("/classrooms/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
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
@_handle_generic_err
async def create_classroom(
    data: ClassroomCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_classroom(data.name, data.building, tenant_id=tenant_id)


@router.put("/classrooms/{id}", response_model=ClassroomResponse)
@_handle_generic_err
async def update_classroom(
    id: str,
    data: ClassroomUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await _require_classroom_in_tenant(id, tenant_id)
    return await admin_service.update_classroom(id, data.model_dump(exclude_unset=True))


@router.delete("/classrooms/{id}", response_model=MessageResponse)
async def delete_classroom(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await _require_classroom_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_classroom(id, actor=current_user.email, ip=_get_client_ip(request))
        return MessageResponse(status="success", message="Classroom deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        logger.error("Failed to delete classroom %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ---------------------------------------------------------------------------
# Designations
# ---------------------------------------------------------------------------


@router.post("/designations/bulk", response_model=BulkImportResponse, status_code=status.HTTP_200_OK)
@_handle_generic_err
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
        ip=_get_client_ip(request),
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
    desig = await admin_service.get_designation_by_id(id, tenant_id=tenant_id)
    if not desig:
        raise HTTPException(status_code=404, detail="Designation not found")
    return desig


@router.post("/designations", response_model=DesignationResponse)
@_handle_generic_err
async def create_designation(
    data: DesignationCreate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.create_designation(data.name, data.code, data.description, tenant_id=tenant_id)


@router.put("/designations/{id}", response_model=DesignationResponse)
@_handle_generic_err
async def update_designation(
    id: str,
    data: DesignationUpdate,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    await _require_designation_in_tenant(id, tenant_id)
    return await admin_service.update_designation(id, data.model_dump(exclude_unset=True))


@router.delete("/designations/{id}", response_model=MessageResponse)
async def delete_designation(
    id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
) -> MessageResponse:
    await _require_designation_in_tenant(id, tenant_id)
    try:
        await admin_service.delete_designation(id, actor=current_user.email, ip=_get_client_ip(request))
        return MessageResponse(status="success", message="Designation deleted successfully")
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        logger.error("Failed to delete designation %s: %s", id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


# ---------------------------------------------------------------------------
# Audit Logs & Stats
# ---------------------------------------------------------------------------


@router.get(
    "/audit",
    response_model=PaginatedResponse[AuditLogResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_audit_logs(
    page: int = 1,
    page_size: int = 20,
    sort_by: str | None = None,
    sort_order: str = "desc",
    q: str | None = None,
    severity: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_audit_logs(
        page=page,
        page_size=min(page_size, 100),
        sort_by=sort_by,
        sort_order=sort_order,
        q=q,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        tenant_id=tenant_id,
    )


@router.get("/audit/export", dependencies=[Depends(rate_limiter(requests_limit=10, window_seconds=60))])
async def export_audit_logs(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    csv_data = await admin_service.export_audit_logs_csv(tenant_id=tenant_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=system-audit-logs.csv"},
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_stats(tenant_id=tenant_id)


# ---------------------------------------------------------------------------
# Absentee Scan
# ---------------------------------------------------------------------------


@router.post("/scan-absentees", response_model=list[AbsenteeAnomalyItem], status_code=status.HTTP_200_OK)
async def scan_absentee_anomalies(
    contamination: float = 0.10,
    tenant_id: str = Depends(get_tenant_context),
    attendance_repo: AttendanceRepository = Depends(),
) -> list[AbsenteeAnomalyItem]:
    records = await attendance_repo.get_all_absences(tenant_id=tenant_id)
    if not records or len(records) < 5:
        return []

    student_map = {}
    for r in records:
        student = getattr(r, "student", None)
        if student:
            first_name = getattr(student, "firstName", "") or ""
            last_name = getattr(student, "lastName", "") or ""
            full_name = f"{first_name} {last_name}".strip() or "Unknown Student"
            student_map[getattr(r, "studentId", "")] = {
                "student_name": full_name,
                "enrollment_number": getattr(student, "enrollmentNumber", "N/A"),
            }

    rows = []
    for r in records:
        session = getattr(r, "session", None)
        created_at = getattr(r, "createdAt", None)
        if session and getattr(session, "sessionDate", None):
            day_str = session.sessionDate.strftime("%A")
        elif created_at:
            day_str = created_at.strftime("%A")
        else:
            day_str = "Monday"
        rows.append(
            {
                "student_id": getattr(r, "studentId", ""),
                "status": getattr(r, "status", "Absent"),
                "day_of_week": day_str,
            }
        )

    try:
        flagged = await run_absentee_scan(attendance_records=rows, contamination=contamination)
        for item in flagged:
            s_id = item.get("student_id")
            s_info = student_map.get(s_id, {})
            item["student_name"] = s_info.get("student_name", "Unknown Student")
            item["enrollment_number"] = s_info.get("enrollment_number", "N/A")
        return [AbsenteeAnomalyItem.model_validate(item) for item in flagged]
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Outlier pattern extraction failed: {str(err)}"
        )


# ---------------------------------------------------------------------------
# System Config — scoped to tenant
# ---------------------------------------------------------------------------
from app.schemas.system_config import SystemConfigResponse, SystemConfigUpdate
from app.services.system_config_service import SystemConfigService


@router.get("/config", response_model=SystemConfigResponse, response_model_by_alias=True)
async def get_system_config(
    tenant_id: str = Depends(get_tenant_context),
    config_service: SystemConfigService = Depends(),
):
    return await config_service.get_config(tenant_id=tenant_id)


@router.patch("/config", response_model=SystemConfigResponse, response_model_by_alias=True)
async def update_system_config(
    data: SystemConfigUpdate,
    tenant_id: str = Depends(get_tenant_context),
    config_service: SystemConfigService = Depends(),
):
    return await config_service.update_config(
        tenant_id=tenant_id,
        is_face_recognition_enabled=data.is_face_recognition_enabled,
        is_gps_verification_enabled=data.is_gps_verification_enabled,
        is_ai_background_validation_enabled=data.is_ai_background_validation_enabled,
    )


# ---------------------------------------------------------------------------
# License Requests — scoped to tenant
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Biometrics Purge
# ---------------------------------------------------------------------------


@router.post("/biometrics/purge-photos")
async def purge_biometric_photos(
    retention_days: int = 30,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    from app.services.biometric_consent_service import BiometricConsentService

    service = BiometricConsentService()
    result = await service.purge_attendance_photos(retention_days=retention_days, tenant_id=tenant_id)
    await admin_service._log_action(
        "PURGE_BIOMETRICS",
        "WARN",
        actor=current_user.email,
        target="attendance_photos",
        description=f"Purged raw photos for records older than {retention_days} days (Count: {result['purged_count']})",
        tenant_id=tenant_id,
    )
    return result
