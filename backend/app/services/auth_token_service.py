import json
import secrets
from typing import Optional, Dict, Any

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.security import hash_password
from app.db.client import db
from app.db.redis import safe_redis
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.services.email_service import email_service

logger = get_logger("app.services.auth_tokens")


class AuthTokenService:
    def __init__(
        self,
        user_repo: Optional[UserRepository] = None,
        student_repo: Optional[StudentRepository] = None,
    ) -> None:
        self.user_repo = user_repo or UserRepository()
        self.student_repo = student_repo or StudentRepository()

    @staticmethod
    def _require_redis():
        r = safe_redis()
        if not r:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication cache service temporarily unavailable. Please retry shortly.",
            )
        return r

    async def create_invitation_token(self, user_id: str, email: str, role: str, name: str) -> str:
        token = secrets.token_urlsafe(32)
        ttl = settings.INVITATION_TOKEN_EXPIRE_HOURS * 3600
        payload = {"user_id": user_id, "email": email, "role": role, "name": name}
        redis = self._require_redis()
        await redis.setex(f"invite:{token}", ttl, json.dumps(payload))
        return token

    async def verify_invitation_token(self, token: str) -> Optional[Dict[str, Any]]:
        redis = self._require_redis()
        data = await redis.get(f"invite:{token}")
        if not data:
            return None
        return json.loads(data)

    async def complete_onboarding(self, token: str, password: str) -> bool:
        data = await self.verify_invitation_token(token)
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invitation link.")

        user_id = data["user_id"]
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account not found.")
        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been disabled. Contact your administrator.",
            )

        hashed = hash_password(password)
        await db.user.update(
            where={"id": user_id},
            data={"hashedPassword": hashed, "isActive": True, "mustChangePassword": False},
        )
        redis = self._require_redis()
        await redis.delete(f"invite:{token}")
        logger.info("Onboarding completed successfully: user_id=%s email=%s", user_id, data.get("email"))
        return True

    async def request_password_reset(self, email: str, frontend_url: Optional[str] = None) -> bool:
        clean_email = email.strip().lower()
        user = await self.user_repo.get_by_email(clean_email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account is registered with this email.")
        if not user.isActive:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is disabled. Contact your administrator.")

        name = "User"
        if user.role == "STUDENT":
            st = await self.student_repo.get_by_user_id(user.id)
            if st and st.firstName:
                name = f"{st.firstName} {st.lastName or ''}".strip()
        elif user.role == "TEACHER":
            tc = await db.teacher.find_unique(where={"userId": user.id})
            if tc and tc.firstName:
                name = f"{tc.firstName} {tc.lastName or ''}".strip()
        elif user.role == "ADMIN":
            name = "Administrator"

        token = secrets.token_urlsafe(32)
        ttl = settings.RESET_TOKEN_EXPIRE_MINUTES * 60
        payload = {"user_id": user.id, "email": user.email, "role": user.role, "name": name}
        redis = self._require_redis()
        await redis.setex(f"reset:{token}", ttl, json.dumps(payload))

        try:
            sent = await email_service.send_password_reset_email(
                to_email=user.email,
                recipient_name=name,
                reset_token=token,
                role=user.role,
                frontend_url=frontend_url,
            )
        except Exception:
            logger.exception("Password reset email delivery raised an unexpected error")
            sent = False
        if not sent:
            try:
                await redis.delete(f"reset:{token}")
            except Exception:
                logger.exception("Failed to remove an undelivered password reset token")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="We could not send the reset email. Please try again later or contact support.",
            )
        return True

    async def verify_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        redis = self._require_redis()
        data = await redis.get(f"reset:{token}")
        if not data:
            return None
        return json.loads(data)

    async def reset_password(self, token: str, new_password: str) -> bool:
        data = await self.verify_reset_token(token)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset link."
            )

        user_id = data["user_id"]
        hashed = hash_password(new_password)
        await db.user.update(
            where={"id": user_id},
            data={"hashedPassword": hashed, "mustChangePassword": False},
        )
        redis = self._require_redis()
        await redis.delete(f"reset:{token}")
        logger.info("Password reset successfully: user_id=%s", user_id)
        return True
