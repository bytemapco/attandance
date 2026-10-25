from typing import Optional
from urllib.parse import urlparse
from fastapi import Request
from app.core.config import settings


def resolve_frontend_url(request: Optional[Request] = None, fallback_url: Optional[str] = None) -> str:
    """
    Dynamically resolves the frontend base URL for email links, redirects, and CORS.
    Checks incoming Request headers (Origin, Referer) first to match the user's active client
    environment in both local development and production. Falls back to configured settings.
    """
    if request is not None:
        origin = request.headers.get("origin")
        if origin and origin.strip().startswith(("http://", "https://")):
            return origin.strip().rstrip("/")

        referer = request.headers.get("referer")
        if referer and referer.strip().startswith(("http://", "https://")):
            try:
                parsed = urlparse(referer.strip())
                if parsed.scheme and parsed.netloc:
                    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
            except Exception:
                pass

        forwarded_host = request.headers.get("x-forwarded-host")
        forwarded_proto = request.headers.get("x-forwarded-proto", "https")
        if forwarded_host:
            host = forwarded_host.split(",")[0].strip()
            return f"{forwarded_proto}://{host}".rstrip("/")

    if fallback_url and fallback_url.strip().startswith(("http://", "https://")):
        return fallback_url.strip().rstrip("/")

    # Parse settings.FRONTEND_URL which may be comma-separated for CORS
    raw_frontend = settings.FRONTEND_URL or "http://localhost:3000"
    for candidate in raw_frontend.split(","):
        candidate_clean = candidate.strip().rstrip("/")
        if candidate_clean.startswith(("http://", "https://")):
            return candidate_clean

    return "http://localhost:3000"
