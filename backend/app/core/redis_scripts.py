import time
from typing import Tuple
from redis.asyncio import Redis

ATOMIC_INCR_EXPIRE_LUA = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"""

SLIDING_WINDOW_LUA = """
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
local current_count = redis.call('ZCARD', KEYS[1])
if current_count < tonumber(ARGV[4]) then
    redis.call('ZADD', KEYS[1], ARGV[2], ARGV[2])
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]) + 5)
    return {1, current_count + 1}
else
    return {0, current_count}
end
"""

RELEASE_LOCK_LUA = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
"""


async def atomic_incr_expire(redis_client: Redis, key: str, ttl_seconds: int) -> int:
    """Increment counter and set TTL atomically on first creation."""
    result = await redis_client.eval(ATOMIC_INCR_EXPIRE_LUA, 1, key, ttl_seconds)
    return int(result)


async def atomic_sliding_window(
    redis_client: Redis,
    key: str,
    requests_limit: int,
    window_seconds: int,
) -> Tuple[bool, int]:
    """
    Sliding window rate limit check via Lua.
    Returns (is_allowed: bool, current_count: int).
    """
    current_time = time.time()
    window_start = current_time - window_seconds
    result = await redis_client.eval(
        SLIDING_WINDOW_LUA,
        1,
        key,
        window_start,
        current_time,
        window_seconds,
        requests_limit,
    )
    is_allowed = bool(result[0] == 1)
    count = int(result[1])
    return is_allowed, count


async def atomic_release_lock(redis_client: Redis, lock_key: str, owner_token: str) -> bool:
    """Release distributed lock only if held by owner_token."""
    result = await redis_client.eval(RELEASE_LOCK_LUA, 1, lock_key, owner_token)
    return bool(result == 1)
