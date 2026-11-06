"""The morning briefing: counts only, one per institution per day, and only for institutions that switched the assistant on."""
from datetime import datetime

from app.services.agent.briefing import build_briefing, send_daily_briefings
from tests.integration.agent_world import World

ACCEPT = "/api/v1/agent/notice/accept"


def run(client, function, *args):
    """Runs on the application's own event loop, which owns the database and Redis connections."""
    return client.portal.call(function, *args)


def briefings_for(world, user_id) -> int:
    return world.scalar("SELECT count(*) FROM notifications WHERE user_id = %s AND category = 'briefing'", user_id)


def test_the_briefing_counts_what_is_waiting(client, seed, conn):
    world = World(seed, conn)
    seed.insert("leave_requests", tenant_id=world.tenant_id, student_id=world.students[0],
                start_date=datetime(2026, 11, 3), end_date=datetime(2026, 11, 4), reason="Fever")
    occurrence = seed.insert("class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id,
                             date=datetime(2026, 11, 2), start_time="09:00", end_time="10:00", faculty_id=world.teacher_id)
    seed.record(world.tenant_id, occurrence, world.students[0], "FLAGGED")

    briefing = run(client, build_briefing, world.tenant_id)

    text = " ".join(briefing["lines"])
    assert "1 flagged mark waiting" in text
    assert "1 leave request and 0 device requests waiting" in text


def test_only_institutions_that_accepted_the_notice_get_a_briefing(client, seed, conn):
    on, off = World(seed, conn), World(seed, conn)
    client.post(ACCEPT, headers=on.admin)

    run(client, send_daily_briefings, {})

    assert briefings_for(on, on.admin_user) == 1
    assert briefings_for(off, off.admin_user) == 0


def test_a_second_run_on_the_same_day_sends_nothing_more(client, seed, conn):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)

    run(client, send_daily_briefings, {})
    run(client, send_daily_briefings, {})

    assert briefings_for(world, world.admin_user) == 1


def test_teachers_do_not_get_the_admin_briefing(client, seed, conn):
    world = World(seed, conn)
    client.post(ACCEPT, headers=world.admin)

    run(client, send_daily_briefings, {})

    assert briefings_for(world, world.teacher_user) == 0
