"""Changing attendance rules through the assistant: a Confirm card, the product's limits, and an audit row per change."""
import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, ask, confirm, count, propose


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def current(world, column):
    return world.scalar(f"SELECT {column} FROM system_configurations WHERE tenant_id = %s", world.tenant_id)


def test_the_minimum_is_changed_only_after_confirm_and_audited(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, world.admin, "update_institution_settings", min_attendance_pct=80)
    assert card["details"]["table"]["rows"] == [["Minimum attendance %", "75.0", "80.0"]]
    assert current(world, "min_attendance_pct") == 75.0

    assert confirm(client, world.admin, card).status_code == 200

    assert current(world, "min_attendance_pct") == 80.0
    assert count(world, "audit_logs", "tenant_id = %s AND event_type = 'UPDATE_SYSTEM_CONFIG'") == 1


def test_only_the_fields_given_change(client, seed, conn):
    world = World(seed, conn)
    card, _ = propose(client, world, world.admin, "update_institution_settings", saturday_enabled=True)
    confirm(client, world.admin, card)
    assert current(world, "saturday_enabled") is True
    assert current(world, "min_attendance_pct") == 75.0


def test_asking_for_the_value_already_set_is_refused(client, seed, conn):
    world = World(seed, conn)
    card, told = propose(client, world, world.admin, "update_institution_settings", min_attendance_pct=75)
    assert card is None and "Nothing would change" in told["error"]


def test_a_value_out_of_range_is_refused_before_the_card(client, seed, conn):
    world = World(seed, conn)
    ask(client, world, world.admin, "institution_settings")  # creates the institution's settings row, as the screen does
    card, told = propose(client, world, world.admin, "update_institution_settings", min_attendance_pct=150)
    assert card is None and "error" in told
    assert current(world, "min_attendance_pct") == 75.0


def test_no_setting_named_is_refused(client, seed, conn):
    world = World(seed, conn)
    card, told = propose(client, world, world.admin, "update_institution_settings")
    assert card is None and "Say which setting" in told["error"]


def test_a_teacher_cannot_change_the_rules(client, seed, conn):
    world = World(seed, conn)
    ask(client, world, world.admin, "institution_settings")
    card, told = propose(client, world, world.teacher, "update_institution_settings", min_attendance_pct=80)
    assert card is None and "not available" in told["error"]
    assert current(world, "min_attendance_pct") == 75.0


def test_face_and_ai_settings_are_not_reachable(client, seed, conn):
    world = World(seed, conn)
    card, told = propose(client, world, world.admin, "update_institution_settings", is_face_recognition_enabled=False)
    assert card is None and "error" in told
