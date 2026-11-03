"""Turns a tenant slug or id from a request into the id of an active institution."""
from typing import Optional

from fastapi import status

from app.core.logging_config import get_logger
from app.db.client import db
from app.db.redis import get_redis

logger = get_logger("app.tenant_resolver")

CACHE_KEY_PREFIX = "tenant:resolved:"
CACHE_TTL_SECONDS = 3600
ACTIVE_PREFIX = "ACTIVE:"
SUSPENDED_PREFIX = "SUSPENDED:"


class TenantResolutionError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


async def _cached_tenant_id(identifier: str) -> Optional[str]:
    try:
        cached = await get_redis().get(f"{CACHE_KEY_PREFIX}{identifier}")
    except Exception as exc:
        logger.debug("Could not read tenant resolution cache: %s", exc)
        return None
    if not cached:
        return None
    if cached.startswith(SUSPENDED_PREFIX):
        raise TenantResolutionError(status.HTTP_403_FORBIDDEN, "Tenant account is currently suspended.")
    return cached.removeprefix(ACTIVE_PREFIX)


async def remember_tenant(tenant_id: str, identifiers: tuple[str, ...], state_prefix: str = ACTIVE_PREFIX) -> None:
    """Caches the tenant's state under each identifier (id and slug). Raises when Redis is unavailable."""
    redis = get_redis()
    for identifier in identifiers:
        await redis.setex(f"{CACHE_KEY_PREFIX}{identifier}", CACHE_TTL_SECONDS, f"{state_prefix}{tenant_id}")


async def forget_tenant(*identifiers: str) -> None:
    """Drops cached tenant state so the next request reads the database. Raises when Redis is unavailable."""
    redis = get_redis()
    for identifier in identifiers:
        await redis.delete(f"{CACHE_KEY_PREFIX}{identifier}")


async def _cache_tenant_id(identifier: str, tenant_id: str) -> None:
    try:
        await remember_tenant(tenant_id, (identifier,))
    except Exception as exc:
        logger.debug("Could not set tenant resolution cache: %s", exc)


async def _find_tenant(identifier: str):
    try:
        return await db.tenant.find_first(where={"OR": [{"id": identifier}, {"slug": identifier}]})
    except Exception as exc:
        logger.error("Error resolving tenant: %s", exc)
        raise TenantResolutionError(status.HTTP_500_INTERNAL_SERVER_ERROR, "Unable to verify tenant state.")


async def resolve_tenant_id(identifier: str) -> str:
    """The id of the active institution behind `identifier` (its id or slug). Raises TenantResolutionError otherwise."""
    cached = await _cached_tenant_id(identifier)
    if cached:
        return cached
    tenant = await _find_tenant(identifier)
    if not tenant:
        raise TenantResolutionError(status.HTTP_404_NOT_FOUND, f"Tenant '{identifier}' not found.")
    if tenant.status != "ACTIVE":
        raise TenantResolutionError(status.HTTP_403_FORBIDDEN, f"Tenant account is currently {tenant.status.lower()}.")
    await _cache_tenant_id(identifier, tenant.id)
    return tenant.id
