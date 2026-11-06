"""Who may use the assistant, and what keeps one person's chats and changes away from everyone else."""
import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import ScriptedModel, World, calls, events, says

CHAT, STATUS, ACCEPT = "/api/v1/agent/chat", "/api/v1/agent/status", "/api/v1/agent/notice/accept"


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def chat(client, headers, text="hello", conversation_id=None):
    return client.post(CHAT, json={"message": text, "conversation_id": conversation_id}, headers=headers)


def test_a_student_has_no_assistant(client, seed, conn):
    world = World(seed, conn)
    student = world.headers(world.student_user(world.students[0]), "STUDENT")

    assert client.get(STATUS, headers=student).status_code == 403


def test_chat_is_refused_until_the_institution_admin_accepts_the_data_notice(client, seed, conn):
    world = World(seed, conn)
    set_llm(ScriptedModel(says("hi")))

    refused = chat(client, world.teacher)

    assert refused.status_code == 403 and refused.json()["detail"] == "ai_notice_required"
    assert client.get(STATUS, headers=world.teacher).json()["notice_accepted"] is False


def test_a_teacher_cannot_accept_the_notice_for_the_institution(client, seed, conn):
    world = World(seed, conn)

    assert client.post(ACCEPT, headers=world.teacher).status_code == 403


def test_after_the_admin_accepts_both_roles_can_chat_and_the_acceptance_is_recorded(client, seed, conn):
    world = World(seed, conn)
    accepted = client.post(ACCEPT, headers=world.admin).json()
    set_llm(ScriptedModel(says("Hello teacher"), says("Hello admin")))

    teacher_reply = events(chat(client, world.teacher))
    admin_reply = events(chat(client, world.admin))

    assert accepted["notice_accepted"] is True
    assert teacher_reply[-1] == {"type": "text", "text": "Hello teacher"}
    assert admin_reply[-1] == {"type": "text", "text": "Hello admin"}
    assert world.scalar("SELECT settings->'aiAssistant'->>'acceptedBy' FROM tenants WHERE id = %s", world.tenant_id) == world.admin_user


def test_without_a_model_key_the_assistant_says_it_is_not_set_up(client, seed, conn, monkeypatch):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    assert chat(client, world.admin).status_code == 503


def test_each_role_is_offered_only_its_own_tools(client, seed, conn):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    model = ScriptedModel(says("a"), says("b"))
    set_llm(model)

    chat(client, world.teacher)
    chat(client, world.admin)

    teacher_tools, admin_tools = model.tools_offered
    assert "my_schedule" in teacher_tools and "institution_stats" not in teacher_tools
    assert "institution_stats" in admin_tools and "my_schedule" not in admin_tools


def test_a_conversation_belongs_to_one_person(client, seed, conn):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    set_llm(ScriptedModel(says("one"), says("two")))
    first = events(chat(client, world.teacher, "my private question"))[0]["id"]

    assert [c["id"] for c in client.get("/api/v1/agent/conversations", headers=world.teacher).json()] == [first]
    assert client.get("/api/v1/agent/conversations", headers=world.admin).json() == []
    assert client.get(f"/api/v1/agent/conversations/{first}", headers=world.admin).status_code == 404
    assert chat(client, world.admin, "continue", first).status_code == 404


def test_another_institution_cannot_see_or_reuse_a_conversation(client, seed, conn):
    mine, theirs = World(seed, conn), World(seed, conn)
    client.post(ACCEPT, headers=mine.admin)
    client.post(ACCEPT, headers=theirs.admin)
    set_llm(ScriptedModel(says("one")))
    first = events(chat(client, mine.admin))[0]["id"]

    assert client.get(f"/api/v1/agent/conversations/{first}", headers=theirs.admin).status_code == 404


def test_every_tool_call_is_recorded_with_who_made_it(client, seed, conn):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    set_llm(ScriptedModel(calls("my_classes"), says("done")))

    events(chat(client, world.teacher))

    rows = world.scalar(
        "SELECT count(*) FROM agent_tool_calls WHERE tenant_id = %s AND user_id = %s AND tool_name = 'my_classes' AND outcome = 'ok'",
        world.tenant_id, world.teacher_user,
    )
    assert rows == 1


def test_a_tool_the_model_invents_is_refused_and_recorded(client, seed, conn):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    set_llm(ScriptedModel(calls("institution_stats"), says("sorry")))  # a teacher asking for an admin tool

    events(chat(client, world.teacher))

    denied = world.scalar("SELECT count(*) FROM agent_tool_calls WHERE user_id = %s AND outcome = 'denied'", world.teacher_user)
    assert denied == 1


def test_too_many_messages_in_a_minute_are_slowed(client, seed, conn, monkeypatch):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    monkeypatch.setattr(settings, "AGENT_MESSAGES_PER_MINUTE", 2)
    set_llm(ScriptedModel(*[says("ok")] * 3))

    codes = [chat(client, world.teacher).status_code for _ in range(3)]

    assert codes == [200, 200, 429]


def test_an_institution_that_used_its_daily_tokens_is_stopped(client, seed, conn, monkeypatch):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)
    monkeypatch.setattr(settings, "AGENT_DAILY_TOKEN_BUDGET", 5)
    set_llm(ScriptedModel(says("uses 10 tokens"), says("never reached")))

    assert chat(client, world.teacher).status_code == 200
    assert chat(client, world.teacher).status_code == 429
