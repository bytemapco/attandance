from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.models import User

from app.api.dependencies import get_current_user, reusable_oauth2, auth_rate_limit
from app.core.logging_config import get_logger
from app.core.security import decode_access_token, create_access_token, create_refresh_token
from app.core.url_resolver import resolve_frontend_url
from app.db.client import db
from app.db.redis import get_redis
from app.repositories.student_repository import StudentRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    Token,
    RefreshTokenRequest,
    UserLogin,
    UserProfileResponse,
    DeviceChangeRequestCreate,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    CompleteOnboardingRequest,
    VerifyTokenResponse,
    ChangePasswordRequest,
    StudentProfileBrief,
    TeacherProfileBrief,
)
from app.schemas.common import MessageResponse
from app.schemas.system_config import SystemConfigResponse
from app.services.auth_service import AuthService
from app.services.device_change_service import DeviceChangeService
from app.services.system_config_service import SystemConfigService

logger = get_logger("app.api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, request: Request, auth_service: AuthService = Depends()) -> Token:
    await auth_rate_limit(request)
    token = await auth_service.authenticate(login_data)
    if not token:
        logger.warning("Failed login: %s", login_data.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(payload: RefreshTokenRequest) -> Token:
    decoded = decode_access_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    r = await get_redis()
    if await r.get(f"denylist:{payload.refresh_token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decoded.get("sub")
    user = await UserRepository().get_by_id(user_id)
    if not user or not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tid = getattr(user, "tenantId", None)
    tenant_slug, tenant_name = None, None
    if tid:
        t = await db.tenant.find_unique(where={"id": tid})
        if t:
            if t.status != "ACTIVE":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Institution account '{t.name}' is currently {t.status.lower()}.",
                )
            tenant_slug, tenant_name = t.slug, t.name

    new_access_token = create_access_token(
        subject=user.id,
        role=user.role,
        extra_data={"tid": tid, "tenant_id": tid} if tid else None,
    )
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

    # Invalidate previous refresh token
    await r.setex(f"denylist:{payload.refresh_token}", 7 * 86400, "1")

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        role=user.role,
        must_change_password=getattr(user, "mustChangePassword", False),
        tenant_id=tid,
        tenant_slug=tenant_slug,
        tenant_name=tenant_name,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    student_profile = None
    teacher_profile = None

    if current_user.role == "STUDENT":
        student = await db.student.find_unique(
            where={"userId": current_user.id},
            include={"department": True},
        )
        if student:
            embedding = await StudentRepository().get_face_embedding(student.id)
            student_profile = StudentProfileBrief(
                id=student.id,
                enrollment_number=student.enrollmentNumber,
                first_name=student.firstName,
                last_name=student.lastName,
                phone=student.phone,
                gender=student.gender,
                branch=student.branch,
                semester=student.semester,
                batch=student.batch,
                department_id=student.departmentId,
                department_name=student.department.name if student.department else None,
                face_registered=embedding is not None and len(embedding) > 0,
            )
    elif current_user.role == "TEACHER":
        teacher = await db.teacher.find_unique(where={"userId": current_user.id})
        if teacher:
            teacher_profile = TeacherProfileBrief(
                id=teacher.id,
                department=teacher.department.name if teacher.department else "",
                designation=teacher.designation.name if teacher.designation else "",
                employee_id=teacher.employeeId,
                first_name=teacher.firstName,
                last_name=teacher.lastName,
                department_id=teacher.departmentId,
                designation_id=teacher.designationId,
            )

    tid = getattr(current_user, "tenantId", None)
    tenant_slug, tenant_name = None, None
    if tid:
        t = await db.tenant.find_unique(where={"id": tid})
        if t:
            if current_user.role != "SUPER_ADMIN" and t.status != "ACTIVE":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Tenant account for '{t.name}' is currently {t.status.lower()}.",
                )
            tenant_slug, tenant_name = t.slug, t.name

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.isActive,
        must_change_password=getattr(current_user, "mustChangePassword", False),
        tenant_id=tid,
        tenant_slug=tenant_slug,
        tenant_name=tenant_name,
        student_profile=student_profile,
        teacher_profile=teacher_profile,
    )


@router.post("/change-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(),
) -> MessageResponse:
    await auth_service.change_password(
        user_id=current_user.id,
        new_password=data.new_password,
        current_password=data.current_password,
    )
    return MessageResponse(status="success", message="Password updated successfully.")


@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def logout(token: str = Depends(reusable_oauth2)) -> MessageResponse:
    payload = decode_access_token(token)
    if payload:
        exp = payload.get("exp")
        if exp:
            ttl = exp - int(datetime.now(timezone.utc).timestamp())
            if ttl > 0:
                try:
                    await get_redis().setex(f"denylist:{token}", ttl, "revoked")
                    logger.info("Token revoked: user=%s", payload.get("sub"))
                except Exception as cache_err:
                    logger.warning("Failed to add token to Redis denylist: %s", cache_err)
    return MessageResponse(status="success", message="Successfully logged out.")


@router.post("/request-device-change", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def request_device_change(
    data: DeviceChangeRequestCreate,
    request: Request,
    device_change_service: DeviceChangeService = Depends(),
) -> MessageResponse:
    await auth_rate_limit(request)
    await device_change_service.request_device_change(data)
    return MessageResponse(status="success", message="Device change request submitted successfully.")


@router.post("/forgot-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    auth_service: AuthService = Depends(),
) -> MessageResponse:
    await auth_rate_limit(request)
    frontend_url = resolve_frontend_url(request)
    await auth_service.request_password_reset(data.email, frontend_url=frontend_url)
    return MessageResponse(
        status="success", message="If the email is registered, a password reset link has been dispatched."
    )


@router.post("/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def reset_password(
    data: ResetPasswordRequest,
    request: Request,
    auth_service: AuthService = Depends(),
) -> MessageResponse:
    await auth_rate_limit(request)
    await auth_service.reset_password(token=data.token, new_password=data.new_password)
    return MessageResponse(
        status="success", message="Password reset successfully. You can now login with your new credentials."
    )


@router.get("/verify-token", response_model=VerifyTokenResponse)
async def verify_token(
    token: str,
    token_type: str = "invite",
    auth_service: AuthService = Depends(),
) -> VerifyTokenResponse:
    if token_type == "invite":
        data = await auth_service.verify_invitation_token(token)
    elif token_type == "reset":
        data = await auth_service.verify_reset_token(token)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type.")

    if not data:
        return VerifyTokenResponse(valid=False, message="Link has expired or is invalid.")
    return VerifyTokenResponse(
        valid=True,
        email=data.get("email"),
        role=data.get("role"),
        name=data.get("name"),
    )


@router.post("/complete-onboarding", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def complete_onboarding(
    data: CompleteOnboardingRequest,
    request: Request,
    auth_service: AuthService = Depends(),
) -> MessageResponse:
    await auth_rate_limit(request)
    await auth_service.complete_onboarding(token=data.token, password=data.password)
    return MessageResponse(status="success", message="Account onboarding completed. You may now login.")


@router.get("/config", response_model=SystemConfigResponse, response_model_by_alias=True)
async def get_public_system_config(
    request: Request,
    tenant_id: Optional[str] = None,
    config_service: SystemConfigService = Depends(),
):
    tid = tenant_id or request.headers.get("X-Tenant-ID")
    return await config_service.get_config(tenant_id=tid)


@router.get("/sso/config")
async def get_sso_config(tenant_slug: str):
    from app.services.sso_service import SSOService

    try:
        return await SSOService.get_tenant_sso_config(tenant_slug)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.post("/sso/saml/acs")
async def saml_assertion_consumer(
    request: Request,
    tenant_id: Optional[str] = None,
):
    from app.services.sso_service import SSOService

    form_data = await request.form()
    saml_response = form_data.get("SAMLResponse")
    if not saml_response:
        try:
            body = await request.json()
            saml_response = body.get("SAMLResponse")
        except Exception:
            saml_response = None

    if not saml_response:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'SAMLResponse' in payload.")

    try:
        return await SSOService.process_saml_assertion(str(saml_response), tenant_id=tenant_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(err))
