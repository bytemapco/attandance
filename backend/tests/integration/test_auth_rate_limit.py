"""The sign-in throttle against a real Redis: a shared address must not lock out a classroom."""
import os

import pytest
from fastapi import HTTPException
from redis.asyncio import Redis
from starlette.requests import Request

from app.core import rate_limit
from app.core.rate_limit import AUTH_ATTEMPTS_PER_ADDRESS, AUTH_ATTEMPTS_PER_IDENTITY, limit_auth_attempts
from tests.integration.institution import LOGIN, PASSWORD, Institution


def request_from(address: str) -> Request:
    return Request({"type": "http", "client": (address, 40000), "headers": []})


@pytest.fixture
async def redis(monkeypatch):
    url = os.environ.get("TEST_REDIS_URL")
    if not url:
        pytest.skip("TEST_REDIS_URL is not set; the throttle needs a Redis server.")
    client = Redis.from_url(url, decode_responses=True)
    await client.flushdb()
    monkeypatch.setattr(rate_limit, "safe_redis", lambda: client)
    yield client
    await client.flushdb()
    await client.aclose()


async def test_a_whole_class_behind_one_address_can_sign_in_together(redis):
    for student in range(100):
        await limit_auth_attempts(request_from("203.0.113.7"), "login", f"VIT24CS{student:03d}")


async def test_one_identity_from_one_address_is_throttled_after_its_limit(redis):
    for _ in range(AUTH_ATTEMPTS_PER_IDENTITY):
        await limit_auth_attempts(request_from("203.0.113.7"), "login", "asha@college.in")

    with pytest.raises(HTTPException) as caught:
        await limit_auth_attempts(request_from("203.0.113.7"), "login", "asha@college.in")

    assert caught.value.status_code == 429
    assert caught.value.headers["Retry-After"] == "60"


async def test_the_identity_limit_ignores_case_and_spaces(redis):
    for _ in range(AUTH_ATTEMPTS_PER_IDENTITY):
        await limit_auth_attempts(request_from("203.0.113.7"), "login", "Asha@College.in")

    with pytest.raises(HTTPException):
        await limit_auth_attempts(request_from("203.0.113.7"), "login", " asha@college.in ")


async def test_another_address_is_not_affected_by_a_throttled_one(redis):
    for _ in range(AUTH_ATTEMPTS_PER_IDENTITY + 1):
        try:
            await limit_auth_attempts(request_from("203.0.113.7"), "login", "asha@college.in")
        except HTTPException:
            pass

    await limit_auth_attempts(request_from("198.51.100.9"), "login", "asha@college.in")


async def test_an_address_that_floods_with_many_identities_hits_the_ceiling(redis):
    for attempt in range(AUTH_ATTEMPTS_PER_ADDRESS):
        await limit_auth_attempts(request_from("203.0.113.7"), "login", f"user-{attempt}")

    with pytest.raises(HTTPException) as caught:
        await limit_auth_attempts(request_from("203.0.113.7"), "login", "one-more")

    assert caught.value.status_code == 429


async def test_each_kind_of_call_has_its_own_budget(redis):
    for _ in range(AUTH_ATTEMPTS_PER_IDENTITY):
        await limit_auth_attempts(request_from("203.0.113.7"), "login", "asha@college.in")

    await limit_auth_attempts(request_from("203.0.113.7"), "forgot-password", "asha@college.in")


async def test_no_email_or_token_is_stored_in_a_redis_key(redis):
    await limit_auth_attempts(request_from("203.0.113.7"), "login", "asha@college.in")
    await limit_auth_attempts(request_from("203.0.113.7"), "reset-password", "secret-reset-token")

    keys = [key async for key in redis.scan_iter("ratelimit:auth:*")]

    assert keys and not any("asha" in key or "secret-reset-token" in key for key in keys)


def test_fifteen_students_on_one_address_all_sign_in_over_http(client, seed):
    colleges = [Institution(seed) for _ in range(15)]

    outcomes = [
        client.post(LOGIN, json={"email": c.email, "password": PASSWORD}, headers=c.headers).status_code
        for c in colleges
    ]

    assert outcomes == [200] * 15


def test_hammering_one_account_over_http_is_throttled(client, seed):
    college = Institution(seed)
    body = {"email": college.email, "password": PASSWORD}

    outcomes = [client.post(LOGIN, json=body, headers=college.headers).status_code for _ in range(AUTH_ATTEMPTS_PER_IDENTITY + 1)]

    assert outcomes == [200] * AUTH_ATTEMPTS_PER_IDENTITY + [429]
