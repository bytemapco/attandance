from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services import login_lockout, token_revocation
from app.services.token_revocation import ACCESS_TOKEN, REFRESH_TOKEN, ensure_not_revoked, revoke


def redis_returning(value=None, error=None):
    redis = MagicMock()
    redis.get = AsyncMock(return_value=value, side_effect=error)
    redis.setex = AsyncMock()
    return redis


@pytest.fixture
def use_redis(monkeypatch):
    def apply(redis):
        monkeypatch.setattr(token_revocation, "safe_redis", lambda: redis)

    return apply


class TestEnsureNotRevoked:
    async def test_a_token_not_on_the_deny_list_passes(self, use_redis):
        use_redis(redis_returning(None))
        await ensure_not_revoked("tok", ACCESS_TOKEN)

    async def test_a_denied_token_is_a_401_with_the_matching_message(self, use_redis):
        use_redis(redis_returning("revoked"))

        with pytest.raises(HTTPException) as caught:
            await ensure_not_revoked("tok", REFRESH_TOKEN)

        assert caught.value.status_code == 401
        assert caught.value.detail == REFRESH_TOKEN.revoked

    async def test_without_redis_the_token_passes_by_default(self, use_redis, monkeypatch):
        monkeypatch.setattr(settings, "TOKEN_REVOCATION_FAIL_CLOSED", False)
        use_redis(None)
        await ensure_not_revoked("tok", ACCESS_TOKEN)

    async def test_without_redis_a_fail_closed_deployment_answers_503(self, use_redis, monkeypatch):
        monkeypatch.setattr(settings, "TOKEN_REVOCATION_FAIL_CLOSED", True)
        use_redis(None)

        with pytest.raises(HTTPException) as caught:
            await ensure_not_revoked("tok", ACCESS_TOKEN)

        assert caught.value.status_code == 503

    async def test_a_redis_error_passes_when_failing_open(self, use_redis, monkeypatch):
        monkeypatch.setattr(settings, "TOKEN_REVOCATION_FAIL_CLOSED", False)
        use_redis(redis_returning(error=ConnectionError("down")))
        await ensure_not_revoked("tok", ACCESS_TOKEN)

    async def test_a_redis_error_is_a_503_when_failing_closed(self, use_redis, monkeypatch):
        monkeypatch.setattr(settings, "TOKEN_REVOCATION_FAIL_CLOSED", True)
        use_redis(redis_returning(error=ConnectionError("down")))

        with pytest.raises(HTTPException) as caught:
            await ensure_not_revoked("tok", ACCESS_TOKEN)

        assert caught.value.status_code == 503


class TestRevoke:
    async def test_the_token_is_denied_until_it_would_have_expired(self, use_redis):
        redis = redis_returning()
        use_redis(redis)

        await revoke("tok", 600)

        redis.setex.assert_awaited_once_with("denylist:tok", 600, "revoked")

    async def test_without_redis_nothing_is_recorded_and_nothing_fails(self, use_redis):
        use_redis(None)
        await revoke("tok", 600)

    async def test_a_redis_error_while_revoking_is_swallowed(self, use_redis):
        redis = redis_returning()
        redis.setex.side_effect = ConnectionError("down")
        use_redis(redis)
        await revoke("tok", 600)


class TestLoginLockout:
    async def test_fewer_than_five_failures_do_not_lock(self):
        await login_lockout.reject_if_locked(redis_returning("4"), "failed_login:a")

    async def test_the_fifth_failure_locks_the_account_with_a_429(self):
        with pytest.raises(HTTPException) as caught:
            await login_lockout.reject_if_locked(redis_returning("5"), "failed_login:a")
        assert caught.value.status_code == 429

    async def test_no_failures_recorded_does_not_lock(self):
        await login_lockout.reject_if_locked(redis_returning(None), "failed_login:a")

    async def test_without_redis_nothing_locks_and_nothing_counts(self):
        await login_lockout.reject_if_locked(None, "k")
        await login_lockout.count_failure(None, "k")
        await login_lockout.clear_failures(None, "k")

    async def test_a_redis_error_on_the_check_does_not_lock_anyone_out(self):
        await login_lockout.reject_if_locked(redis_returning(error=ConnectionError("down")), "k")

    async def test_a_failure_is_counted_with_the_fifteen_minute_window(self, monkeypatch):
        counter = AsyncMock()
        monkeypatch.setattr(login_lockout, "atomic_incr_expire", counter)
        redis = redis_returning()

        await login_lockout.count_failure(redis, "failed_login:a")

        counter.assert_awaited_once_with(redis, "failed_login:a", 900)

    async def test_a_redis_error_while_counting_is_swallowed(self, monkeypatch):
        monkeypatch.setattr(login_lockout, "atomic_incr_expire", AsyncMock(side_effect=ConnectionError("down")))
        await login_lockout.count_failure(redis_returning(), "k")

    async def test_a_good_login_clears_the_counter(self):
        redis = redis_returning()
        redis.delete = AsyncMock()

        await login_lockout.clear_failures(redis, "failed_login:a")

        redis.delete.assert_awaited_once_with("failed_login:a")
