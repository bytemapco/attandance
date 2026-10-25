from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from prisma.models import User, Student, Teacher

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.security import decode_access_token
from app.db.redis import get_redis
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.teacher_repository import TeacherRepository

logger = get_logger("app.auth")

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

_UNAUTHORIZED = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
_FORBIDDEN = {"STUDENT": "Access forbidden: Students only", "TEACHER": "Access forbidden: Teachers only"}
_INACTIVE = "User account is inactive or disabled"


async def _check_token_revoked(token: str) -> None:
    try:
        r = await get_redis()
        if await r.get(f"denylist:{token}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Could not check token revocation denylist in Redis: %s", exc)


async def _validate_token_payload(token: str) -> dict:
    await _check_token_revoked(token)
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Subject not found in token",
        )
    return payload


async def get_current_user(token: str = Depends(reusable_oauth2)) -> User:
    payload = await _validate_token_payload(token)
    user_id = payload.get("sub")
    user = await UserRepository().get_by_id(user_id)
    if not user or not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_INACTIVE,
        )
    return user


async def get_current_student(current_user: User = Depends(get_current_user)) -> Student:
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=_FORBIDDEN["STUDENT"])
    student = await StudentRepository().get_by_user_id(current_user.id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return student


async def get_current_teacher(current_user: User = Depends(get_current_user)) -> Teacher:
    if current_user.role != "TEACHER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=_FORBIDDEN["TEACHER"])
    teacher = await TeacherRepository().get_by_user_id(current_user.id)
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher profile not found")
    return teacher


class RoleChecker:
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "SUPER_ADMIN":
            return current_user
        if "ADMIN" in self.allowed_roles and current_user.role in ("ADMIN", "TENANT_ADMIN"):
            return current_user
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Insufficient permissions",
            )
        return current_user


async def get_current_user_from_token(token: str) -> User:
    await _check_token_revoked(token)
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Subject not found in token")
    user = await UserRepository().get_by_id(user_id)
    if not user or not user.isActive:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=_INACTIVE)
    return user


async def get_tenant_context(current_user: User = Depends(get_current_user)) -> str:
    """
    Injects the verified tenant_id for the current request.
    Primary source: current_user.tenantId (DB-verified user record).
    Secondary source: context-resolved tenant ID from subdomain/request header.
    """
    if hasattr(current_user, "tenantId"):
        if not current_user.tenantId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no tenant association. Contact your platform administrator.",
            )
        return current_user.tenantId

    from app.middleware.tenant import get_current_tenant_id

    tid = get_current_tenant_id()
    if not tid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no tenant association. Contact your platform administrator.",
        )
    return tid


async def auth_rate_limit(request: Request) -> None:
    if settings.ENVIRONMENT == "development":
        return
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    r = await get_redis()
    key = f"ratelimit:auth:{ip}"
    count = await r.incr(key)
    if count == 1:
        await r.expire(key, 60)
    if count > 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Please try again later."
        )
