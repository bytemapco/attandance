import contextvars
from dataclasses import dataclass
from typing import Optional

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.security import decode_session_token
from app.services.tenant_resolver import TenantResolutionError, resolve_tenant_id

logger = get_logger("app.middleware.tenant")

# Async-safe context variable holding the active tenant ID for the request
current_tenant_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_tenant_id", default=None)

DEFAULT_TENANT_IDENTIFIER = "default-institution"
STRICT_TENANT_HEADER = "X-Strict-Tenant-Check"
LOCAL_HOSTS = ("localhost", "127.0.0.1", "0.0.0.0", "testserver")
LOCAL_ENVIRONMENTS = ("development", "test")

RESERVED_PLATFORM_SUBDOMAINS = (
    "www", "api", "app", "admin", "backend", "attendance", "attendance-backend", "auth", "cdn", "static", "mail",
)

# Paths that do not require tenant resolution
EXEMPT_PREFIXES = (
    "/health", "/docs", "/redoc", "/openapi.json", "/api/v1/health", "/api/v1/auth", "/api/v1/super-admin",
    "/api/v1/platform", "/ws", "/static", "/favicon.ico",
)


def get_current_tenant_id() -> Optional[str]:
    return current_tenant_id.get()


@dataclass(frozen=True)
class TokenClaims:
    role: Optional[str] = None
    tenant_id: Optional[str] = None


def _is_platform_subdomain(subdomain: str) -> bool:
    return subdomain in RESERVED_PLATFORM_SUBDOMAINS or subdomain.endswith(("-backend", "-api"))


def _token_claims(request: Request) -> TokenClaims:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return TokenClaims()
    payload = decode_session_token(header.removeprefix("Bearer ").strip())
    if not payload:
        return TokenClaims()
    return TokenClaims(role=payload.get("role"), tenant_id=payload.get("tid") or payload.get("tenant_id"))


def _subdomain_tenant(request: Request) -> Optional[str]:
    """The institution named by a subdomain such as `<tenant>.sahaj.example.com`; None for local and platform hosts."""
    host = request.headers.get("host", "").split(":")[0].lower()
    if not host or host in LOCAL_HOSTS:
        return None
    parts = host.split(".")
    if len(parts) < 3:
        return None
    if not _is_platform_subdomain(parts[0]):
        return parts[0]
    if len(parts) >= 4 and not _is_platform_subdomain(parts[1]):
        return parts[1]
    return None


def _forbidden(detail: str) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": detail})


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")


def _missing_tenant_identifier(request: Request) -> Optional[str]:
    """Local development and tests fall back to a default institution; anywhere else the tenant must be named."""
    if settings.ENVIRONMENT in LOCAL_ENVIRONMENTS and not request.headers.get(STRICT_TENANT_HEADER):
        return DEFAULT_TENANT_IDENTIFIER
    return None


class TenantResolutionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith(EXEMPT_PREFIXES):
            return await call_next(request)

        claims = _token_claims(request)
        if claims.role == "SUPER_ADMIN":
            return await call_next(request)

        # The tenant in a signed token wins over the header, and the two may not disagree.
        header_tenant = request.headers.get("X-Tenant-ID")
        if claims.tenant_id and header_tenant and claims.tenant_id != header_tenant:
            logger.warning(
                "Security Alert: Tenant mismatch. Token tid=%s vs Header tid=%s from IP=%s",
                claims.tenant_id, header_tenant, _client_ip(request),
            )
            return _forbidden("Access forbidden: Cross-tenant context manipulation detected.")

        identifier = claims.tenant_id or header_tenant or _subdomain_tenant(request) or _missing_tenant_identifier(request)
        if not identifier:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Tenant context missing. Provide 'X-Tenant-ID' header or subdomain."},
            )
        try:
            tenant_id = await resolve_tenant_id(identifier)
        except TenantResolutionError as err:
            return JSONResponse(status_code=err.status_code, content={"detail": err.detail})

        token = current_tenant_id.set(tenant_id)
        try:
            return await call_next(request)
        finally:
            current_tenant_id.reset(token)
