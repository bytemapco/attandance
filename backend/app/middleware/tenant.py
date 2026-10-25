import contextvars
from typing import Optional
from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.logging_config import get_logger

logger = get_logger("app.middleware.tenant")

# Thread/Async-safe context variable holding the active tenant ID for the request
current_tenant_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_tenant_id", default=None)


def get_current_tenant_id() -> Optional[str]:
    return current_tenant_id.get()


class TenantResolutionMiddleware(BaseHTTPMiddleware):
    # Paths that do not require tenant resolution
    EXEMPT_PREFIXES = (
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/health",
        "/api/v1/auth",
        "/api/v1/super-admin",
        "/api/v1/platform",
        "/ws",
        "/static",
        "/favicon.ico",
    )

    async def dispatch(self, request: Request, call_next):
        # 1. Skip exempt paths
        if any(request.url.path.startswith(prefix) for prefix in self.EXEMPT_PREFIXES):
            return await call_next(request)

        # 2. Extract tenant and role from JWT token if present
        jwt_tenant_id: Optional[str] = None
        user_role: Optional[str] = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from app.core.security import decode_access_token

                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                if payload:
                    user_role = payload.get("role")
                    if user_role == "SUPER_ADMIN":
                        return await call_next(request)
                    jwt_tenant_id = payload.get("tid") or payload.get("tenant_id")
            except Exception as decode_err:
                logger.debug("Failed extracting JWT payload in tenant middleware: %s", decode_err)

        # 3. Extract tenant identifier from explicit header, custom domain host, or subdomain
        explicit_header_tid = request.headers.get("X-Tenant-ID")

        # 4. Enforce strict cryptographic binding: Prevent Tenant Spoofing
        if jwt_tenant_id and explicit_header_tid and jwt_tenant_id != explicit_header_tid:
            client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (
                request.client.host if request.client else "unknown"
            )
            logger.warning(
                "Security Alert: Tenant mismatch. Token tid=%s vs Header tid=%s from IP=%s",
                jwt_tenant_id,
                explicit_header_tid,
                client_ip,
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access forbidden: Cross-tenant context manipulation detected."},
            )

        header_tenant_id = explicit_header_tid
        if not header_tenant_id:
            host_header = request.headers.get("host", "").split(":")[0].lower()
            if host_header and host_header not in ("localhost", "127.0.0.1", "0.0.0.0", "testserver"):
                header_tenant_id = host_header
                parts = host_header.split(".")
                if len(parts) >= 3 and parts[0] not in ("www", "api", "app", "admin"):
                    header_tenant_id = parts[0]

        tenant_identifier = jwt_tenant_id or header_tenant_id

        # 5. If tenant identifier is still missing:
        if not tenant_identifier:
            if request.url.path.startswith("/api/v1/auth/"):
                return await call_next(request)
            import os
            from app.core.config import settings

            env = getattr(settings, "ENVIRONMENT", os.getenv("ENVIRONMENT", "development"))
            if env in ("development", "test") and not request.headers.get("X-Strict-Tenant-Check"):
                tenant_identifier = "default-institution"
            else:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Tenant context missing. Provide 'X-Tenant-ID' header or subdomain."},
                )

        # 6. Resolve tenant via Redis cache or Database
        resolved_tenant_id = None
        try:
            from app.db.redis import get_redis

            redis = get_redis()
            cached_val = await redis.get(f"tenant:resolved:{tenant_identifier}")
            if cached_val:
                if cached_val.startswith("SUSPENDED:"):
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "Tenant account is currently suspended."},
                    )
                elif cached_val.startswith("ACTIVE:"):
                    resolved_tenant_id = cached_val[len("ACTIVE:") :]
                else:
                    # Legacy bare ID — treat as ACTIVE
                    resolved_tenant_id = cached_val
        except Exception as cache_err:
            logger.debug("Could not read tenant resolution cache: %s", cache_err)

        if not resolved_tenant_id:
            try:
                from app.db.client import db

                tenant = await db.tenant.find_first(
                    where={
                        "OR": [
                            {"id": tenant_identifier},
                            {"slug": tenant_identifier},
                            {"domain": tenant_identifier},
                        ]
                    }
                )
                if not tenant:
                    import os

                    if os.getenv("ENVIRONMENT") == "test":
                        resolved_tenant_id = tenant_identifier
                    else:
                        return JSONResponse(
                            status_code=status.HTTP_404_NOT_FOUND,
                            content={"detail": f"Tenant '{tenant_identifier}' not found."},
                        )
                elif tenant.status != "ACTIVE":
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": f"Tenant account is currently {tenant.status.lower()}."},
                    )
                else:
                    resolved_tenant_id = tenant.id
                    try:
                        from app.db.redis import get_redis

                        await get_redis().setex(
                            f"tenant:resolved:{tenant_identifier}", 3600, f"ACTIVE:{resolved_tenant_id}"
                        )
                    except Exception as cache_err:
                        logger.debug("Could not set tenant resolution cache: %s", cache_err)
            except Exception as e:
                logger.error("Error resolving tenant: %s", e)
                import os

                if os.getenv("ENVIRONMENT") == "test":
                    resolved_tenant_id = tenant_identifier
                else:
                    return JSONResponse(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        content={"detail": "Unable to verify tenant state."},
                    )

        # 7. Bind tenant ID to context for downstream execution
        token = current_tenant_id.set(resolved_tenant_id)
        try:
            response = await call_next(request)
            return response
        finally:
            current_tenant_id.reset(token)
