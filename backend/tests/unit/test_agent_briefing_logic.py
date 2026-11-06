from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.agent import audit, briefing
from app.services.agent.types import TEACHER, Principal

ON = {"aiAssistant": {"acceptedAt": "2026-11-06"}}


def tenant(tenant_id, settings):
    return SimpleNamespace(id=tenant_id, settings=settings)


@pytest.fixture
def parts(monkeypatch):
    fake_db = MagicMock()
    fake_db.tenant.find_many = AsyncMock(return_value=[tenant("on", ON), tenant("off", {})])
    fake_db.user.find_many = AsyncMock(return_value=[SimpleNamespace(id="a1", role="ADMIN"), SimpleNamespace(id="a2", role="TENANT_ADMIN")])
    notify = AsyncMock()
    monkeypatch.setattr(briefing, "db", fake_db)
    monkeypatch.setattr(briefing, "create_in_app_notification", notify)
    monkeypatch.setattr(briefing, "build_briefing", AsyncMock(return_value={"title": "Morning", "lines": ["a", "b"]}))
    monkeypatch.setattr(briefing, "_first_today", AsyncMock(return_value=True))
    return SimpleNamespace(db=fake_db, notify=notify)


def test_counts_are_worded_in_the_singular_and_plural():
    assert briefing._plural(1, "leave request") == "1 leave request"
    assert briefing._plural(0, "leave request") == "0 leave requests"


class TestOncePerDay:
    async def test_the_first_run_of_the_day_wins_and_a_second_does_not(self, monkeypatch):
        redis = SimpleNamespace(set=AsyncMock(side_effect=[True, None]))
        monkeypatch.setattr(briefing, "safe_redis", lambda: redis)
        assert await briefing._first_today("t1") is True
        assert await briefing._first_today("t1") is False
        key = redis.set.call_args.args[0]
        assert key.startswith("agent:briefing:t1:") and redis.set.call_args.kwargs["nx"] is True

    async def test_without_redis_the_briefing_still_goes_out(self, monkeypatch):
        monkeypatch.setattr(briefing, "safe_redis", lambda: None)
        assert await briefing._first_today("t1") is True


class TestSend:
    async def test_only_institutions_that_accepted_the_notice_are_briefed(self, parts):
        assert await briefing.send_daily_briefings({}) == 1
        assert parts.db.user.find_many.call_args.kwargs["where"]["tenantId"] == "on"

    async def test_every_admin_gets_one_in_app_note_with_the_lines_joined(self, parts):
        await briefing.send_daily_briefings({})
        assert parts.notify.await_count == 2
        first = parts.notify.call_args_list[0].kwargs
        assert (first["message"], first["category"], first["tenant_id"]) == ("a\nb", "briefing", "on")

    async def test_only_active_admins_of_that_institution_are_chosen(self, parts):
        await briefing.send_daily_briefings({})
        where = parts.db.user.find_many.call_args.kwargs["where"]
        assert where["isActive"] is True and set(where["role"]["in"]) == {"ADMIN", "TENANT_ADMIN"}

    async def test_an_institution_already_briefed_today_is_skipped(self, parts):
        briefing._first_today.return_value = False
        assert await briefing.send_daily_briefings({}) == 0
        parts.notify.assert_not_awaited()

    def test_no_e_mail_is_sent(self):
        assert not hasattr(briefing, "enqueue_email")


async def test_a_tool_call_is_recorded_with_the_person_and_a_trimmed_detail(monkeypatch):
    fake = MagicMock()
    fake.agenttoolcall.create = AsyncMock()
    monkeypatch.setattr(audit, "db", fake)
    who = Principal(user=SimpleNamespace(id="u1"), role=TEACHER, tenant_id="t1")

    await audit.log_tool_call(who, "my_schedule", {"a": 1}, "error", "x" * 900, 12, "c1")

    data = fake.agenttoolcall.create.call_args.kwargs["data"]
    assert (data["tenantId"], data["userId"], data["toolName"], data["outcome"]) == ("t1", "u1", "my_schedule", "error")
    assert len(data["detail"]) == audit.DETAIL_LIMIT and data["durationMs"] == 12
