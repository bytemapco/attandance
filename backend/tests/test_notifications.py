from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.core.tenancy import DEFAULT_TENANT_IDENTIFIER, is_real_tenant
from app.services import notification_service as module

CREATED = datetime(2026, 11, 4, 9, 30)


def stored(**over):
    row = dict(
        id="n1", userId="u1", role=None, tenantId="t1", title="Hello", message="World", type="info",
        category="system", link=None, isRead=False, createdAt=CREATED,
    )
    return SimpleNamespace(**{**row, **over})


@pytest.fixture
def fake(monkeypatch):
    db = SimpleNamespace(notification=SimpleNamespace(create=AsyncMock(return_value=stored())))
    manager = SimpleNamespace(send_personal_message=AsyncMock(), broadcast=AsyncMock())
    monkeypatch.setattr(module, "db", db)
    monkeypatch.setattr(module, "manager", manager)
    return SimpleNamespace(db=db, manager=manager)


@pytest.mark.parametrize("tenant, real", [(None, False), ("", False), (DEFAULT_TENANT_IDENTIFIER, False), ("t1", True)])
def test_only_a_real_institution_counts_as_a_tenant(tenant, real):
    assert is_real_tenant(tenant) is real


async def test_a_notification_for_a_user_is_stored_and_pushed_to_that_user(fake):
    record = await module.create_in_app_notification("Hello", "World", user_id="u1", tenant_id="t1")
    assert fake.db.notification.create.await_args.kwargs["data"]["tenantId"] == "t1"
    assert record["created_at"] == CREATED and record["is_read"] is False
    payload = fake.manager.send_personal_message.await_args.args[0]
    assert payload["event"] == "NOTIFICATION_RECEIVED"
    assert payload["data"]["created_at"] == CREATED.isoformat()


async def test_a_notification_without_a_user_is_broadcast_to_its_role_and_institution(fake):
    await module.create_in_app_notification("Hello", "World", role="STUDENT", tenant_id="t1")
    fake.manager.broadcast.assert_awaited_once()
    assert fake.manager.broadcast.await_args.kwargs == {"target_role": "STUDENT", "tenant_id": "t1"}


async def test_the_development_placeholder_institution_is_not_stored(fake):
    await module.create_in_app_notification("Hello", "World", user_id="u1", tenant_id=DEFAULT_TENANT_IDENTIFIER)
    assert "tenantId" not in fake.db.notification.create.await_args.kwargs["data"]


async def test_a_failing_push_does_not_lose_the_notification(fake):
    fake.manager.send_personal_message.side_effect = RuntimeError("socket gone")
    record = await module.create_in_app_notification("Hello", "World", user_id="u1")
    assert record["id"] == "n1"
