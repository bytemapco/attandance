"""The signed-in user's profile for GET /auth/me."""
from typing import Optional

from fastapi import HTTPException, status
from prisma.models import User

from app.db.client import db
from app.repositories.student_repository import StudentRepository
from app.schemas.auth import StudentProfileBrief, TeacherProfileBrief, UserProfileResponse
from app.services.class_management.common import STUDENT_CLASS_INCLUDE, class_semester


async def _student_profile(user: User) -> Optional[StudentProfileBrief]:
    student = await db.student.find_unique(
        where={"userId": user.id}, include={"department": True, "classMemberships": STUDENT_CLASS_INCLUDE}
    )
    if not student:
        return None
    embedding = await StudentRepository().get_face_embedding(student.id)
    return StudentProfileBrief(
        id=student.id,
        enrollment_number=student.enrollmentNumber,
        first_name=student.firstName,
        last_name=student.lastName,
        phone=student.phone,
        gender=student.gender,
        semester=class_semester(student),
        batch=student.batch,
        batch_id=student.batchId,
        department_id=student.departmentId,
        department_name=student.department.name if student.department else None,
        face_registered=embedding is not None and len(embedding) > 0,
    )


async def _teacher_profile(user: User) -> Optional[TeacherProfileBrief]:
    teacher = await db.teacher.find_unique(
        where={"userId": user.id}, include={"department": True, "designation": True}
    )
    if not teacher:
        return None
    return TeacherProfileBrief(
        id=teacher.id,
        department=teacher.department.name if teacher.department else "",
        designation=teacher.designation.name if teacher.designation else "",
        employee_id=teacher.employeeId,
        first_name=teacher.firstName,
        last_name=teacher.lastName,
        department_id=teacher.departmentId,
        designation_id=teacher.designationId,
    )


async def _tenant_labels(user: User) -> tuple[Optional[str], Optional[str]]:
    """(slug, name) of the user's institution. Everyone but a super admin is refused while it is not active."""
    if not user.tenantId:
        return None, None
    tenant = await db.tenant.find_unique(where={"id": user.tenantId})
    if not tenant:
        return None, None
    if user.role != "SUPER_ADMIN" and tenant.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant account for '{tenant.name}' is currently {tenant.status.lower()}.",
        )
    return tenant.slug, tenant.name


async def build_profile(user: User) -> UserProfileResponse:
    student_profile = await _student_profile(user) if user.role == "STUDENT" else None
    teacher_profile = await _teacher_profile(user) if user.role == "TEACHER" else None
    tenant_slug, tenant_name = await _tenant_labels(user)
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.isActive,
        must_change_password=user.mustChangePassword,
        tenant_id=user.tenantId,
        tenant_slug=tenant_slug,
        tenant_name=tenant_name,
        student_profile=student_profile,
        teacher_profile=teacher_profile,
    )
