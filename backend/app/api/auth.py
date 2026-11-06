from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from prisma.models import User

from app.api.dependencies import get_current_user, reusable_oauth2
from app.core.logging_config import get_logger
from app.core.rate_limit import limit_auth_attempts
from app.core.security import decode_access_token
from app.core.url_resolver import resolve_frontend_url
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
)
from app.schemas.common import MessageResponse
from app.schemas.system_config import SystemConfigResponse
from app.services.auth_service import AuthService
from app.services.device_change_service import DeviceChangeService
from app.services.profile_service import build_profile
from app.services.system_config_service import SystemConfigService
from app.services.token_revocation import revoke

logger = get_logger("app.api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, request: Request, auth_service: AuthService = Depends()) -> Token:
    await limit_auth_attempts(request, "login", f"{login_data.tenant_slug or ''}:{login_data.email}")
    token = await auth_service.authenticate(login_data)
    if not token:
        logger.warning("Failed login: %s", login_data.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(payload: RefreshTokenRequest, auth_service: AuthService = Depends()) -> Token:
    return await auth_service.refresh(payload.refresh_token)


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    return await build_profile(current_user)


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
    remaining = payload.get("exp", 0) - int(datetime.now(timezone.utc).timestamp()) if payload else 0
    if remaining > 0:
        await revoke(token, remaining)
        logger.info("Token revoked: user=%s", payload.get("sub"))
    return MessageResponse(status="success", message="Successfully logged out.")


@router.post("/request-device-change", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def request_device_change(
    data: DeviceChangeRequestCreate,
    request: Request,
    device_change_service: DeviceChangeService = Depends(),
) -> MessageResponse:
    await limit_auth_attempts(request, "device-change", data.email)
    await device_change_service.request_device_change(data)
    return MessageResponse(status="success", message="Device change request submitted successfully.")


@router.post("/forgot-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    auth_service: AuthService = Depends(),
) -> MessageResponse:
    await limit_auth_attempts(request, "forgot-password", data.email)
    frontend_url = resolve_frontend_url(request)
    await auth_service.request_password_reset(data.email, frontend_url=frontend_url)
    return MessageResponse(
        status="success", message="Password reset link sent. Check your inbox."
    )


@router.post("/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def reset_password(
    data: ResetPasswordRequest,
    request: Request,
    auth_service: AuthService = Depends(),
) -> MessageResponse:
    await limit_auth_attempts(request, "reset-password", data.token)
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
    await limit_auth_attempts(request, "onboarding", data.token)
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
