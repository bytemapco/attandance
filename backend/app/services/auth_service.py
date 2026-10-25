import json
import secrets
from typing import Optional, Dict, Any

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.security import hash_password, verify_password, create_access_token
from app.db.client import db
from app.db.redis import get_redis
from app.repositories.user_repo import UserRepository
from app.repositories.student_repo import StudentRepository
from app.repositories.teacher_repo import TeacherRepository
from app.schemas.auth import Token, UserLogin
from app.schemas.student import StudentCreate, StudentResponse
from app.schemas.teacher import TeacherCreate, TeacherResponse
from app.services.email_service import email_service

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

        if not user or not verify_password(login_data.password, user.hashedPassword):
            return None

        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please complete onboarding or contact administrator.",
            )

        if user.role == "STUDENT":
            student = await self.student_repo.get_by_user_id(user.id)
            if student and login_data.device_uuid:
                if not student.deviceUuid:
                    await db.student.update(where={"id": student.id}, data={"deviceUuid": login_data.device_uuid})
                elif student.deviceUuid != login_data.device_uuid:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account is bound to another device. Please submit a device change request.",
                    )

        tid = getattr(user, "tenantId", None)
        tenant_slug, tenant_name = None, None
        if tid:
            t = await db.tenant.find_unique(where={"id": tid})
            if t:
                if t.status != "ACTIVE":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Institution account '{t.name}' is currently {t.status.lower()}. Please contact system administration.",
                    )
                tenant_slug, tenant_name = t.slug, t.name

        token = create_access_token(
            subject=user.id,
            role=user.role,
            extra_data={"tid": tid, "tenant_id": tid} if tid else None,
        )
        return Token(
            access_token=token,
            token_type="bearer",
            role=user.role,
            must_change_password=getattr(user, "mustChangePassword", False),
            tenant_id=tid,
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

    async def register_student(self, data: StudentCreate) -> Optional[StudentResponse]:
        if await self.user_repo.get_by_email(data.email):
            return None
        hashed = hash_password(data.password)
        user = await self.user_repo.create(email=data.email, password_hash=hashed, role="STUDENT")
        student = await self.student_repo.create(user_id=user.id, enrollment=data.enrollment_number)
        return StudentResponse(
            id=student.id, user_id=user.id, enrollment_number=student.enrollmentNumber, email=user.email
        )

    async def register_teacher(self, data: TeacherCreate) -> Optional[TeacherResponse]:
        if await self.user_repo.get_by_email(data.email):
            return None
        hashed = hash_password(data.password)
        user = await self.user_repo.create(email=data.email, password_hash=hashed, role="TEACHER")
        teacher = await self.teacher_repo.create(
            user_id=user.id, department=data.department_id, designation=data.designation_id
        )
        return TeacherResponse(
            id=teacher.id,
            user_id=user.id,
            department=teacher.department,
            designation=teacher.designation,
            email=user.email,
        )

    async def create_invitation_token(self, user_id: str, email: str, role: str, name: str) -> str:
        token = secrets.token_urlsafe(32)
        ttl = settings.INVITATION_TOKEN_EXPIRE_HOURS * 3600
        payload = {"user_id": user_id, "email": email, "role": role, "name": name}
        redis = get_redis()
        await redis.setex(f"invite:{token}", ttl, json.dumps(payload))
        return token

    async def verify_invitation_token(self, token: str) -> Optional[Dict[str, Any]]:
        redis = get_redis()
        data = await redis.get(f"invite:{token}")
        if not data:
            return None
        return json.loads(data)

    async def complete_onboarding(self, token: str, password: str) -> bool:
        data = await self.verify_invitation_token(token)
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invitation link.")

        user_id = data["user_id"]
        hashed = hash_password(password)
        await db.user.update(
            where={"id": user_id},
            data={"hashedPassword": hashed, "isActive": True},
        )
        redis = get_redis()
        await redis.delete(f"invite:{token}")
        logger.info("Onboarding completed successfully: user_id=%s email=%s", user_id, data.get("email"))
        return True

    async def request_password_reset(self, email: str, frontend_url: Optional[str] = None) -> bool:
        clean_email = email.strip().lower()
        user = await self.user_repo.get_by_email(clean_email)
        if not user:
            # Avoid leaking user existence, return True
            return True

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
        redis = get_redis()
        await redis.setex(f"reset:{token}", ttl, json.dumps(payload))

        await email_service.send_password_reset_email(
            to_email=user.email,
            recipient_name=name,
            reset_token=token,
            role=user.role,
            frontend_url=frontend_url,
        )
        return True

    async def verify_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        redis = get_redis()
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
        redis = get_redis()
        await redis.delete(f"reset:{token}")
        logger.info("Password reset successfully: user_id=%s", user_id)
        return True
