from urllib.parse import urlparse
from redis.asyncio import Redis
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.redis")

redis_client: Redis | None = None


async def connect_redis() -> Redis | None:
    global redis_client
    if redis_client is None:
        try:
            parsed = urlparse(settings.REDIS_URL)
            safe_target = f"{parsed.scheme}://{parsed.hostname or 'localhost'}:{parsed.port or 6379}{parsed.path or ''}"
            logger.info("Connecting to Redis at %s (protocol=2)...", safe_target)

            client = Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                protocol=2,
                socket_keepalive=True,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            await client.ping()
            redis_client = client
            logger.info("Connected to Redis successfully at %s", safe_target)
        except Exception as err:
            logger.warning(
                "Redis connection failed (%s). Application running in degraded cache mode: %s",
                settings.REDIS_URL.split("@")[-1] if "@" in settings.REDIS_URL else settings.REDIS_URL,
                err,
            )
            redis_client = None
    return redis_client


async def disconnect_redis() -> None:
    global redis_client
    if redis_client is not None:
        try:
            await redis_client.aclose()
        except Exception as err:
            logger.error("Error closing Redis connection: %s", err, exc_info=True)
        finally:
            redis_client = None


def get_redis() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized or currently unavailable.")
    return redis_client

