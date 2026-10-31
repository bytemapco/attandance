import time
import contextvars
from typing import Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import get_logger

logger = get_logger("app.access")

current_http_request: contextvars.ContextVar[Optional[Request]] = contextvars.ContextVar("current_http_request", default=None)

def get_current_request() -> Optional[Request]:
    return current_http_request.get()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        req_token = current_http_request.set(request)
        start_ts = time.perf_counter()
        method = request.method
        path = request.url.path

        try:
            response: Response = await call_next(request)
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start_ts) * 1000)
            logger.error("%s %s — %dms | error=%s", method, path, elapsed_ms, exc, exc_info=True)
            raise
        finally:
            current_http_request.reset(req_token)

        elapsed_ms = int((time.perf_counter() - start_ts) * 1000)
        log = logger.warning if response.status_code >= 400 else logger.info
        log("%s %s %d %dms", method, path, response.status_code, elapsed_ms)
        return response
