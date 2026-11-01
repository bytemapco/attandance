from typing import Optional, Dict, Any

from fastapi import HTTPException, status

from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_incr_expire
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.db.client import db
from app.db.redis import safe_redis
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository
from app.schemas.auth import Token, UserLogin

logger = get_logger("app.services.auth")


class AuthService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()
        self.student_repo = StudentRepository()
        self.teacher_repo = TeacherRepository()

    async def authenticate(self, login_data: UserLogin) -> Optional[Token]:
        identifier = login_data.email.strip()
        user = None
        if "@" in identifier:
            user = await self.user_repo.get_by_email(identifier.lower())
        else:
            student = await self.student_repo.get_by_enrollment(identifier)
            if student and student.user:
                user = student.user
            else:
                teacher = await self.teacher_repo.get_by_employee_id(identifier)
                user = (
                    teacher.user
                    if (teacher and teacher.user)
                    else await self.user_repo.get_by_email(identifier.lower())
                )

        login_key = f"failed_login:{identifier.lower()}"
        redis = safe_redis()

        if redis:
            try:
                failed_attempts = await redis.get(login_key)
                if failed_attempts and int(failed_attempts) >= 5:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.",
                    )
            except HTTPException:
                raise
            except Exception as exc:
                logger.warning("Redis failed login check error: %s", exc)

        if not user or not verify_password(login_data.password, user.hashedPassword):
            if redis:
                try:
                    await atomic_incr_expire(redis, login_key, 900)
                except Exception as exc:
                    logger.warning("Redis increment failed login error: %s", exc)
            return None

        if redis:
            try:
                await redis.delete(login_key)
            except Exception:
                pass

        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please complete onboarding or contact administrator.",
            )

        if user.role == "STUDENT":
            student = await self.student_repo.get_by_user_id(user.id)
            if student:
                if student.deviceUuid:
                    if not login_data.device_uuid:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Device UUID is required for this student account.",
                        )
                    if student.deviceUuid != login_data.device_uuid:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is bound to another device. Please submit a device change request.",
                        )
                elif login_data.device_uuid:
                    await db.student.update(where={"id": student.id}, data={"deviceUuid": login_data.device_uuid})

        tenant_id = getattr(user, "tenantId", None)
        tenant_slug, tenant_name = None, None
        if tenant_id:
            tenant_record = await db.tenant.find_unique(where={"id": tenant_id})
            if tenant_record:
                if tenant_record.status != "ACTIVE":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Institution account '{tenant_record.name}' is currently {tenant_record.status.lower()}. Please contact system administration.",
                    )
                tenant_slug, tenant_name = tenant_record.slug, tenant_record.name

        token = create_access_token(
            subject=user.id,
            role=user.role,
            extra_data={"tid": tenant_id, "tenant_id": tenant_id} if tenant_id else None,
        )
        refresh_token = create_refresh_token(subject=user.id, role=user.role)
        return Token(
            access_token=token,
            refresh_token=refresh_token,
            token_type="bearer",
            role=user.role,
            must_change_password=getattr(user, "mustChangePassword", False),
            tenant_id=tenant_id,
            tenant_slug=tenant_slug,
            tenant_name=tenant_name,
        )

    async def change_password(self, user_id: str, new_password: str, current_password: Optional[str] = None) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        must_change = getattr(user, "mustChangePassword", False)
        if not must_change:
            if not current_password or not verify_password(current_password, user.hashedPassword):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
        elif current_password:
            if not verify_password(current_password, user.hashedPassword):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Temporary password is incorrect.")

        hashed = hash_password(new_password)
        await db.user.update(
            where={"id": user_id},
            data={"hashedPassword": hashed, "mustChangePassword": False},
        )
        return True

    async def create_invitation_token(self, user_id: str, email: str, role: str, name: str) -> str:
        from app.services.auth_token_service import AuthTokenService
        return await AuthTokenService(self.user_repo, self.student_repo).create_invitation_token(user_id, email, role, name)

    async def verify_invitation_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.services.auth_token_service import AuthTokenService
        return await AuthTokenService(self.user_repo, self.student_repo).verify_invitation_token(token)

    async def complete_onboarding(self, token: str, password: str) -> bool:
        from app.services.auth_token_service import AuthTokenService
        return await AuthTokenService(self.user_repo, self.student_repo).complete_onboarding(token, password)

    async def request_password_reset(self, email: str, frontend_url: Optional[str] = None) -> bool:
        from app.services.auth_token_service import AuthTokenService
        return await AuthTokenService(self.user_repo, self.student_repo).request_password_reset(email, frontend_url)

    async def verify_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        from app.services.auth_token_service import AuthTokenService
        return await AuthTokenService(self.user_repo, self.student_repo).verify_reset_token(token)

    async def reset_password(self, token: str, new_password: str) -> bool:
        from app.services.auth_token_service import AuthTokenService
        return await AuthTokenService(self.user_repo, self.student_repo).reset_password(token, new_password)
