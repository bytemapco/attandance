from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.hardware import hardware_manager
from app.core.logging_config import setup_logging, get_logger

# Initialize hardware acceleration engine before loading models
hardware_manager.initialize(
    target_device=settings.AI_DEVICE,
    memory_limit_mb=settings.AI_GPU_MEMORY_LIMIT_MB,
    allow_fallback=settings.AI_FORCE_CPU_FALLBACK,
)
from app.db.client import connect_db, disconnect_db
from app.db.redis import connect_redis, disconnect_redis
from app.services.s3_service import s3_service
from app.services.scheduler import session_scheduler
from app.api import (
    auth,
    student,
    teacher,
    admin,
    logs,
    health,
    notifications,
    websocket as websocket_router,
    search,
    super_admin,
    scim,
)
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.tenant import TenantResolutionMiddleware


setup_logging(level=settings.LOG_LEVEL)
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting server...")
    hw_info = hardware_manager.get_status()
    logger.info(
        "AI Hardware: %s (%s, target: %s, fallback: %s)",
        hw_info["active_device"],
        hw_info["device_type"],
        hw_info["target_device"],
        hw_info["fallback_occurred"],
    )
    await connect_db()
    await connect_redis()
    s3_service.ensure_bucket_exists()
    websocket_router.manager.start_heartbeat()
    session_scheduler.start()
    logger.info("Server ready")
    yield
    logger.info("Shutting down...")
    session_scheduler.stop()
    websocket_router.manager.stop_heartbeat()
    await disconnect_db()
    await disconnect_redis()
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Asynchronous AI-powered Multi-Layered Smart Attendance verification backend.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(TenantResolutionMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_URL.split(",") if "," in settings.FRONTEND_URL else [settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(super_admin.router, prefix=settings.API_V1_STR)
app.include_router(student.router, prefix=settings.API_V1_STR)
app.include_router(teacher.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(logs.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(websocket_router.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(scim.router, prefix=settings.API_V1_STR)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        loc = err.get("loc", ())
        field_parts = [str(part) for part in loc if str(part) not in ("body", "query", "path", "header", "cookie")]
        field_name = ".".join(field_parts) if field_parts else "payload"
        details.append(
            {
                "field": field_name,
                "message": err.get("msg", "Invalid value"),
                "issue": err.get("msg", "Invalid value"),
                "type": err.get("type", "value_error"),
            }
        )
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, details)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request payload",
                "details": details,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.critical("Unhandled exception: %s %s — %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred.",
            },
        },
    )
