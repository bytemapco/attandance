"""Who may use the assistant, and whether their institution has switched it on."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from prisma import Json
from prisma.models import Tenant, User

from app.core.config import settings
from app.db.client import db
from app.repositories.teacher_repository import TeacherRepository
from app.services.agent.types import ADMIN, ADMIN_ROLES, TEACHER, Principal

NOTICE_KEY = "aiAssistant"
NOTICE_REQUIRED = "ai_notice_required"


def refuse(code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=code, detail=detail)


async def build_principal(user: User) -> Principal:
    """Teachers and tenant admins only. Students and the platform super admin have no assistant."""
    if user.role in ADMIN_ROLES:
        role = ADMIN
    elif user.role == TEACHER:
        role = TEACHER
    else:
        raise refuse(status.HTTP_403_FORBIDDEN, "The assistant is for teachers and institution admins.")
    if not user.tenantId:
        raise refuse(status.HTTP_403_FORBIDDEN, "Your account has no institution.")
    teacher = None
    if role == TEACHER:
        teacher = await TeacherRepository().get_by_user_id(user.id)
        if not teacher:
            raise refuse(status.HTTP_404_NOT_FOUND, "Teacher profile not found.")
    return Principal(user=user, role=role, tenant_id=user.tenantId, teacher=teacher)


def _settings_of(tenant: Tenant) -> dict:
    return dict(tenant.settings) if isinstance(tenant.settings, dict) else {}


async def _tenant(tenant_id: str) -> Tenant:
    tenant = await db.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        raise refuse(status.HTTP_404_NOT_FOUND, "Institution not found.")
    return tenant


def notice_of(tenant: Tenant) -> Optional[dict]:
    notice = _settings_of(tenant).get(NOTICE_KEY)
    return notice if isinstance(notice, dict) and notice.get("acceptedAt") else None


async def assistant_status(principal: Principal) -> dict:
    tenant = await _tenant(principal.tenant_id)
    notice = notice_of(tenant)
    return {
        "role": principal.role.lower(),
        "model_configured": bool(settings.GEMINI_API_KEY),
        "notice_accepted": notice is not None,
        "accepted_at": notice["acceptedAt"] if notice else None,
        "can_accept_notice": principal.role == ADMIN,
    }


async def require_ready(principal: Principal) -> None:
    """The assistant runs only when a key is set and the institution's admin has accepted the data notice."""
    if not settings.GEMINI_API_KEY:
        raise refuse(status.HTTP_503_SERVICE_UNAVAILABLE, "The assistant is not set up on this server.")
    if notice_of(await _tenant(principal.tenant_id)) is None:
        raise refuse(status.HTTP_403_FORBIDDEN, NOTICE_REQUIRED)


async def accept_notice(principal: Principal) -> dict:
    if principal.role != ADMIN:
        raise refuse(status.HTTP_403_FORBIDDEN, "Only an institution admin can switch the assistant on.")
    tenant = await _tenant(principal.tenant_id)
    current = _settings_of(tenant)
    current[NOTICE_KEY] = {"acceptedAt": datetime.now(timezone.utc).isoformat(), "acceptedBy": principal.user_id}
    await db.tenant.update(where={"id": tenant.id}, data={"settings": Json(current)})
    return await assistant_status(principal)
