import time
from datetime import datetime, timezone
from typing import Any, Dict
from app.core.logging_config import get_logger
from app.db.client import db
from app.schemas.super_admin import SuperAdminStatsResponse

logger = get_logger("app.super_admin.health")


class SystemHealthService:
    @staticmethod
    async def get_platform_stats() -> SuperAdminStatsResponse:
        total_tenants = await db.tenant.count()
        active_tenants = await db.tenant.count(where={"status": "ACTIVE"})
        total_students = await db.student.count()
        total_teachers = await db.teacher.count()
        active_sessions = await db.session.count(where={"isActive": True})
        total_attendance = await db.attendance.count()
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
        # 1. Database check & pool stats
        db_start = time.perf_counter()
        db_ok = False
        active_queries = 0
        max_connections = 20
        try:
            await db.execute_raw("SELECT 1")
            db_ok = True
            try:
                stat_res = await db.query_raw(
                    "SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active'"
                )
                if stat_res and len(stat_res) > 0 and "count" in stat_res[0]:
                    active_queries = int(stat_res[0]["count"])
                max_res = await db.query_raw("SHOW max_connections")
                if max_res and len(max_res) > 0 and "max_connections" in max_res[0]:
                    max_connections = int(max_res[0]["max_connections"])
            except Exception as pool_err:
                logger.debug("Could not query pg_stat_activity: %s", pool_err)
                active_queries = 1
        except Exception as db_err:
            logger.warning("Database health check ping failed: %s", db_err)
        db_latency = round((time.perf_counter() - db_start) * 1000, 2)

        # 2. Redis check
        redis_start = time.perf_counter()
        redis_ok = False
        redis_info = {}
        try:
            from app.db.redis import get_redis

            r = get_redis()
            pong = await r.ping()
            redis_ok = bool(pong)
            redis_info = {"connected": True}
        except Exception as e:
            redis_info = {"error": str(e)}
        redis_latency = round((time.perf_counter() - redis_start) * 1000, 2)

        # 3. Object / Media Storage check
        storage_start = time.perf_counter()
        storage_ok = True
        storage_details: Dict[str, Any] = {}
        try:
            from app.services.s3_service import s3_service

            bucket = s3_service.bucket_name
            if bucket:
                storage_details = {
                    "provider": "S3 Object Storage",
                    "bucket": bucket,
                    "status": "ready",
                }
            else:
                storage_details = {
                    "provider": "Local Media Storage",
                    "status": "ready",
                }
        except Exception as st_err:
            storage_ok = False
            storage_details = {"error": str(st_err), "status": "degraded"}
        storage_latency = round((time.perf_counter() - storage_start) * 1000, 2)

        # 4. Biometric Runtime & Hardware compute check
        hw_start = time.perf_counter()
        try:
            from app.core.hardware import hardware_manager

            hw_status = hardware_manager.get_status()
        except Exception as hw_err:
            hw_status = {"active_device": "CPU", "target_device": "auto", "error": str(hw_err)}
        hw_latency = round((time.perf_counter() - hw_start) * 1000, 2)
        hw_healthy = not (hw_status.get("fallback_occurred") and hw_status.get("target_device") == "cuda")

        overall_status = "healthy"
        if not db_ok or not redis_ok:
            overall_status = "degraded"

        return {
            "status": overall_status,
            "timestamp": datetime.now(timezone.utc),
            "services": {
                "postgresql": {
                    "status": "healthy" if db_ok else "down",
                    "latency_ms": db_latency,
                    "details": {
                        "engine": "PostgreSQL 15+",
                        "status": "connected" if db_ok else "disconnected",
                        "active_queries": active_queries,
                        "max_connections": max_connections,
                    },
                },
                "redis_cache": {
                    "status": "healthy" if redis_ok else "down",
                    "latency_ms": redis_latency,
                    "details": {
                        "mode": "In-Memory Cache & Session Store",
                        "status": "connected" if redis_ok else "unreachable",
                        **redis_info,
                    },
                },
                "object_storage": {
                    "status": "healthy" if storage_ok else "degraded",
                    "latency_ms": storage_latency,
                    "details": storage_details,
                },
                "biometric_runtime": {
                    "status": "healthy" if hw_healthy else "degraded",
                    "latency_ms": hw_latency,
                    "details": {
                        "device": hw_status.get("active_device", "CPU"),
                        "target": hw_status.get("target_device", "auto"),
                        "dynamic_memory": hw_status.get("memory_growth_enabled", True),
                    },
                },
            },
            "server_uptime_seconds": round(time.monotonic(), 1),
            "database_pool": {"max_connections": max_connections, "active_queries": active_queries},
            "redis_status": {"ping_success": redis_ok},
            "hardware_status": hw_status,
            "storage_status": storage_details,
        }
