from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services import token_revocation as module
from app.services.token_revocation import ACCESS_TOKEN, REFRESH_TOKEN, ensure_not_revoked, revoke


def with_redis(monkeypatch, client):
    monkeypatch.setattr(module, "safe_redis", lambda: client)


async def test_a_token_on_the_deny_list_is_refused(monkeypatch):
    with_redis(monkeypatch, MagicMock(get=AsyncMock(return_value="revoked")))
    with pytest.raises(HTTPException) as caught:
        await ensure_not_revoked("abc", REFRESH_TOKEN)
    assert (caught.value.status_code, caught.value.detail) == (401, "Refresh token has been revoked")


async def test_a_token_not_on_the_deny_list_passes(monkeypatch):
    with_redis(monkeypatch, MagicMock(get=AsyncMock(return_value=None)))
    await ensure_not_revoked("abc", ACCESS_TOKEN)


@pytest.mark.parametrize("fail_closed, expected", [(False, None), (True, 503)])
async def test_when_redis_is_down_the_deployment_decides(monkeypatch, fail_closed, expected):
    with_redis(monkeypatch, None)
    monkeypatch.setattr(module.settings, "TOKEN_REVOCATION_FAIL_CLOSED", fail_closed)
    if expected is None:
        await ensure_not_revoked("abc", ACCESS_TOKEN)
        return
    with pytest.raises(HTTPException) as caught:
        await ensure_not_revoked("abc", ACCESS_TOKEN)
    assert caught.value.status_code == expected


async def test_revoking_without_redis_does_nothing_instead_of_crashing(monkeypatch):
    with_redis(monkeypatch, None)
    await revoke("abc", 60)


async def test_revoking_keeps_the_token_until_it_would_have_expired(monkeypatch):
    client = MagicMock(setex=AsyncMock())
    with_redis(monkeypatch, client)
    await revoke("abc", 60)
    client.setex.assert_awaited_once_with("denylist:abc", 60, "revoked")
