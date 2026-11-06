"""The invitation e-mail a new student, teacher or administrator receives."""
from typing import Optional

from app.core.logging_config import get_logger
from app.services.auth_service import AuthService
from app.services.email_queue import enqueue_email

logger = get_logger("app.services.invitations")


async def send_invitation(
    user_id: str,
    email: str,
    name: str,
    role: str,
    identifier_label: str,
    identifier_value: str,
    temp_password: Optional[str],
) -> bool:
    """Creates the one-time sign-up link and queues the e-mail. Returns whether it was queued; the worker sends it
    and retries. A failure is logged and reported as False, never raised, because the account already exists and
    the invitation can be sent again."""
    try:
        token = await AuthService().create_invitation_token(user_id, email, role, name)
        queued = await enqueue_email(
            "send_invitation_email",
            to_email=email,
            recipient_name=name,
            role=role,
            invite_token=token,
            identifier_label=identifier_label,
            identifier_value=identifier_value,
            temp_password=temp_password,
        )
    except Exception:
        logger.exception("Could not queue the %s invitation to %s", role.lower(), email)
        return False
    if not queued:
        logger.warning("The %s invitation to %s could not be queued", role.lower(), email)
    return queued
