"""Steps shared by every flow that creates a student or teacher account."""
from typing import Any, Awaitable, Callable, Optional, TypeVar

from prisma.models import User

from app.core.logging_config import get_logger
from app.core.security import generate_temporary_password, hash_password
from app.db.client import db

logger = get_logger("app.services.admin.account_setup")

T = TypeVar("T")
SEAT_ROLES = ["STUDENT", "TEACHER"]


async def require_record(delegate: Any, where: dict, message: str) -> Any:
    """The first record matching `where`, or ValueError(message), which the API reports as 404."""
    record = await delegate.find_first(where=where)
    if not record:
        raise ValueError(message)
    return record


async def require_license_seat(tenant_id: str) -> None:
    tenant = await db.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        return
    in_use = await db.user.count(where={"tenantId": tenant_id, "role": {"in": SEAT_ROLES}})
    if in_use >= tenant.licenseCount:
        raise ValueError(
            f"License seat quota exceeded ({in_use}/{tenant.licenseCount}). "
            "Request additional licenses from your super administrator."
        )


def initial_credentials(password: Optional[str] = None) -> tuple[str, bool]:
    """(plain password, must change it). Without a chosen password a temporary one is generated and must be changed."""
    return (password or generate_temporary_password(), not password)


async def user_record(email: str, role: str, tenant_id: str, password: str, must_change: bool) -> dict:
    return {
        "email": email,
        "hashedPassword": await hash_password(password),
        "role": role,
        "mustChangePassword": must_change,
        "tenantId": tenant_id,
    }


async def create_user_with_profile(user_data: dict, make_profile: Callable[[str], Awaitable[T]]) -> tuple[User, T]:
    """Creates the login and then its profile; the login is removed again if the profile cannot be created."""
    user = await db.user.create(data=user_data)
    try:
        return user, await make_profile(user.id)
    except Exception:
        try:
            await db.user.delete(where={"id": user.id})
        except Exception as cleanup_error:
            logger.error("Failed to roll back user %s after the profile was refused: %s", user.id, cleanup_error)
        raise
