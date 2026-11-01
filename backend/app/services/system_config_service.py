import json
from typing import Optional
from prisma.models import SystemConfiguration
from app.repositories.system_config_repository import SystemConfigRepository
from app.db.redis import safe_redis
from app.core.logging_config import get_logger

logger = get_logger("app.system_config")

BASE_CACHE_KEY = "system:config"


class SystemConfigService:
    def __init__(self) -> None:
        self.repo = SystemConfigRepository()

    def _get_cache_key(self, tenant_id: Optional[str] = None) -> str:
        return f"{BASE_CACHE_KEY}:{tenant_id}" if tenant_id else BASE_CACHE_KEY

    async def get_config(self, tenant_id: Optional[str] = None) -> SystemConfiguration:
        cache_key = self._get_cache_key(tenant_id)
        redis_client = safe_redis()
        if redis_client:
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    data = json.loads(cached)
                    return SystemConfiguration.model_validate(data)
            except Exception:
                logger.warning("Redis config cache read failed. Falling back to DB.")

        config = await self.repo.get_config(tenant_id=tenant_id)

        if redis_client:
            try:
                await redis_client.set(
                    cache_key,
                    json.dumps(config.model_dump(mode="json")),
                    ex=300,
                )
            except Exception as e:
                logger.warning("Redis config cache write failed: %s", e)

        return config

    async def update_config(
        self,
        tenant_id: Optional[str] = None,
        is_face_recognition_enabled: bool | None = None,
        is_gps_verification_enabled: bool | None = None,
        is_ai_background_validation_enabled: bool | None = None,
        campus_latitude: float | None = None,
        campus_longitude: float | None = None,
        geofence_radius_meters: int | None = None,
        min_attendance_pct: float | None = None,
        verification_window_min: int | None = None,
        saturday_enabled: bool | None = None,
    ) -> SystemConfiguration:
        config = await self.repo.update_config(
            tenant_id=tenant_id,
            is_face_recognition_enabled=is_face_recognition_enabled,
            is_gps_verification_enabled=is_gps_verification_enabled,
            is_ai_background_validation_enabled=is_ai_background_validation_enabled,
            campus_latitude=campus_latitude,
            campus_longitude=campus_longitude,
            geofence_radius_meters=geofence_radius_meters,
            min_attendance_pct=min_attendance_pct,
            verification_window_min=verification_window_min,
            saturday_enabled=saturday_enabled,
        )

        cache_key = self._get_cache_key(tenant_id)
        redis_client = safe_redis()
        if redis_client:
            try:
                await redis_client.set(
                    cache_key,
                    json.dumps(config.model_dump(mode="json")),
                    ex=300,
                )
            except Exception as e:
                logger.warning("Redis config cache write failed: %s", e)

        return config
