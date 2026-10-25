import json
from typing import Optional
from prisma.models import SystemConfiguration
from app.repositories.system_config_repo import SystemConfigRepository
from app.db.redis import get_redis
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
        try:
            redis_client = get_redis()
            cached = await redis_client.get(cache_key)
            if cached:
                data = json.loads(cached)
                return SystemConfiguration.model_validate(data)
        except Exception:
            logger.warning("Redis config cache read failed. Falling back to DB.")

        config = await self.repo.get_config(tenant_id=tenant_id)

        try:
            redis_client = get_redis()
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
    ) -> SystemConfiguration:
        config = await self.repo.update_config(
            tenant_id=tenant_id,
            is_face_recognition_enabled=is_face_recognition_enabled,
            is_gps_verification_enabled=is_gps_verification_enabled,
            is_ai_background_validation_enabled=is_ai_background_validation_enabled,
        )

        cache_key = self._get_cache_key(tenant_id)
        try:
            redis_client = get_redis()
            await redis_client.set(
                cache_key,
                json.dumps(config.model_dump(mode="json")),
                ex=300,
            )
        except Exception as e:
            logger.warning("Redis config cache write failed: %s", e)

        return config
