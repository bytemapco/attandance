from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pydantic import BaseModel

from app.services.agent import loop
from app.services.agent.gateway import Outcome
from app.services.agent.llm import LlmTurn, ToolCall
from app.services.agent.types import TEACHER, Principal, Tool, ToolResult


class NoArgs(BaseModel):
    pass


async def noop(who, args):
    return ToolResult({})


TOOL = Tool("my_schedule", "d", NoArgs, frozenset({TEACHER}), noop)


class ScriptedLlm:
    """Plays back a fixed list of model turns and keeps what it was shown."""

    def __init__(self, *turns):
        self.turns = list(turns)
        self.seen = []

    async def generate(self, system, history, tools):
        self.seen.append((system, list(history), [t.name for t in tools]))
        turn = self.turns.pop(0)
        if isinstance(turn, Exception):
            raise turn
        return turn


@pytest.fixture
def parts(monkeypatch):
    saved = AsyncMock()
    monkeypatch.setattr(loop.conversation, "history", AsyncMock(return_value=[]))
    monkeypatch.setattr(loop.conversation, "add_message", saved)
    monkeypatch.setattr(loop.budget, "require_budget", AsyncMock())
    monkeypatch.setattr(loop.budget, "record_tokens", AsyncMock())
    monkeypatch.setattr(loop.registry, "tools_for", lambda role: [TOOL])
    monkeypatch.setattr(loop.registry, "get", lambda name: TOOL)
    monkeypatch.setattr(loop.prompts, "system_prompt", lambda *a, **k: "system")
    return SimpleNamespace(saved=saved)


def who():
    return Principal(user=SimpleNamespace(id="user-1"), role=TEACHER, tenant_id="tenant-1")


async def play(llm):
    return [event async for event in loop.run_turn(who(), "Demo College", "conv-1", "hi", llm)]


def saved_roles(parts):
    return [call.args[2] for call in parts.saved.call_args_list]


async def test_a_plain_answer_is_streamed_and_saved(parts):
    events = await play(ScriptedLlm(LlmTurn(text="Hello")))
    assert events == [{"type": "text", "text": "Hello"}]
    assert saved_roles(parts) == ["user", "assistant"]


async def test_the_model_is_only_offered_the_tools_of_the_persons_role(parts):
    llm = ScriptedLlm(LlmTurn(text="ok"))
    await play(llm)
    assert llm.seen[0][2] == ["my_schedule"]


async def test_a_tool_round_trip_shows_the_tool_its_result_and_then_the_answer(parts, monkeypatch):
    block = {"kind": "table", "title": "t", "columns": [], "rows": []}
    monkeypatch.setattr(loop.gateway, "call_tool", AsyncMock(return_value=Outcome({"n": 1}, [block])))
    llm = ScriptedLlm(LlmTurn(calls=[ToolCall("my_schedule", {})]), LlmTurn(text="You have 1 class"))
    events = await play(llm)
    assert [e["type"] for e in events] == ["tool", "ui", "text"]
    assert llm.seen[1][1][-1] == {"role": "tool", "results": [{"name": "my_schedule", "response": {"n": 1}}]}
    assert parts.saved.call_args_list[-1].args[4] == [{"type": "ui", **block}]


async def test_a_proposal_card_is_shown_to_the_person(parts, monkeypatch):
    card = {"type": "proposal", "id": "p1", "summary": "Send"}
    monkeypatch.setattr(loop.gateway, "call_tool", AsyncMock(return_value=Outcome({"status": "awaiting_confirmation"}, card=card)))
    events = await play(ScriptedLlm(LlmTurn(calls=[ToolCall("my_schedule", {})]), LlmTurn(text="Please confirm")))
    assert card in events


async def test_a_model_failure_becomes_an_error_event_and_no_answer_is_saved(parts):
    events = await play(ScriptedLlm(RuntimeError("quota")))
    assert events == [{"type": "error", "message": loop.UNAVAILABLE}]
    assert saved_roles(parts) == ["user"]


async def test_the_model_providers_own_rate_limit_is_reported_as_busy(parts):
    limited = RuntimeError("quota")
    limited.code = 429
    events = await play(ScriptedLlm(limited))
    assert events == [{"type": "error", "message": loop.BUSY}]


async def test_an_exhausted_daily_budget_stops_the_turn_with_its_message(parts, monkeypatch):
    monkeypatch.setattr(loop.budget, "require_budget", AsyncMock(side_effect=HTTPException(429, "Used today's allowance")))
    events = await play(ScriptedLlm())
    assert events == [{"type": "error", "message": "Used today's allowance"}]


async def test_a_model_that_never_stops_calling_tools_is_cut_off(parts, monkeypatch):
    monkeypatch.setattr(loop.gateway, "call_tool", AsyncMock(return_value=Outcome({})))
    endless = ScriptedLlm(*[LlmTurn(calls=[ToolCall("my_schedule", {})]) for _ in range(loop.MAX_STEPS)])
    events = await play(endless)
    assert events[-1] == {"type": "text", "text": loop.TOO_LONG}
    assert sum(e["type"] == "tool" for e in events) == loop.MAX_STEPS


async def test_tokens_are_counted_against_the_institution(parts):
    await play(ScriptedLlm(LlmTurn(text="ok", tokens=123)))
    loop.budget.record_tokens.assert_awaited_once()
    assert loop.budget.record_tokens.call_args.args[1] == 123
