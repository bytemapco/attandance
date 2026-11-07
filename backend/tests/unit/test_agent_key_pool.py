import math
import random
from datetime import datetime, timezone

import pytest

from app.services.agent import key_pool
from app.services.agent.key_pool import (
    DEFAULT_REST_SECONDS,
    MAX_STALLS,
    STALL_REST_SECONDS,
    AllKeysBusy,
    AllKeysSlow,
    KeyPool,
    RedisRest,
    is_limit_error,
    is_stall,
    limit_rest_seconds,
    parse_keys,
    seconds_until_midnight_pacific,
)


class InOrder(random.Random):
    """Keeps the keys in the order given, so a test knows which key is asked first."""

    def shuffle(self, x):
        return None


class Limit(Exception):
    """Gemini's 429. `details` is the error body the SDK keeps."""

    code = 429

    def __init__(self, details=None):
        super().__init__("quota")
        self.details = details


class Gateway(Exception):
    def __init__(self, code):
        super().__init__("gateway")
        self.code = code


def body(*details):
    return {"error": {"code": 429, "status": "RESOURCE_EXHAUSTED", "details": list(details)}}


def retry_in(delay):
    return {"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": delay}


def quota(quota_id):
    return {"@type": "type.googleapis.com/google.rpc.QuotaFailure", "violations": [{"quotaId": quota_id}]}


class Memory:
    """Stands in for Redis: the seconds each key still has to rest."""

    def __init__(self, resting=None):
        self.left = dict(resting or {})
        self.rested = {}

    async def resting(self, keys):
        return {key: self.left[key] for key in keys if self.left.get(key, 0) > 0}

    async def rest(self, key, seconds):
        self.rested[key] = seconds
        self.left[key] = seconds


class Provider:
    """Answers with each key's name, or fails the way it is told to."""

    def __init__(self, fail=None):
        self.fail = fail or {}
        self.asked = []

    async def __call__(self, key):
        self.asked.append(key)
        if key in self.fail:
            raise self.fail[key]
        return f"answer from {key}"


def pool(keys, store=None, seed=None):
    return KeyPool(keys, store=store or Memory(), rng=random.Random(seed) if seed is not None else InOrder())


def test_keys_are_split_on_commas_and_blanks_and_repeats_are_dropped():
    assert parse_keys(" AIza1 , AQ.2,,AIza1 ,") == ["AIza1", "AQ.2"]
    assert parse_keys("") == []
    assert parse_keys(" , ") == []


def test_only_a_429_is_a_limit_and_only_a_timeout_or_503_or_504_is_a_stall():
    assert is_limit_error(Limit()) and not is_limit_error(Gateway(504))
    assert is_stall(TimeoutError()) and is_stall(Gateway(503)) and is_stall(Gateway(504))
    assert not is_stall(Limit()) and not is_stall(ValueError("bad request")) and not is_stall(Gateway(500))


class TestHowLongAKeyRests:
    def test_a_per_minute_limit_rests_for_the_time_google_gives(self):
        assert limit_rest_seconds(Limit(body(quota("GenerateRequestsPerMinutePerProjectPerModel-FreeTier"), retry_in("27s")))) == 27

    def test_a_fraction_of_a_second_is_rounded_up(self):
        assert limit_rest_seconds(Limit(body(retry_in("36.2s")))) == 37

    def test_a_daily_limit_rests_until_the_daily_quota_resets_whatever_the_retry_time_says(self, monkeypatch):
        monkeypatch.setattr(key_pool, "seconds_until_midnight_pacific", lambda: 7200.0)
        exc = Limit(body(quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier"), retry_in("3s")))
        assert limit_rest_seconds(exc) == 7200

    @pytest.mark.parametrize("details", [None, "text", {}, {"error": {}}, body(), body(retry_in("soon")), body(retry_in(None)), {"error": {"details": ["x", 3]}}])
    def test_a_429_that_says_nothing_usable_rests_the_default(self, details):
        assert limit_rest_seconds(Limit(details)) == DEFAULT_REST_SECONDS

    def test_a_retry_time_of_zero_still_rests_a_second(self):
        assert limit_rest_seconds(Limit(body(retry_in("0s")))) == 1

    def test_the_daily_reset_is_midnight_pacific(self):
        assert seconds_until_midnight_pacific(datetime(2026, 11, 7, 6, 0, tzinfo=timezone.utc)) == 2 * 3600  # 22:00 PST on the 6th

    def test_the_daily_reset_counts_the_real_hours_on_a_clock_change_day(self):
        # 01:00 PST on 8 March 2026; the clocks go forward at 02:00, so midnight is 22 hours away, not 23
        assert seconds_until_midnight_pacific(datetime(2026, 3, 8, 9, 0, tzinfo=timezone.utc)) == 22 * 3600


class TestPicking:
    async def test_every_key_gets_used_over_many_requests(self):
        provider = Provider()
        keys_pool = pool(["a", "b", "c"], seed=1)
        for _ in range(60):
            await keys_pool.run(provider)
        assert set(provider.asked) == {"a", "b", "c"}

    async def test_the_choice_is_random_not_the_key_that_worked_last(self):
        provider = Provider()
        keys_pool = pool(["a", "b", "c", "d"], seed=7)
        for _ in range(12):
            await keys_pool.run(provider)
        assert len(set(provider.asked)) > 1

    async def test_a_resting_key_is_never_asked(self):
        provider = Provider()
        keys_pool = pool(["a", "b", "c"], store=Memory({"a": 30, "c": 30}), seed=3)
        for _ in range(10):
            await keys_pool.run(provider)
        assert set(provider.asked) == {"b"}


class TestLimits:
    async def test_a_limited_key_hands_the_same_request_to_the_next_key(self):
        provider = Provider({"a": Limit()})
        assert await pool(["a", "b", "c"]).run(provider) == "answer from b"
        assert provider.asked == ["a", "b"]

    async def test_the_key_rests_for_the_time_in_the_429(self):
        store = Memory()
        await pool(["a", "b"], store).run(Provider({"a": Limit(body(retry_in("27s")))}))
        assert store.rested == {"a": 27}

    async def test_a_key_that_hit_its_daily_limit_is_not_asked_again_on_the_next_request(self, monkeypatch):
        monkeypatch.setattr(key_pool, "seconds_until_midnight_pacific", lambda: 20000.0)
        provider = Provider({"a": Limit(body(quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier")))})
        keys_pool = pool(["a", "b"])
        await keys_pool.run(provider)
        provider.asked.clear()

        await keys_pool.run(provider)
        assert provider.asked == ["b"]

    async def test_a_key_comes_back_when_its_rest_is_over(self):
        store = Memory()
        provider = Provider({"a": Limit()})
        keys_pool = pool(["a", "b"], store)
        await keys_pool.run(provider)
        store.left.clear()  # the rest has run out
        provider.fail.clear()
        provider.asked.clear()

        await keys_pool.run(provider)
        assert provider.asked == ["a"]

    async def test_when_every_key_is_resting_the_caller_hears_when_the_first_is_free_and_nothing_is_asked(self):
        provider = Provider({"a": Limit(body(retry_in("90s"))), "b": Limit(body(retry_in("40s")))})
        keys_pool = pool(["a", "b"])
        with pytest.raises(AllKeysBusy) as caught:
            await keys_pool.run(provider)
        assert caught.value.retry_after == 40 and caught.value.code == 429

        provider.asked.clear()
        with pytest.raises(AllKeysBusy) as again:
            await keys_pool.run(provider)
        assert provider.asked == [] and again.value.retry_after == 40


class TestStalls:
    async def test_a_key_that_times_out_rests_briefly_and_the_next_key_answers(self):
        store = Memory()
        provider = Provider({"a": TimeoutError()})
        assert await pool(["a", "b"], store).run(provider) == "answer from b"
        assert store.rested == {"a": STALL_REST_SECONDS}

    @pytest.mark.parametrize("code", [503, 504])
    async def test_a_gateway_error_is_treated_as_a_stall(self, code):
        provider = Provider({"a": Gateway(code)})
        assert await pool(["a", "b"]).run(provider) == "answer from b"

    async def test_only_a_few_stalled_keys_are_tried_before_giving_up(self):
        keys = ["a", "b", "c", "d", "e"]
        provider = Provider({key: TimeoutError() for key in keys})
        with pytest.raises(AllKeysSlow):
            await pool(keys).run(provider)
        assert len(provider.asked) == MAX_STALLS

    async def test_a_limit_does_not_count_against_the_stall_cap(self):
        provider = Provider({"a": Limit(), "b": Limit(), "c": TimeoutError(), "d": TimeoutError()})
        assert await pool(["a", "b", "c", "d", "e"]).run(provider) == "answer from e"
        assert provider.asked == ["a", "b", "c", "d", "e"]

    async def test_a_mix_of_limits_and_stalls_ends_as_slow_not_busy(self):
        provider = Provider({"a": Limit(), "b": TimeoutError()})
        with pytest.raises(AllKeysSlow):
            await pool(["a", "b"]).run(provider)


async def test_an_error_that_is_neither_is_raised_and_no_other_key_is_tried_or_rested():
    store = Memory()
    provider = Provider({"a": ValueError("bad request")})
    with pytest.raises(ValueError):
        await pool(["a", "b"], store).run(provider)
    assert provider.asked == ["a"] and store.rested == {}


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.expiry = {}

    async def mget(self, names):
        return [self.values.get(name) for name in names]

    async def set(self, name, value, ex):
        self.values[name] = str(value).encode()
        self.expiry[name] = ex


class TestRedisMemory:
    @pytest.fixture
    def redis(self, monkeypatch):
        fake = FakeRedis()
        monkeypatch.setattr(key_pool, "safe_redis", lambda: fake)
        return fake

    async def test_a_rest_is_stored_by_hash_never_by_the_key_and_expires_by_itself(self, redis):
        await RedisRest(clock=lambda: 1000.0).rest("AIzaSecretKey", 27.4)
        [name] = redis.values
        assert "AIzaSecretKey" not in name and name.startswith("agent:gemini:rest:")
        assert redis.expiry[name] == math.ceil(27.4)

    async def test_the_seconds_left_come_back_and_free_keys_are_left_out(self, redis):
        store = RedisRest(clock=lambda: 1000.0)
        await store.rest("a", 30)
        assert await store.resting(["a", "b"]) == {"a": 30}
        assert await RedisRest(clock=lambda: 1010.0).resting(["a", "b"]) == {"a": 20}

    async def test_a_rest_that_has_run_out_is_ignored_even_before_redis_drops_it(self, redis):
        await RedisRest(clock=lambda: 1000.0).rest("a", 30)
        assert await RedisRest(clock=lambda: 1031.0).resting(["a"]) == {}

    async def test_without_redis_nothing_is_remembered_and_nothing_fails(self, monkeypatch):
        monkeypatch.setattr(key_pool, "safe_redis", lambda: None)
        store = RedisRest()
        await store.rest("a", 30)
        assert await store.resting(["a"]) == {}
