"""Who a live announcement reaches, and how the audience names map to account roles."""
import json

import pytest

from app.services import realtime_bus as bus_module
from app.services.announcements.audience import audience_of, roles_for, visible_to
from app.services.connection_manager import ConnectionManager


class Socket:
    def __init__(self, fail=False):
        self.received: list[dict] = []
        self.fail = fail

    async def send_json(self, message):
        if self.fail:
            raise ConnectionError("gone")
        self.received.append(message)


async def connected(manager, role, tenant_id, user_id=None):
    socket = Socket()
    await manager.connect_client(socket, user_id or f"{role}-{tenant_id}-{id(socket)}", role, tenant_id=tenant_id, tenant_slug=f"slug-{tenant_id}")
    return socket


NOTICE = {"event": "NOTIFICATION_RECEIVED", "data": {"id": "a1"}}


class TestWhoIsReached:
    async def test_only_the_audiences_roles_in_that_institution(self):
        manager = ConnectionManager()
        student = await connected(manager, "STUDENT", "t1")
        teacher = await connected(manager, "TEACHER", "t1")
        other_student = await connected(manager, "STUDENT", "t2")

        await manager.deliver_broadcast(NOTICE, frozenset({"STUDENT"}), tenant_id="t1")

        assert [len(s.received) for s in (student, teacher, other_student)] == [1, 0, 0]

    async def test_an_institution_nobody_is_connected_to_gets_nothing_and_no_other_institution_is_told(self):
        manager = ConnectionManager()
        sockets = [await connected(manager, "STUDENT", "t1"), await connected(manager, "TEACHER", "t2")]

        await manager.deliver_broadcast(NOTICE, None, tenant_id="t-empty")

        assert [len(s.received) for s in sockets] == [0, 0]

    async def test_admins_include_every_kind_of_admin(self):
        manager = ConnectionManager()
        admin = await connected(manager, "ADMIN", "t1")
        tenant_admin = await connected(manager, "TENANT_ADMIN", "t1")
        student = await connected(manager, "STUDENT", "t1")

        await manager.deliver_broadcast(NOTICE, roles_for("ADMIN"), tenant_id="t1")

        assert [len(s.received) for s in (admin, tenant_admin, student)] == [1, 1, 0]

    async def test_everyone_when_no_role_and_no_institution_is_given(self):
        manager = ConnectionManager()
        sockets = [await connected(manager, "STUDENT", "t1"), await connected(manager, "TEACHER", "t2"), await connected(manager, "SUPER_ADMIN", "t3")]

        await manager.deliver_broadcast(NOTICE)

        assert [len(s.received) for s in sockets] == [1, 1, 1]

    async def test_a_person_is_told_once_although_the_institution_is_indexed_by_id_and_by_slug(self):
        manager = ConnectionManager()
        student = await connected(manager, "STUDENT", "t1")
        await manager.deliver_broadcast(NOTICE, None, tenant_id="t1")
        assert len(student.received) == 1

    async def test_a_dead_connection_is_dropped_and_the_others_are_still_told(self):
        manager = ConnectionManager()
        alive = await connected(manager, "STUDENT", "t1")
        dead = Socket(fail=True)
        await manager.connect_client(dead, "dead-user", "STUDENT", tenant_id="t1")

        await manager.deliver_broadcast(NOTICE, frozenset({"STUDENT"}), tenant_id="t1")
        await manager.deliver_broadcast(NOTICE, frozenset({"STUDENT"}), tenant_id="t1")

        assert len(alive.received) == 2 and dead not in manager.role_connections["STUDENT"]


class FakeRedis:
    def __init__(self):
        self.published = []

    async def publish(self, channel, payload):
        self.published.append((channel, json.loads(payload)))


async def test_the_other_workers_are_told_which_roles_and_institution_to_reach(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr("app.db.redis.get_redis", lambda: fake)

    await bus_module.realtime_bus.publish("broadcast", NOTICE, target_roles=frozenset({"TENANT_ADMIN", "ADMIN"}), tenant_id="t1")
    await bus_module.realtime_bus.publish("broadcast", NOTICE)

    [(_, targeted), (_, open_to_all)] = fake.published
    assert targeted["target_roles"] == ["ADMIN", "TENANT_ADMIN"] and targeted["tenant_id"] == "t1"
    assert open_to_all["target_roles"] is None and open_to_all["tenant_id"] is None


class TestAudienceNames:
    @pytest.mark.parametrize("role, audience", [("STUDENT", "STUDENT"), ("TEACHER", "TEACHER"), ("ADMIN", "ADMIN"), ("TENANT_ADMIN", "ADMIN"), ("SUPER_ADMIN", None)])
    def test_every_role_belongs_to_one_audience(self, role, audience):
        assert audience_of(role) == audience

    def test_the_audiences_roles(self):
        assert roles_for("ALL") is None
        assert roles_for("ADMIN") == frozenset({"ADMIN", "TENANT_ADMIN"})
        assert roles_for("STUDENT") == frozenset({"STUDENT"})

    def test_the_visibility_rule_is_written_for_the_given_parameters_and_checks_the_publish_time(self):
        rule = visible_to("a", 2, 3)
        assert "$2::text" in rule and "$3::text" in rule and "publish_at <=" in rule and "tenant_id IS NULL" in rule
