from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import BaseModel

from app.services.agent import proposals
from app.services.agent.types import ADMIN, TEACHER, Preview, Principal, Tool, ToolResult

SOON = datetime.now(timezone.utc) + timedelta(minutes=10)


class Args(BaseModel):
    title: str
    count: int = 1


def who(role=TEACHER):
    return Principal(user=SimpleNamespace(id="user-1"), role=role, tenant_id="tenant-1")


def stored(status="PENDING", expires=SOON, arguments=None):
    return SimpleNamespace(
        id="p1", status=status, expiresAt=expires, toolName="demo", conversationId="conv-1",
        arguments=arguments or {"title": "Hello", "count": 2}, summary="Do it", preview={"n": 1},
    )


@pytest.fixture
def parts(monkeypatch):
    ran = AsyncMock(return_value=ToolResult({"message": "Done it"}))
    previewed = AsyncMock(return_value=Preview("Do it"))
    tool = Tool("demo", "d", Args, frozenset({TEACHER}), ran, preview=previewed, editable=frozenset({"title"}))
    fake_db = MagicMock()
    fake_db.agentproposal.find_first = AsyncMock(return_value=stored())
    fake_db.agentproposal.update_many = AsyncMock(return_value=1)
    fake_db.agentproposal.update = AsyncMock()
    log = AsyncMock()
    monkeypatch.setattr(proposals, "db", fake_db)
    monkeypatch.setattr(proposals.audit, "log_tool_call", log)
    monkeypatch.setattr(proposals.registry, "get", lambda name: tool if name == "demo" else None)
    return SimpleNamespace(db=fake_db, tool=tool, ran=ran, previewed=previewed, log=log)


async def refused(call, code):
    with pytest.raises(HTTPException) as caught:
        await call
    assert caught.value.status_code == code


def test_the_card_shows_the_plan_and_only_the_editable_fields(parts):
    card = proposals.card(stored(), parts.tool)
    assert card["editable"] == {"title": "Hello"}
    assert (card["type"], card["id"], card["summary"]) == ("proposal", "p1", "Do it")


class TestConfirm:
    async def test_it_runs_the_change_once_and_logs_it(self, parts):
        done = await proposals.confirm(who(), "p1", {})
        assert done["status"] == "confirmed" and done["message"] == "Done it"
        parts.ran.assert_awaited_once()
        assert parts.log.call_args.args[3] == "confirmed"

    async def test_only_the_owner_in_their_institution_can_find_it(self, parts):
        await proposals.confirm(who(), "p1", {})
        assert parts.db.agentproposal.find_first.call_args.kwargs["where"] == {
            "id": "p1", "tenantId": "tenant-1", "userId": "user-1"}

    async def test_a_missing_proposal_is_not_found(self, parts):
        parts.db.agentproposal.find_first.return_value = None
        await refused(proposals.confirm(who(), "p1", {}), 404)

    @pytest.mark.parametrize("status", ["CONFIRMED", "CANCELLED", "FAILED", "EXPIRED"])
    async def test_one_already_decided_cannot_run_again(self, parts, status):
        parts.db.agentproposal.find_first.return_value = stored(status=status)
        await refused(proposals.confirm(who(), "p1", {}), 409)
        parts.ran.assert_not_awaited()

    async def test_an_expired_one_is_marked_and_refused(self, parts):
        parts.db.agentproposal.find_first.return_value = stored(expires=datetime.now(timezone.utc) - timedelta(seconds=1))
        await refused(proposals.confirm(who(), "p1", {}), 410)
        assert parts.db.agentproposal.update_many.call_args.kwargs["data"]["status"] == "EXPIRED"
        parts.ran.assert_not_awaited()

    async def test_a_role_that_may_not_use_the_tool_is_refused(self, parts):
        await refused(proposals.confirm(who(ADMIN), "p1", {}), 403)
        parts.ran.assert_not_awaited()

    async def test_edits_change_only_the_fields_the_tool_allows(self, parts):
        await proposals.confirm(who(), "p1", {"title": "Edited", "count": 99})
        arguments = parts.ran.call_args.args[1]
        assert (arguments.title, arguments.count) == ("Edited", 2)

    async def test_an_invalid_edit_is_rejected_before_anything_runs(self, parts):
        await refused(proposals.confirm(who(), "p1", {"title": None}), 422)
        parts.ran.assert_not_awaited()

    async def test_the_plan_is_checked_again_at_confirm_time(self, parts):
        parts.previewed.side_effect = HTTPException(400, "No one matches that audience.")
        await refused(proposals.confirm(who(), "p1", {}), 400)
        parts.ran.assert_not_awaited()

    async def test_losing_the_race_to_a_second_click_runs_nothing(self, parts):
        parts.db.agentproposal.update_many.return_value = 0
        await refused(proposals.confirm(who(), "p1", {}), 409)
        parts.ran.assert_not_awaited()

    async def test_a_service_error_is_recorded_and_passed_on(self, parts):
        parts.ran.side_effect = HTTPException(409, "Already marked")
        await refused(proposals.confirm(who(), "p1", {}), 409)
        assert parts.db.agentproposal.update.call_args.kwargs["data"]["status"] == "FAILED"
        assert parts.log.call_args.args[3] == "failed"

    async def test_a_crash_is_recorded_and_its_detail_is_not_leaked(self, parts):
        parts.ran.side_effect = RuntimeError("secret detail")
        with pytest.raises(HTTPException) as caught:
            await proposals.confirm(who(), "p1", {})
        assert caught.value.status_code == 500 and "secret" not in caught.value.detail


class TestCancel:
    async def test_a_pending_proposal_is_cancelled(self, parts):
        assert await proposals.cancel(who(), "p1") == {"status": "cancelled"}
        assert parts.db.agentproposal.update_many.call_args.kwargs["data"]["status"] == "CANCELLED"

    async def test_a_decided_one_cannot_be_cancelled(self, parts):
        parts.db.agentproposal.find_first.return_value = stored(status="CONFIRMED")
        await refused(proposals.cancel(who(), "p1"), 409)
