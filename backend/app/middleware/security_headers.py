from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces enterprise security headers across all HTTP responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # HTTP Strict Transport Security (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Anti-clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"

        # Explicitly disable vulnerable legacy XSS auditor
        response.headers["X-XSS-Protection"] = "0"

        # Referrer policy to prevent information leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy for attendance biometrics & geofencing
        response.headers["Permissions-Policy"] = "camera=(self), geolocation=(self), microphone=()"

        # Content-Security-Policy
        path = request.url.path
        if path.startswith(("/docs", "/redoc", "/openapi.json")):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data: https:; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "frame-ancestors 'none';"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; frame-ancestors 'none'; object-src 'none';"
            )

        return response
