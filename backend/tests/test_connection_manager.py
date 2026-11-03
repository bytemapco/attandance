from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.connection_manager import ConnectionManager


def socket(fails: bool = False) -> MagicMock:
    return MagicMock(send_json=AsyncMock(side_effect=RuntimeError("closed") if fails else None), close=AsyncMock())


@pytest.fixture
def manager(monkeypatch):
    monkeypatch.setattr("app.services.connection_manager.realtime_bus.publish", AsyncMock())
    return ConnectionManager()


async def test_a_connection_is_indexed_by_user_role_profile_and_institution(manager):
    ws = socket()
    await manager.connect_client(ws, "u1", "STUDENT", "stu-1", tenant_id="t1", tenant_slug="acme")
    assert manager.user_connections == {"u1": {ws}}
    assert manager.role_connections["STUDENT"] == {ws}
    assert manager.student_connections == {"stu-1": {ws}}
    assert manager.tenant_connections == {"t1": {ws}, "acme": {ws}}


async def test_disconnecting_removes_every_trace_but_keeps_the_role_keys(manager):
    ws = socket()
    await manager.connect_client(ws, "u1", "TEACHER", "tea-1", tenant_id="t1", tenant_slug="acme")
    manager.disconnect_client(ws, "u1", "TEACHER", "tea-1", tenant_id="t1", tenant_slug="acme")
    assert (manager.user_connections, manager.teacher_connections, manager.tenant_connections) == ({}, {}, {})
    assert set(manager.role_connections) == {"STUDENT", "TEACHER", "ADMIN"}


async def test_a_broadcast_reaches_only_the_role_and_institution_asked_for(manager):
    mine, other_tenant, other_role = socket(), socket(), socket()
    await manager.connect_client(mine, "u1", "STUDENT", tenant_id="t1")
    await manager.connect_client(other_tenant, "u2", "STUDENT", tenant_id="t2")
    await manager.connect_client(other_role, "u3", "TEACHER", tenant_id="t1")
    await manager.deliver_broadcast({"m": 1}, target_role="STUDENT", tenant_id="t1")
    mine.send_json.assert_awaited_once_with({"m": 1})
    other_tenant.send_json.assert_not_awaited()
    other_role.send_json.assert_not_awaited()


async def test_a_broadcast_to_a_role_nobody_is_in_does_not_fall_back_to_everyone(manager):
    ws = socket()
    await manager.connect_client(ws, "u1", "STUDENT")
    await manager.deliver_broadcast({"m": 1}, target_role="ADMIN")
    ws.send_json.assert_not_awaited()


async def test_a_socket_that_fails_to_send_is_forgotten_everywhere(manager):
    dead, alive = socket(fails=True), socket()
    await manager.connect_client(dead, "u1", "STUDENT", "stu-1", tenant_id="t1")
    await manager.connect_client(alive, "u2", "STUDENT", tenant_id="t1")
    await manager.deliver_broadcast({"m": 1})
    assert manager.user_connections == {"u2": {alive}}
    assert manager.student_connections == {}
    assert manager.tenant_connections == {"t1": {alive}}


async def test_a_personal_message_finds_the_student_by_profile_id(manager):
    ws = socket()
    await manager.connect_client(ws, "u1", "STUDENT", "stu-1")
    await manager.deliver_personal_message({"m": 1}, "stu-1")
    ws.send_json.assert_awaited_once_with({"m": 1})


async def test_suspending_a_tenant_notifies_closes_and_forgets_its_sockets(manager):
    ws, elsewhere = socket(), socket()
    await manager.connect_client(ws, "u1", "STUDENT", "stu-1", tenant_id="t1", tenant_slug="acme")
    await manager.connect_client(elsewhere, "u2", "STUDENT", tenant_id="t2")
    await manager.force_close_tenant("t1", "Institution suspended")
    ws.send_json.assert_awaited_once_with({"type": "tenant_suspended", "message": "Institution suspended"})
    ws.close.assert_awaited_once_with(code=4403)
    assert manager.tenant_connections == {"t2": {elsewhere}}
    assert manager.student_connections == {}
    assert manager.user_connections == {"u2": {elsewhere}}
