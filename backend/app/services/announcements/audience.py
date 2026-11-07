"""Who an announcement is for. A sender picks one of four audiences; "Admins" covers every kind of institution admin."""
from typing import Literal, Optional

Audience = Literal["ALL", "STUDENT", "TEACHER", "ADMIN"]

ROLES = {
    "STUDENT": frozenset({"STUDENT"}),
    "TEACHER": frozenset({"TEACHER"}),
    "ADMIN": frozenset({"ADMIN", "TENANT_ADMIN"}),
}


def roles_for(audience: str) -> Optional[frozenset[str]]:
    """The account roles an audience covers. None means every role."""
    return ROLES.get(audience)


def audience_of(role: str) -> Optional[str]:
    """The audience a person belongs to, apart from "everyone". The platform owner belongs to none."""
    return next((name for name, roles in ROLES.items() if role in roles), None)


def visible_to(announcement: str, tenant_param: int, audience_param: int) -> str:
    """SQL that keeps the announcements a person may see: already published, for their institution or for all of
    them, and for their audience or for everyone. The person's institution and audience are query parameters."""
    return (
        f"{announcement}.publish_at <= (now() AT TIME ZONE 'UTC') "
        f"AND ({announcement}.tenant_id IS NULL OR {announcement}.tenant_id = ${tenant_param}::text) "
        f"AND ({announcement}.audience = 'ALL' OR {announcement}.audience::text = ${audience_param}::text)"
    )
