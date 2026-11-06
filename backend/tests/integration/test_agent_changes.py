"""A change the assistant prepares: nothing happens until the same person confirms, and only once."""
import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import ScriptedModel, World, calls, events, says

CHAT, ACCEPT = "/api/v1/agent/chat", "/api/v1/agent/notice/accept"


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def propose(client, world, headers=None, **args):
    """The teacher asks the assistant to send a message; returns the proposal card it shows."""
    client.post(ACCEPT, headers=world.admin)
    set_llm(ScriptedModel(calls("send_message", **args), says("Check the card")))
    reply = events(client.post(CHAT, json={"message": "tell them"}, headers=headers or world.teacher))
    return next((e for e in reply if e["type"] == "proposal"), None), reply


def message_args(world, **extra):
    return {"audience": "students", "ids": world.students, "title": "Low attendance", "message": "Please attend more.", **extra}


def confirm(client, headers, proposal, edits=None):
    return client.post(f"/api/v1/agent/proposals/{proposal['id']}/confirm", json={"edits": edits or {}}, headers=headers)


def test_the_assistant_only_prepares_the_message_and_sends_nothing(client, seed, conn):
    world = World(seed, conn)

    card, _ = propose(client, world, **message_args(world))

    assert card["summary"].startswith('Send "Low attendance" to 2 people')
    assert card["editable"]["title"] == "Low attendance"
    assert all(world.notifications_for(world.student_user(s)) == 0 for s in world.students)


def test_confirming_sends_one_notification_to_each_student(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, **message_args(world))

    done = confirm(client, world.teacher, card)

    assert done.status_code == 200 and done.json()["result"]["sent"] == 2
    assert [world.notifications_for(world.student_user(s)) for s in world.students] == [1, 1]
    assert world.scalar("SELECT status FROM agent_proposals WHERE id = %s", card["id"]) == "CONFIRMED"


def test_a_second_confirmation_does_not_send_again(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, **message_args(world))
    confirm(client, world.teacher, card)

    again = confirm(client, world.teacher, card)

    assert again.status_code == 409
    assert world.notifications_for(world.student_user(world.students[0])) == 1


def test_the_person_may_edit_the_wording_but_not_the_audience(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, **message_args(world))

    confirm(client, world.teacher, card, {"title": "Reminder", "message": "Come to class.", "ids": [world.stranger]})

    sent = world.scalar("SELECT title FROM notifications WHERE user_id = %s", world.student_user(world.students[0]))
    assert sent == "Reminder"
    assert world.notifications_for(world.student_user(world.stranger)) == 0


def test_a_cancelled_proposal_cannot_be_confirmed(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, **message_args(world))

    cancelled = client.post(f"/api/v1/agent/proposals/{card['id']}/cancel", headers=world.teacher)

    assert cancelled.status_code == 200
    assert confirm(client, world.teacher, card).status_code == 409
    assert world.notifications_for(world.student_user(world.students[0])) == 0


def test_nobody_else_can_confirm_someone_elses_proposal(client, seed, conn):
    world, other = World(seed, conn), World(seed, conn)
    card, _ = propose(client, world, **message_args(world))

    assert confirm(client, world.admin, card).status_code == 404  # same institution, different person
    assert confirm(client, other.admin, card).status_code == 404  # another institution
    assert world.notifications_for(world.student_user(world.students[0])) == 0


def test_an_expired_proposal_is_refused(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, **message_args(world))
    with conn.cursor() as cursor:
        cursor.execute("UPDATE agent_proposals SET expires_at = now() - interval '1 minute' WHERE id = %s", (card["id"],))

    assert confirm(client, world.teacher, card).status_code == 410


def test_a_teacher_cannot_prepare_a_message_to_a_student_they_do_not_teach(client, seed, conn):
    world = World(seed, conn)

    card, reply = propose(client, world, **message_args(world, ids=[world.stranger]))

    assert card is None
    assert world.scalar("SELECT count(*) FROM agent_proposals WHERE tenant_id = %s", world.tenant_id) == 0


def test_a_teacher_can_message_a_whole_subject_but_not_the_whole_institution(client, seed, conn):
    world = World(seed, conn)

    by_subject, _ = propose(client, world, audience="section", ids=[world.section_id], title="Notes", message="Read chapter 3.")
    everyone, _ = propose(client, world, audience="all_teachers", ids=[], title="Hi", message="Hi all")

    assert by_subject["summary"].startswith('Send "Notes" to 2 people')
    assert everyone is None


def test_an_admin_can_message_every_teacher_and_the_proposal_is_audited(client, seed, conn):
    world = World(seed, conn)

    card, _ = propose(client, world, headers=world.admin, audience="all_teachers", ids=[], title="Meeting", message="Staff meeting at 4.")
    done = confirm(client, world.admin, card)

    assert done.json()["result"]["sent"] == 1
    assert world.notifications_for(world.teacher_user) == 1
    audited = world.scalar(
        "SELECT count(*) FROM agent_tool_calls WHERE tenant_id = %s AND tool_name = 'send_message' AND outcome IN ('proposed','confirmed')",
        world.tenant_id,
    )
    assert audited == 2


def test_a_message_to_nobody_is_not_prepared(client, seed, conn):
    world = World(seed, conn)

    card, _ = propose(client, world, **message_args(world, ids=[]))

    assert card is None
