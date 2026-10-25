import time
from datetime import datetime, timezone
from typing import Dict
from fastapi import APIRouter, Response, status

from app.core.config import settings
from app.db.client import db
from app.db.redis import get_redis
from app.schemas.health import HealthResponse, ServiceHealth

router = APIRouter(tags=["System Health & Maintenance"])


async def check_database() -> ServiceHealth:
    start = time.perf_counter()
    try:
        await db.query_raw("SELECT 1;")
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ServiceHealth(
            status="healthy",
            latency_ms=latency,
            details={"engine": "PostgreSQL"},
        )
    except Exception:
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ServiceHealth(
            status="unhealthy",
            latency_ms=latency,
            details={"error": "Database connectivity check failed"},
        )


async def check_redis() -> ServiceHealth:
    start = time.perf_counter()
    try:
        redis_client = get_redis()
        pong = await redis_client.ping()
        latency = round((time.perf_counter() - start) * 1000, 2)
        if pong:
            return ServiceHealth(
                status="healthy",
                latency_ms=latency,
                details={"mode": "In-Memory Cache"},
            )
        return ServiceHealth(
            status="degraded",
            latency_ms=latency,
            details={"error": "Ping returned false"},
        )
    except Exception:
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ServiceHealth(
            status="unhealthy",
            latency_ms=latency,
            details={"error": "Cache connectivity check failed"},
        )


def check_s3() -> ServiceHealth:
    start = time.perf_counter()
    try:
        from app.services.s3_service import s3_service

        if not s3_service.bucket_name:
            latency = round((time.perf_counter() - start) * 1000, 2)
            return ServiceHealth(
                status="healthy",
                latency_ms=latency,
                details={"service": "Object Storage (Local / External Provisioning)"},
            )
        try:
            s3_service.client.head_bucket(Bucket=s3_service.bucket_name)
        except Exception as bucket_err:
            from botocore.exceptions import ClientError

            if isinstance(bucket_err, ClientError):
                error_code = str(bucket_err.response.get("Error", {}).get("Code", ""))
                if error_code in ("403", "AccessDenied"):
                    latency = round((time.perf_counter() - start) * 1000, 2)
                    return ServiceHealth(
                        status="healthy",
                        latency_ms=latency,
                        details={
                            "service": "Object Storage Verified (Restricted HEAD)",
                            "bucket": s3_service.bucket_name,
                        },
                    )
            raise
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ServiceHealth(
            status="healthy",
            latency_ms=latency,
            details={"service": "Object Storage Verified", "bucket": s3_service.bucket_name},
        )
    except Exception as exc:
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ServiceHealth(
            status="unhealthy",
            latency_ms=latency,
            details={"error": f"Object storage check failed: {str(exc)}"},
        )


def check_ai_engine() -> ServiceHealth:
    start = time.perf_counter()
    try:
        from app.core.hardware import hardware_manager

        hw_status = hardware_manager.get_status()
        latency = round((time.perf_counter() - start) * 1000, 2)
        service_status = (
            "degraded"
            if (hw_status.get("fallback_occurred") and hw_status.get("target_device") == "cuda")
            else "healthy"
        )
        return ServiceHealth(
            status=service_status,
            latency_ms=latency,
            details=hw_status,
        )
    except Exception as err:
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ServiceHealth(
            status="unhealthy",
            latency_ms=latency,
            details={"error": str(err)},
        )


@router.get("/health", response_model=HealthResponse, summary="Comprehensive System Health Check")
async def get_health_status(response: Response) -> HealthResponse:
    db_health = await check_database()
    redis_health = await check_redis()
    s3_health = check_s3()
    ai_health = check_ai_engine()

    services: Dict[str, ServiceHealth] = {
        "database": db_health,
        "redis": redis_health,
        "storage": s3_health,
        "ai_engine": ai_health,
    }

    if db_health.status == "unhealthy":
        overall_status = "unhealthy"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif redis_health.status == "unhealthy" or s3_health.status == "unhealthy":
        overall_status = "degraded"
        response.status_code = status.HTTP_200_OK
    else:
        overall_status = "healthy"
        response.status_code = status.HTTP_200_OK

    return HealthResponse(
        status=overall_status,
        app_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        version="1.0.1",
        timestamp=datetime.now(timezone.utc),
        services=services,
    )
