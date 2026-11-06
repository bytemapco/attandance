from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.services.agent import gateway
from app.services.agent.types import ADMIN, TEACHER, Preview, Principal, Tool, ToolResult


class Args(BaseModel):
    count: int = Field(ge=1, le=5)


def principal(role=TEACHER):
    return Principal(user=SimpleNamespace(id="user-1"), role=role, tenant_id="tenant-1")


async def read(who, args):
    return ToolResult({"double": args.count * 2}, [{"kind": "link", "label": "x", "path": "/x"}])


async def broken(who, args):
    raise HTTPException(status_code=404, detail="No matching class found.")


async def crash(who, args):
    raise RuntimeError("secret database detail")


async def preview(who, args):
    return Preview("Do it", {"count": args.count})


def tool(run=read, roles=frozenset({TEACHER}), **extra):
    return Tool("demo", "Demo tool", Args, roles, run, **extra)


@pytest.fixture
def log(monkeypatch):
    recorded = AsyncMock()
    monkeypatch.setattr(gateway.audit, "log_tool_call", recorded)
    return recorded


def outcomes(log):
    return [call.args[3] for call in log.call_args_list]


async def test_a_read_tool_returns_data_for_the_model_and_blocks_for_the_screen(log):
    result = await gateway.call_tool(principal(), tool(), "demo", {"count": 2}, "conv-1")
    assert result.response == {"double": 4}
    assert result.ui[0]["kind"] == "link"
    assert outcomes(log) == ["ok"]


async def test_an_unknown_tool_is_refused_and_recorded(log):
    result = await gateway.call_tool(principal(), None, "delete_everything", {}, None)
    assert "not available" in result.response["error"]
    assert outcomes(log) == ["denied"]


async def test_a_role_not_on_the_tool_is_refused(log):
    admin_only = tool(roles=frozenset({ADMIN}))
    result = await gateway.call_tool(principal(TEACHER), admin_only, "demo", {"count": 1}, None)
    assert "not available" in result.response["error"]
    assert outcomes(log) == ["denied"]


async def test_bad_arguments_are_reported_to_the_model_so_it_can_retry(log):
    result = await gateway.call_tool(principal(), tool(), "demo", {"count": 99}, None)
    assert "Invalid arguments" in result.response["error"]
    assert outcomes(log) == ["error"]


async def test_a_service_error_reaches_the_model_as_its_plain_message(log):
    result = await gateway.call_tool(principal(), tool(broken), "demo", {"count": 1}, None)
    assert result.response == {"error": "No matching class found."}


async def test_an_unexpected_crash_does_not_leak_its_detail(log):
    result = await gateway.call_tool(principal(), tool(crash), "demo", {"count": 1}, None)
    assert "secret" not in str(result.response)
    assert outcomes(log) == ["error"]


async def test_a_write_tool_only_prepares_a_proposal_and_never_runs(log, monkeypatch):
    run = AsyncMock()
    stored = SimpleNamespace(
        id="prop-1", arguments={"count": 3}, summary="Do it", preview={"count": 3},
        expiresAt=__import__("datetime").datetime(2030, 1, 1),
    )
    monkeypatch.setattr(gateway.proposals, "create", AsyncMock(return_value=stored))
    result = await gateway.call_tool(principal(), tool(run, preview=preview), "demo", {"count": 3}, "conv-1")
    run.assert_not_awaited()
    assert result.response["status"] == "awaiting_confirmation"
    assert result.card["id"] == "prop-1"
    assert outcomes(log) == ["proposed"]


async def test_every_call_is_logged_with_the_person_and_their_institution(log):
    await gateway.call_tool(principal(), tool(), "demo", {"count": 1}, "conv-1")
    who = log.call_args.args[0]
    assert (who.user_id, who.tenant_id) == ("user-1", "tenant-1")
