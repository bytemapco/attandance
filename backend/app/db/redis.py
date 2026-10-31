from urllib.parse import urlparse
from redis.asyncio import ConnectionPool, Redis
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.redis")

redis_pool: ConnectionPool | None = None
redis_client: Redis | None = None


async def connect_redis() -> Redis | None:
    global redis_pool, redis_client
    if redis_client is None:
        try:
            parsed = urlparse(settings.REDIS_URL)
            safe_target = f"{parsed.scheme}://{parsed.hostname or 'localhost'}:{parsed.port or 6379}{parsed.path or ''}"
            logger.info("Connecting to Redis at %s...", safe_target)

            redis_pool = ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=50,
                decode_responses=True,
                protocol=2,
                socket_connect_timeout=3.0,
                socket_keepalive=True,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            client = Redis(connection_pool=redis_pool)
            await client.ping()
            redis_client = client
            logger.info("Connected to Redis successfully at %s", safe_target)
        except Exception as err:
            logger.warning(
                "Redis connection failed (%s). Application running in degraded cache mode: %s",
                settings.REDIS_URL.split("@")[-1] if "@" in settings.REDIS_URL else settings.REDIS_URL,
                err,
            )
            if redis_pool is not None:
                await redis_pool.aclose()
                redis_pool = None
            redis_client = None
    return redis_client


async def disconnect_redis() -> None:
    global redis_pool, redis_client
    if redis_client is not None:
        try:
            await redis_client.aclose()
        except Exception as err:
            logger.error("Error closing Redis connection: %s", err, exc_info=True)
        finally:
            redis_client = None

    if redis_pool is not None:
        try:
            await redis_pool.aclose()
        except Exception as err:
            logger.error("Error closing Redis pool: %s", err, exc_info=True)
        finally:
            redis_pool = None


def safe_redis() -> Redis | None:
    """Return active Redis client or None if unavailable (fail-safe)."""
    return redis_client


class _RedisAccessor:
    def __getattr__(self, name: str):
        if redis_client is None:
            raise RuntimeError("Redis client is not initialized or currently unavailable.")
        return getattr(redis_client, name)

    def __await__(self):
        async def _coro():
            if redis_client is None:
                raise RuntimeError("Redis client is not initialized or currently unavailable.")
            return redis_client
        return _coro().__await__()


def get_redis() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized or currently unavailable.")
    return _RedisAccessor()


