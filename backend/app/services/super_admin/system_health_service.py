"""What the super admin sees about the platform's health. Every figure is measured now; a check that cannot run says so."""
import asyncio
import time
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.hardware import hardware_manager
from app.core.logging_config import get_logger
from app.db.client import db
from app.db.redis import get_redis
from app.schemas.super_admin import SuperAdminStatsResponse
from app.services.s3_service import s3_service

logger = get_logger("app.super_admin.health")
STARTED_AT = time.time()  # when this API process started
ARQ_QUEUE = "arq:queue"  # where the worker's jobs wait
ARQ_HEARTBEAT = "arq:queue:health-check"  # the worker writes this key while it is alive


def _elapsed_ms(started: float) -> float:
    return round((time.perf_counter() - started) * 1000, 2)


def _down(error: Exception) -> Dict[str, Any]:
    logger.warning("Health check failed: %s", error)
    return {"status": "down", "latency_ms": None, "details": {"error": str(error)}}


class SystemHealthService:
    @staticmethod
    async def get_platform_stats() -> SuperAdminStatsResponse:
        total_tenants = await db.tenant.count()
        active_tenants = await db.tenant.count(where={"status": "ACTIVE"})
        total_students = await db.student.count()
        total_teachers = await db.teacher.count()
        active_sessions = await db.classoccurrence.count(
            where={"verificationActive": True, "verificationExpires": {"gt": datetime.now(timezone.utc)}}
        )
        total_attendance = await db.attendancerecord.count()
        return SuperAdminStatsResponse(
            total_tenants=total_tenants,
            active_tenants=active_tenants,
            total_students=total_students,
            total_teachers=total_teachers,
            active_sessions=active_sessions,
            total_attendance=total_attendance,
        )

    @staticmethod
    async def get_system_health() -> Dict[str, Any]:
        services = {
            "postgresql": await _check_postgres(),
            "redis_cache": await _check_redis(),
            "object_storage": await _check_storage(),
            "email_worker": await _check_worker(),
            "ai_hardware": _check_hardware(),
        }
        return {
            "status": _overall(services),
            "timestamp": datetime.now(timezone.utc),
            "services": services,
            "server_uptime_seconds": round(time.time() - STARTED_AT, 1),
        }


async def _check_postgres() -> Dict[str, Any]:
    started = time.perf_counter()
    try:
        version = await db.query_raw("SHOW server_version")
        connections = await db.query_raw(
            "SELECT count(*)::int AS total FROM pg_stat_activity WHERE datname = current_database()"
        )
        limit = await db.query_raw("SHOW max_connections")
    except Exception as err:
        return _down(err)
    return {
        "status": "healthy",
        "latency_ms": _elapsed_ms(started),
        "details": {
            "version": version[0]["server_version"],
            "connections": connections[0]["total"],
            "max_connections": int(limit[0]["max_connections"]),
        },
    }


async def _check_redis() -> Dict[str, Any]:
    started = time.perf_counter()
    try:
        redis = get_redis()
        await redis.ping()
        memory = await redis.info("memory")
        clients = await redis.info("clients")
    except Exception as err:
        return _down(err)
    return {
        "status": "healthy",
        "latency_ms": _elapsed_ms(started),
        "details": {
            "memory_used": memory.get("used_memory_human"),
            "clients": clients.get("connected_clients"),
        },
    }


async def _check_storage() -> Dict[str, Any]:
    bucket = s3_service.bucket_name
    if not bucket:
        return {"status": "not_configured", "latency_ms": None, "details": {"provider": "S3", "note": "No bucket is set"}}
    started = time.perf_counter()
    try:
        await asyncio.to_thread(s3_service.client.head_bucket, Bucket=bucket)
    except Exception as err:
        return _down(err)
    return {"status": "healthy", "latency_ms": _elapsed_ms(started), "details": {"provider": "S3", "bucket": bucket}}


async def _check_worker() -> Dict[str, Any]:
    started = time.perf_counter()
    try:
        redis = get_redis()
        alive = bool(await redis.exists(ARQ_HEARTBEAT))
        waiting = await redis.zcard(ARQ_QUEUE)
    except Exception as err:
        return _down(err)
    status = "healthy" if alive else ("warning" if waiting else "down")
    return {
        "status": status,
        "latency_ms": _elapsed_ms(started),
        "details": {"online": alive, "jobs_waiting": waiting},
    }


def _check_hardware() -> Dict[str, Any]:
    status = hardware_manager.get_status()
    fell_back = bool(status.get("fallback_occurred")) and status.get("target_device") == "cuda"
    return {
        "status": "warning" if fell_back else "healthy",
        "latency_ms": None,
        "details": {"device": status.get("active_device"), "target": status.get("target_device")},
    }


def _overall(services: Dict[str, Dict[str, Any]]) -> str:
    """The database is essential; everything else only lowers the status to degraded."""
    if services["postgresql"]["status"] != "healthy":
        return "unhealthy"
    others = [item["status"] for name, item in services.items() if name != "postgresql"]
    return "healthy" if all(s in ("healthy", "not_configured") for s in others) else "degraded"
