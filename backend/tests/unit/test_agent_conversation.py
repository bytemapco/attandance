from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services.agent import conversation
from app.services.agent.types import TEACHER, Principal


def who():
    return Principal(user=SimpleNamespace(id="user-1"), role=TEACHER, tenant_id="tenant-1")


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.agentconversation.find_first = AsyncMock(return_value=SimpleNamespace(id="c1"))
    fake.agentconversation.create = AsyncMock(return_value=SimpleNamespace(id="new"))
    fake.agentconversation.update = AsyncMock()
    fake.agentconversation.delete_many = AsyncMock(return_value=1)
    fake.agentconversation.find_many = AsyncMock(return_value=[])
    fake.agentmessage.create = AsyncMock()
    fake.agentmessage.find_many = AsyncMock(return_value=[])
    monkeypatch.setattr(conversation, "db", fake)
    return fake


async def refused(call, code):
    with pytest.raises(HTTPException) as caught:
        await call
    assert caught.value.status_code == code


MINE = {"id": "c1", "tenantId": "tenant-1", "userId": "user-1"}


class TestOpen:
    async def test_a_new_conversation_is_titled_by_the_first_words_and_owned(self, fake_db):
        await conversation.open_conversation(who(), None, "  " + "x" * 100)
        data = fake_db.agentconversation.create.call_args.kwargs["data"]
        assert data["title"] == "x" * conversation.TITLE_LENGTH
        assert (data["tenantId"], data["userId"]) == ("tenant-1", "user-1")

    async def test_an_existing_one_is_looked_up_only_among_the_persons_own(self, fake_db):
        await conversation.open_conversation(who(), "c1", "hi")
        assert fake_db.agentconversation.find_first.call_args.kwargs["where"] == MINE

    async def test_someone_elses_conversation_is_not_found(self, fake_db):
        fake_db.agentconversation.find_first.return_value = None
        await refused(conversation.open_conversation(who(), "c1", "hi"), 404)


class TestHistory:
    async def test_it_is_oldest_first_and_limited_to_the_last_few_turns(self, fake_db):
        newest_first = [SimpleNamespace(role="assistant", content="b"), SimpleNamespace(role="user", content="a")]
        fake_db.agentmessage.find_many.return_value = newest_first

        past = await conversation.history("c1")

        assert [(m["role"], m["text"]) for m in past] == [("user", "a"), ("model", "b")]
        assert fake_db.agentmessage.find_many.call_args.kwargs["take"] == conversation.HISTORY_MESSAGES


class TestAddMessage:
    async def test_it_saves_the_message_and_touches_the_conversation(self, fake_db):
        await conversation.add_message(who(), "c1", "user", "hello")
        assert fake_db.agentmessage.create.call_args.kwargs["data"]["tenantId"] == "tenant-1"
        assert "updatedAt" in fake_db.agentconversation.update.call_args.kwargs["data"]

    async def test_shown_blocks_are_saved_with_an_answer(self, fake_db):
        await conversation.add_message(who(), "c1", "assistant", "ok", [{"type": "ui", "when": datetime(2026, 11, 6)}])
        assert "events" in fake_db.agentmessage.create.call_args.kwargs["data"]

    async def test_no_blocks_means_no_events_column(self, fake_db):
        await conversation.add_message(who(), "c1", "user", "hello")
        assert "events" not in fake_db.agentmessage.create.call_args.kwargs["data"]


class TestReadAndDelete:
    async def test_messages_of_someone_elses_conversation_are_not_found(self, fake_db):
        fake_db.agentconversation.find_first.return_value = None
        await refused(conversation.messages(who(), "c1"), 404)
        fake_db.agentmessage.find_many.assert_not_awaited()

    async def test_the_list_is_the_persons_own_newest_first(self, fake_db):
        await conversation.list_conversations(who())
        call = fake_db.agentconversation.find_many.call_args.kwargs
        assert call["where"] == {"tenantId": "tenant-1", "userId": "user-1"} and call["order"] == {"updatedAt": "desc"}

    async def test_deleting_removes_only_the_persons_own(self, fake_db):
        await conversation.delete(who(), "c1")
        assert fake_db.agentconversation.delete_many.call_args.kwargs["where"] == MINE

    async def test_deleting_someone_elses_is_not_found(self, fake_db):
        fake_db.agentconversation.delete_many.return_value = 0
        await refused(conversation.delete(who(), "c1"), 404)
