from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.services.agent import budget
from app.services.agent.types import TEACHER, Principal


def who():
    return Principal(user=SimpleNamespace(id="user-1"), role=TEACHER, tenant_id="tenant-1")


@pytest.fixture
def redis(monkeypatch):
    fake = SimpleNamespace(get=AsyncMock(return_value=None), incrby=AsyncMock(), expire=AsyncMock())
    monkeypatch.setattr(budget, "safe_redis", lambda: fake)
    monkeypatch.setattr(budget, "atomic_incr_expire", AsyncMock(return_value=1))
    return fake


@pytest.fixture
def no_redis(monkeypatch):
    monkeypatch.setattr(budget, "safe_redis", lambda: None)


class TestMessageLimit:
    async def test_messages_within_the_limit_pass(self, redis):
        budget.atomic_incr_expire.return_value = budget.settings.AGENT_MESSAGES_PER_MINUTE
        await budget.limit_messages(who())

    async def test_one_message_over_the_limit_is_slowed_with_a_retry_hint(self, redis):
        budget.atomic_incr_expire.return_value = budget.settings.AGENT_MESSAGES_PER_MINUTE + 1
        with pytest.raises(HTTPException) as caught:
            await budget.limit_messages(who())
        assert caught.value.status_code == 429 and caught.value.headers["Retry-After"] == "60"

    async def test_the_count_is_per_person(self, redis):
        await budget.limit_messages(who())
        assert budget.atomic_incr_expire.call_args.args[1] == "agent:messages:user-1"

    async def test_without_redis_nothing_is_limited(self, no_redis):
        await budget.limit_messages(who())


class TestDailyBudget:
    async def test_below_the_budget_passes(self, redis):
        redis.get.return_value = str(budget.settings.AGENT_DAILY_TOKEN_BUDGET - 1)
        await budget.require_budget(who())

    async def test_at_the_budget_the_institution_is_stopped(self, redis):
        redis.get.return_value = str(budget.settings.AGENT_DAILY_TOKEN_BUDGET)
        with pytest.raises(HTTPException) as caught:
            await budget.require_budget(who())
        assert caught.value.status_code == 429

    async def test_the_counter_is_per_institution_and_per_day(self, redis):
        await budget.require_budget(who())
        key = redis.get.call_args.args[0]
        assert key.startswith("agent:tokens:tenant-1:") and len(key.split(":")[-1]) == 8

    async def test_without_redis_the_budget_is_not_enforced(self, no_redis):
        await budget.require_budget(who())


class TestRecordTokens:
    async def test_tokens_are_added_and_the_counter_expires(self, redis):
        await budget.record_tokens(who(), 120)
        redis.incrby.assert_awaited_once()
        assert redis.incrby.call_args.args[1] == 120
        assert redis.expire.call_args.args[1] == budget.TWO_DAYS

    @pytest.mark.parametrize("tokens", [0, -5])
    async def test_nothing_is_recorded_for_no_tokens(self, redis, tokens):
        await budget.record_tokens(who(), tokens)
        redis.incrby.assert_not_awaited()
