import pytest

from app.services.agent.key_pool import AllKeysBusy, KeyPool, is_limit_error, parse_keys


class LimitError(Exception):
    code = 429


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


class Provider:
    """Answers with each key's name, or raises for the keys it is told to fail."""

    def __init__(self, limited=(), broken=()):
        self.limited = set(limited)
        self.broken = set(broken)
        self.asked = []

    async def __call__(self, key):
        self.asked.append(key)
        if key in self.limited:
            raise LimitError("quota")
        if key in self.broken:
            raise ValueError("bad request")
        return f"answer from {key}"


def test_keys_are_split_on_commas_and_blanks_and_repeats_are_dropped():
    assert parse_keys(" AIza1 , AQ.2,,AIza1 ,") == ["AIza1", "AQ.2"]
    assert parse_keys("") == []
    assert parse_keys(" , ") == []


def test_only_a_429_counts_as_a_limit():
    assert is_limit_error(LimitError("quota"))
    assert not is_limit_error(ValueError("bad request"))


async def test_a_limited_key_hands_the_same_request_to_the_next_key():
    provider = Provider(limited={"a"})
    pool = KeyPool(["a", "b", "c"], clock=Clock())

    assert await pool.run(provider) == "answer from b"
    assert provider.asked == ["a", "b"]


async def test_the_key_that_worked_is_tried_first_next_time():
    provider = Provider(limited={"a"})
    pool = KeyPool(["a", "b", "c"], clock=Clock())
    await pool.run(provider)
    provider.asked.clear()

    await pool.run(provider)

    assert provider.asked == ["b"]


async def test_a_limited_key_rests_for_the_cooldown_and_then_comes_back():
    clock = Clock()
    provider = Provider(limited={"a"})
    pool = KeyPool(["a", "b"], cooldown=60, clock=clock)
    await pool.run(provider)
    provider.limited.clear()
    provider.asked.clear()

    await pool.run(provider)
    assert provider.asked == ["b"]

    clock.now += 61
    provider.asked.clear()
    assert await pool.run(provider) == "answer from b"
    assert provider.asked == ["b"]


async def test_when_every_key_is_at_its_limit_the_caller_is_told_to_wait_without_any_call():
    provider = Provider(limited={"a", "b"})
    pool = KeyPool(["a", "b"], clock=Clock())
    with pytest.raises(AllKeysBusy) as caught:
        await pool.run(provider)
    assert caught.value.code == 429

    provider.asked.clear()
    with pytest.raises(AllKeysBusy):
        await pool.run(provider)
    assert provider.asked == []


async def test_an_error_that_is_not_a_limit_is_raised_and_no_other_key_is_tried():
    provider = Provider(broken={"a"})
    pool = KeyPool(["a", "b"], clock=Clock())

    with pytest.raises(ValueError):
        await pool.run(provider)
    assert provider.asked == ["a"]
