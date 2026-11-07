"""The key pool's memory against a real Redis: a rest is stored, found again, and expires on its own."""
import asyncio
import os

import pytest
import redis.asyncio as redis_async

from app.services.agent import key_pool
from app.services.agent.key_pool import RedisRest


@pytest.fixture
def real_redis(monkeypatch):
    url = os.environ.get("TEST_REDIS_URL")
    if not url:
        pytest.skip("TEST_REDIS_URL is not set.")
    client = redis_async.Redis.from_url(url)
    monkeypatch.setattr(key_pool, "safe_redis", lambda: client)
    yield client


def run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


def test_a_rest_is_found_again_never_holds_the_key_and_expires(real_redis):
    async def scenario():
        store = RedisRest()
        await store.rest("AIzaSecretKey", 2)
        left = await store.resting(["AIzaSecretKey", "AIzaOther"])
        names = [name async for name in real_redis.scan_iter("agent:gemini:rest:*")]
        ttl = await real_redis.ttl(names[0])
        await real_redis.aclose()
        return left, names, ttl

    left, names, ttl = run(scenario())

    assert list(left) == ["AIzaSecretKey"] and 0 < left["AIzaSecretKey"] <= 2
    assert len(names) == 1 and b"AIzaSecretKey" not in names[0] and 0 < ttl <= 2
