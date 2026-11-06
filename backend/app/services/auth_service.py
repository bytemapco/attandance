from typing import Optional, Dict, Any

from fastapi import HTTPException, status
from prisma.models import User

from app.core.logging_config import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.db.client import db
from app.db.redis import safe_redis
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.auth import Token, UserLogin
from app.services.auth_token_service import AuthTokenService
from app.services.login_lockout import FAILED_LOGIN_PREFIX, clear_failures, count_failure, reject_if_locked
from app.services.login_identity import find_candidate_users, pick_user_by_password
from app.services.token_revocation import REFRESH_TOKEN, REFRESH_TOKEN_TTL_SECONDS, ensure_not_revoked, revoke

logger = get_logger("app.services.auth")


async def _tenant_labels(tenant_id: Optional[str], inactive_hint: str) -> tuple[Optional[str], Optional[str]]:
    """(slug, name) of the user's institution; 403 while it is suspended or expired."""
    if not tenant_id:
        return None, None
    tenant = await db.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        return None, None
    if tenant.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Institution account '{tenant.name}' is currently {tenant.status.lower()}.{inactive_hint}",
        )
    return tenant.slug, tenant.name


async def _issue_tokens(user: User, inactive_tenant_hint: str = "") -> Token:
    tenant_id = user.tenantId
    tenant_slug, tenant_name = await _tenant_labels(tenant_id, inactive_tenant_hint)
    return Token(
        access_token=create_access_token(
            subject=user.id,
            role=user.role,
            extra_data={"tid": tenant_id, "tenant_id": tenant_id} if tenant_id else None,
        ),
        refresh_token=create_refresh_token(subject=user.id, role=user.role),
        token_type="bearer",
        role=user.role,
        must_change_password=user.mustChangePassword,
        tenant_id=tenant_id,
        tenant_slug=tenant_slug,
        tenant_name=tenant_name,
    )


class AuthService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()
        self.student_repo = StudentRepository()
        self.tokens = AuthTokenService(self.user_repo, self.student_repo)

    async def authenticate(self, login_data: UserLogin) -> Optional[Token]:
        identifier = login_data.email.strip()
        login_key = f"{FAILED_LOGIN_PREFIX}{login_data.tenant_slug or ''}:{identifier.lower()}"
        redis = safe_redis()

        await reject_if_locked(redis, login_key)
        candidates = await find_candidate_users(identifier, login_data.tenant_slug)
        user = await pick_user_by_password(candidates, login_data.password)
        if not user:
            await count_failure(redis, login_key)
            return None
        await clear_failures(redis, login_key)

        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please complete onboarding or contact administrator.",
            )
        if user.role == "STUDENT":
            await self._check_device(user.id, login_data.device_uuid)
        return await _issue_tokens(user, inactive_tenant_hint=" Please contact system administration.")

    async def refresh(self, refresh_token: str) -> Token:
        """Exchanges a refresh token for a new pair; the old refresh token can no longer be used."""
        decoded = decode_access_token(refresh_token)
        if not decoded or decoded.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        await ensure_not_revoked(refresh_token, REFRESH_TOKEN)
        user = await self.user_repo.get_by_id(decoded.get("sub"))
        if not user or not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        tokens = await _issue_tokens(user)
        await revoke(refresh_token, REFRESH_TOKEN_TTL_SECONDS)
        return tokens

    async def _check_device(self, user_id: str, device_uuid: Optional[str]) -> None:
        """A student's account is bound to the first device that signs in."""
        student = await self.student_repo.get_by_user_id(user_id)
        if not student:
            return
        if not student.deviceUuid:
            if device_uuid:
                await db.student.update(where={"id": student.id}, data={"deviceUuid": device_uuid})
            return
        if not device_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Device UUID is required for this student account."
            )
        if student.deviceUuid != device_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is bound to another device. Please submit a device change request.",
            )

    async def change_password(self, user_id: str, new_password: str, current_password: Optional[str] = None) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        must_change = getattr(user, "mustChangePassword", False)
        if not must_change:
            if not current_password or not await verify_password(current_password, user.hashedPassword):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
        elif current_password:
            if not await verify_password(current_password, user.hashedPassword):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Temporary password is incorrect.")

        hashed = await hash_password(new_password)
        await db.user.update(
            where={"id": user_id},
            data={"hashedPassword": hashed, "mustChangePassword": False},
        )
        return True

    async def create_invitation_token(self, user_id: str, email: str, role: str, name: str) -> str:
        return await self.tokens.create_invitation_token(user_id, email, role, name)

    async def verify_invitation_token(self, token: str) -> Optional[Dict[str, Any]]:
        return await self.tokens.verify_invitation_token(token)

    async def complete_onboarding(self, token: str, password: str) -> bool:
        return await self.tokens.complete_onboarding(token, password)

    async def request_password_reset(self, email: str, frontend_url: Optional[str] = None) -> bool:
        return await self.tokens.request_password_reset(email, frontend_url)

    async def verify_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        return await self.tokens.verify_reset_token(token)

    async def reset_password(self, token: str, new_password: str) -> bool:
        return await self.tokens.reset_password(token, new_password)
