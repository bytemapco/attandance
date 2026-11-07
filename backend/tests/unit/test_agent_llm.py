import asyncio
import random
from types import SimpleNamespace

import pytest
from google.genai import types

from app.services.agent import key_pool, llm as llm_module, registry
from app.services.agent.key_pool import AllKeysBusy, AllKeysSlow, KeyPool
from app.services.agent.llm import GeminiLlm, _schema


def test_every_tool_schema_is_accepted_by_the_gemini_sdk():
    for tool in registry.TOOLS.values():
        declaration = types.FunctionDeclaration(
            name=tool.name, description=tool.description, parameters_json_schema=_schema(tool)
        )
        assert declaration.name == tool.name


def test_a_schema_carries_the_argument_descriptions_the_model_relies_on():
    schema = _schema(registry.TOOLS["students_below_minimum"])
    assert "title" not in schema
    assert "find_classes" in schema["properties"]["class_id"]["description"]


def test_history_becomes_user_model_and_tool_turns_in_order():
    history = [
        {"role": "user", "text": "hi", "raw": None},
        {"role": "model", "text": "hello", "raw": None},
        {"role": "user", "text": "schedule?", "raw": None},
        {"role": "tool", "results": [{"name": "my_schedule", "response": {"classes": []}}]},
    ]

    contents = GeminiLlm._contents(history)

    assert [c.role for c in contents] == ["user", "model", "user", "user"]
    assert contents[3].parts[0].function_response.name == "my_schedule"


def test_a_model_turn_with_provider_data_is_sent_back_unchanged():
    raw = types.Content(role="model", parts=[types.Part.from_function_call(name="my_schedule", args={})])

    [content] = GeminiLlm._contents([{"role": "model", "text": "", "raw": raw}])

    assert content is raw


def test_the_client_uses_the_api_version_that_allows_function_calling():
    llm = GeminiLlm("test-key", "any-model")

    assert llm._clients["test-key"]._api_client._http_options.api_version == "v1beta"


def test_one_client_is_made_for_each_key_in_the_comma_separated_setting():
    llm = GeminiLlm("key-one, key-two,key-one", "any-model")

    assert list(llm._clients) == ["key-one", "key-two"]


class Limited(Exception):
    code = 429


class InOrder(random.Random):
    """Keeps the keys in the order given, so a test knows which key is asked first."""

    def shuffle(self, x):
        return None


class NoMemory:
    async def resting(self, keys):
        return {}

    async def rest(self, key, seconds):
        return None


def in_order(llm):
    """The same keys, asked in the order given and with nothing remembered between requests."""
    llm._pool = KeyPool(list(llm._clients), store=NoMemory(), rng=InOrder())
    return llm


@pytest.fixture(autouse=True)
def no_redis(monkeypatch):
    monkeypatch.setattr(key_pool, "safe_redis", lambda: None)


def chunk(*parts, tokens=0):
    return types.GenerateContentResponse(
        candidates=[types.Candidate(content=types.Content(role="model", parts=list(parts)))],
        usage_metadata=types.GenerateContentResponseUsageMetadata(total_token_count=tokens),
    )


def serving(*chunks, fail=None):
    """A stand-in for one key's client: it streams the given chunks, or refuses to start."""

    async def generate_content_stream(**_):
        if fail:
            raise fail

        async def send():
            for item in chunks:
                yield item

        return send()

    return SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content_stream=generate_content_stream)))


async def collect(llm):
    return [item async for item in llm.stream("system", [{"role": "user", "text": "hi", "raw": None}], [])]


async def test_text_arrives_piece_by_piece_and_the_turn_closes_the_answer():
    llm = GeminiLlm("k", "m")
    llm._clients["k"] = serving(
        chunk(types.Part.from_text(text="You have ")), chunk(types.Part.from_text(text="2 classes."), tokens=42)
    )

    *pieces, turn = await collect(llm)

    assert pieces == ["You have ", "2 classes."]
    assert turn.text == "You have 2 classes." and turn.calls == [] and turn.tokens == 42
    assert [p.text for p in turn.raw.parts] == pieces


async def test_a_tool_call_is_returned_with_the_provider_data_it_came_in():
    llm = GeminiLlm("k", "m")
    call = types.Part.from_function_call(name="my_schedule", args={"day": "today"})
    llm._clients["k"] = serving(chunk(call, tokens=7))

    [turn] = await collect(llm)

    assert [(c.name, c.args) for c in turn.calls] == [("my_schedule", {"day": "today"})]
    assert turn.text == "" and turn.raw.parts == [call]


async def test_a_key_at_its_limit_hands_the_stream_to_the_next_key_before_any_text_is_sent():
    llm = in_order(GeminiLlm("first,second", "m"))
    llm._clients["first"] = serving(fail=Limited("quota"))
    llm._clients["second"] = serving(chunk(types.Part.from_text(text="Hello")))

    *pieces, turn = await collect(llm)

    assert pieces == ["Hello"] and turn.text == "Hello"


async def test_the_models_own_notes_are_never_shown_as_the_answer():
    llm = GeminiLlm("k", "m")
    thought = types.Part(text="planning the answer", thought=True)
    llm._clients["k"] = serving(chunk(thought, types.Part.from_text(text="Hello")))

    *pieces, turn = await collect(llm)

    assert pieces == ["Hello"] and turn.text == "Hello"
    assert thought in turn.raw.parts  # still sent back to the provider unchanged


async def test_an_empty_reply_ends_with_an_empty_turn():
    llm = GeminiLlm("k", "m")
    llm._clients["k"] = serving()

    assert [item.text for item in await collect(llm)] == [""]


async def test_a_chunk_with_no_candidates_is_skipped():
    llm = GeminiLlm("k", "m")
    empty = types.GenerateContentResponse(candidates=[], usage_metadata=types.GenerateContentResponseUsageMetadata(total_token_count=3))
    llm._clients["k"] = serving(empty, chunk(types.Part.from_text(text="Hi"), tokens=9))

    *pieces, turn = await collect(llm)

    assert pieces == ["Hi"] and turn.tokens == 9


async def test_an_error_that_is_not_a_limit_is_raised_and_no_other_key_is_tried():
    llm = in_order(GeminiLlm("first,second", "m"))
    llm._clients["first"] = serving(fail=ValueError("bad request"))
    llm._clients["second"] = serving(chunk(types.Part.from_text(text="never")))

    with pytest.raises(ValueError):
        await collect(llm)


async def test_every_key_at_its_limit_ends_with_the_busy_signal():
    llm = in_order(GeminiLlm("first,second", "m"))
    llm._clients["first"] = serving(fail=Limited("quota"))
    llm._clients["second"] = serving(fail=Limited("quota"))

    with pytest.raises(AllKeysBusy) as caught:
        await collect(llm)
    assert caught.value.code == 429


def silent():
    """A key that accepts the request and then says nothing."""

    async def generate_content_stream(**_):
        async def send():
            await asyncio.sleep(5)
            yield None

        return send()

    return SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content_stream=generate_content_stream)))


async def test_a_key_with_no_first_word_in_time_hands_the_stream_to_the_next_key(monkeypatch):
    monkeypatch.setattr(llm_module, "FIRST_WORD_SECONDS", 0.05)
    llm = in_order(GeminiLlm("first,second", "m"))
    llm._clients["first"] = silent()
    llm._clients["second"] = serving(chunk(types.Part.from_text(text="Hello")))

    *pieces, turn = await collect(llm)

    assert pieces == ["Hello"] and turn.text == "Hello"


async def test_when_every_key_stays_silent_the_request_ends_as_too_slow(monkeypatch):
    monkeypatch.setattr(llm_module, "FIRST_WORD_SECONDS", 0.05)
    llm = in_order(GeminiLlm("first,second", "m"))
    llm._clients["first"] = silent()
    llm._clients["second"] = silent()

    with pytest.raises(AllKeysSlow):
        await collect(llm)


def test_the_request_turns_thinking_off_and_never_calls_tools_by_itself():
    config = GeminiLlm._config("system text", [])

    assert config.thinking_config.thinking_budget == 0
    assert config.automatic_function_calling.disable is True
    assert config.system_instruction == "system text"


def test_the_same_keys_and_model_share_one_client_set_so_resting_keys_are_remembered(monkeypatch):
    monkeypatch.setattr(llm_module.settings, "GEMINI_API_KEY", "a,b")
    monkeypatch.setattr(llm_module.settings, "GEMINI_MODEL", "m")
    llm_module._gemini.cache_clear()
    llm_module.set_llm(None)

    assert llm_module.get_llm() is llm_module.get_llm()
    monkeypatch.setattr(llm_module.settings, "GEMINI_API_KEY", "a,b,c")
    assert len(llm_module.get_llm()._clients) == 3
    llm_module._gemini.cache_clear()


def test_a_fake_model_can_replace_the_real_one_for_tests():
    fake = object()
    llm_module.set_llm(fake)
    try:
        assert llm_module.get_llm() is fake
    finally:
        llm_module.set_llm(None)
