"""Gemini API keys. One key is used at a time; a key that hits its limit rests for a minute and the next one takes over."""
import time
from typing import Awaitable, Callable, TypeVar

from app.core.logging_config import get_logger

logger = get_logger("app.agent.keys")
LIMIT_CODE = 429
LIMIT_COOLDOWN_SECONDS = 60.0

T = TypeVar("T")


class AllKeysBusy(Exception):
    """Every key is at its limit. The loop tells the person to try again in a minute."""

    code = LIMIT_CODE


def parse_keys(raw: str) -> list[str]:
    """Keys separated by commas. Blanks and repeats are dropped, order is kept."""
    return list(dict.fromkeys(part.strip() for part in raw.split(",") if part.strip()))


def is_limit_error(exc: Exception) -> bool:
    return getattr(exc, "code", None) == LIMIT_CODE


class KeyPool:
    def __init__(
        self,
        keys: list[str],
        cooldown: float = LIMIT_COOLDOWN_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._keys = keys
        self._cooldown = cooldown
        self._clock = clock
        self._resting_until = [0.0] * len(keys)
        self._current = 0

    def _order(self) -> list[int]:
        """The keys that are not resting, starting with the one that worked last."""
        now = self._clock()
        starts_at = [(self._current + step) % len(self._keys) for step in range(len(self._keys))]
        return [index for index in starts_at if self._resting_until[index] <= now]

    async def run(self, call: Callable[[str], Awaitable[T]]) -> T:
        """Runs `call` with the first key that is free. Only a limit error moves on; any other error is raised."""
        for index in self._order():
            try:
                result = await call(self._keys[index])
            except Exception as exc:
                if not is_limit_error(exc):
                    raise
                self._resting_until[index] = self._clock() + self._cooldown
                logger.warning("A Gemini key hit its limit (key %d of %d); trying the next key", index + 1, len(self._keys))
                continue
            self._current = index
            return result
        logger.warning("Every Gemini key is at its limit")
        raise AllKeysBusy()
