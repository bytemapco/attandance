"""Gemini API keys. Each request takes a random key that is not resting; a key that hits its limit or stalls rests, and the next takes over.

Google has no way to read a key's remaining quota, so the pool learns from the errors:
- 429: the key rests for the time Google gives, or until midnight Pacific when a daily quota was hit (daily quotas reset then).
- 503, 504, or no first word in time: the key rests a short while. At most MAX_STALLS keys are tried per request.
Which keys rest is kept in Redis, by hash and never the key itself, so a restart or another worker knows too."""
import hashlib
import math
import random
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Optional, Protocol, TypeVar
from zoneinfo import ZoneInfo

from app.core.logging_config import get_logger
from app.db.redis import safe_redis

logger = get_logger("app.agent.keys")
LIMIT_CODE = 429
STALL_CODES = frozenset({503, 504})
DEFAULT_REST_SECONDS = 60.0  # a 429 that says nothing about when the key is free
STALL_REST_SECONDS = 30.0
MAX_STALLS = 3
PACIFIC = ZoneInfo("America/Los_Angeles")
DAILY_QUOTA = "PerDay"  # in the quotaId of a daily limit, such as GenerateRequestsPerDayPerProjectPerModel
_RETRY_DELAY = re.compile(r"^(\d+(?:\.\d+)?)s$")

T = TypeVar("T")


class AllKeysBusy(Exception):
    """Every key is at its limit. `retry_after` is how many seconds until the first one is free."""

    code = LIMIT_CODE

    def __init__(self, retry_after: float) -> None:
        super().__init__(f"Every Gemini key is resting; the first is free in {retry_after:.0f} s")
        self.retry_after = retry_after


class AllKeysSlow(Exception):
    """The keys tried did not answer in time."""


def parse_keys(raw: str) -> list[str]:
    """Keys separated by commas. Blanks and repeats are dropped, order is kept."""
    return list(dict.fromkeys(part.strip() for part in raw.split(",") if part.strip()))


def is_limit_error(exc: Exception) -> bool:
    return getattr(exc, "code", None) == LIMIT_CODE


def is_stall(exc: Exception) -> bool:
    return isinstance(exc, TimeoutError) or getattr(exc, "code", None) in STALL_CODES


def seconds_until_midnight_pacific(now: Optional[datetime] = None) -> float:
    local = (now or datetime.now(timezone.utc)).astimezone(PACIFIC)
    midnight = (local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return (midnight.astimezone(timezone.utc) - local.astimezone(timezone.utc)).total_seconds()


def _details(exc: Exception) -> list[dict[str, Any]]:
    body = getattr(exc, "details", None)
    error = body.get("error") if isinstance(body, dict) else None
    found = error.get("details") if isinstance(error, dict) else None
    return [item for item in found or [] if isinstance(item, dict)]


def limit_rest_seconds(exc: Exception) -> float:
    """How long a key that returned this 429 should rest."""
    details = _details(exc)
    quota_ids = [str(v.get("quotaId", "")) for d in details for v in d.get("violations", []) if isinstance(v, dict)]
    if any(DAILY_QUOTA in quota_id for quota_id in quota_ids):
        return seconds_until_midnight_pacific()
    for detail in details:
        match = _RETRY_DELAY.match(str(detail.get("retryDelay", "")))
        if match:
            return max(1.0, math.ceil(float(match.group(1))))
    return DEFAULT_REST_SECONDS


class Rest(Protocol):
    """Which keys are resting, and for how long."""

    async def resting(self, keys: list[str]) -> dict[str, float]:
        """The seconds left for each key that is resting; keys that are free are left out."""
        ...

    async def rest(self, key: str, seconds: float) -> None: ...


class RedisRest:
    def __init__(self, clock: Callable[[], float] = time.time) -> None:
        self._clock = clock

    @staticmethod
    def _name(key: str) -> str:
        return "agent:gemini:rest:" + hashlib.sha256(key.encode()).hexdigest()[:16]

    async def resting(self, keys: list[str]) -> dict[str, float]:
        redis = safe_redis()
        if not redis:
            return {}
        until = await redis.mget([self._name(key) for key in keys])
        now = self._clock()
        return {key: float(value) - now for key, value in zip(keys, until) if value is not None and float(value) > now}

    async def rest(self, key: str, seconds: float) -> None:
        redis = safe_redis()
        if redis:
            await redis.set(self._name(key), self._clock() + seconds, ex=math.ceil(seconds))


class KeyPool:
    def __init__(self, keys: list[str], store: Optional[Rest] = None, rng: Optional[random.Random] = None) -> None:
        self._keys = keys
        self._store = store or RedisRest()
        self._rng = rng or random.Random()

    def _position(self, key: str) -> str:
        return f"key {self._keys.index(key) + 1} of {len(self._keys)}"

    async def run(self, call: Callable[[str], Awaitable[T]]) -> T:
        """Runs `call` with a random key that is free. A limit or a stall moves on to the next key; any other error is raised."""
        resting = await self._store.resting(self._keys)
        usable = [key for key in self._keys if key not in resting]
        self._rng.shuffle(usable)
        stalls, last_stall = 0, None
        for key in usable:
            try:
                return await call(key)
            except Exception as exc:
                if is_limit_error(exc):
                    seconds = limit_rest_seconds(exc)
                    logger.warning("A Gemini key hit its limit (%s); it rests %.0f s", self._position(key), seconds)
                elif is_stall(exc):
                    seconds, stalls, last_stall = STALL_REST_SECONDS, stalls + 1, exc
                    logger.warning("A Gemini key did not answer in time (%s); it rests %.0f s", self._position(key), seconds)
                else:
                    raise
                resting[key] = seconds
                await self._store.rest(key, seconds)
                if stalls >= MAX_STALLS:
                    raise AllKeysSlow() from exc
        if last_stall:
            raise AllKeysSlow() from last_stall
        logger.warning("Every Gemini key is resting")
        raise AllKeysBusy(min(resting.values(), default=DEFAULT_REST_SECONDS))
