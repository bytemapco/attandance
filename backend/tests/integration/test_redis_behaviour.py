"""Redis behaviour the mocks cannot prove: the Lua scripts run atomically and the lockout really locks."""
import asyncio
import os

import pytest
from fastapi import HTTPException
from redis.asyncio import Redis

from app.core.redis_scripts import atomic_incr_expire, atomic_release_lock, atomic_sliding_window
from app.services import login_lockout


@pytest.fixture
async def redis():
    url = os.environ.get("TEST_REDIS_URL")
    if not url:
        pytest.skip("TEST_REDIS_URL is not set; Redis tests need a Redis server.")
    client = Redis.from_url(url, decode_responses=True)
    await client.flushdb()
    yield client
    await client.flushdb()
    await client.aclose()


async def test_the_counter_sets_its_expiry_only_on_first_creation(redis):
    assert await atomic_incr_expire(redis, "k", 100) == 1
    await redis.expire("k", 50)

    assert await atomic_incr_expire(redis, "k", 100) == 2
    assert 0 < await redis.ttl("k") <= 50


async def test_concurrent_increments_never_lose_a_count(redis):
    results = await asyncio.gather(*(atomic_incr_expire(redis, "k", 100) for _ in range(50)))

    assert sorted(results) == list(range(1, 51))
    assert await redis.ttl("k") > 0


async def test_the_sliding_window_allows_exactly_its_limit(redis):
    outcomes = [await atomic_sliding_window(redis, "rl", requests_limit=3, window_seconds=60) for _ in range(5)]

    assert [allowed for allowed, _ in outcomes] == [True, True, True, False, False]
    assert outcomes[2][1] == 3 and outcomes[3][1] == 3


async def test_concurrent_requests_cannot_exceed_the_window_limit(redis):
    outcomes = await asyncio.gather(*(atomic_sliding_window(redis, "rl", 10, 60) for _ in range(40)))

    assert sum(allowed for allowed, _ in outcomes) == 10


async def test_a_lock_is_released_only_by_its_owner(redis):
    await redis.set("lock", "owner-1")

    assert await atomic_release_lock(redis, "lock", "someone-else") is False
    assert await redis.get("lock") == "owner-1"
    assert await atomic_release_lock(redis, "lock", "owner-1") is True
    assert await redis.get("lock") is None


async def test_five_wrong_passwords_lock_the_account_and_a_good_login_clears_it(redis):
    key = "failed_login:student@example.test"
    for _ in range(4):
        await login_lockout.count_failure(redis, key)
        await login_lockout.reject_if_locked(redis, key)

    await login_lockout.count_failure(redis, key)
    with pytest.raises(HTTPException) as caught:
        await login_lockout.reject_if_locked(redis, key)
    assert caught.value.status_code == 429
    assert 0 < await redis.ttl(key) <= login_lockout.FAILED_LOGIN_WINDOW_SECONDS

    await login_lockout.clear_failures(redis, key)
    await login_lockout.reject_if_locked(redis, key)
