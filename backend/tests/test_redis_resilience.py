import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException
from app.core.redis_scripts import (
    atomic_incr_expire,
    atomic_sliding_window,
    atomic_release_lock,
)
from app.db.redis import safe_redis
from app.api.dependencies import _check_token_revoked, auth_rate_limit
from app.api.student.helpers import rate_limit_student


@pytest.mark.anyio
async def test_atomic_incr_expire_evaluation():
    mock_redis = AsyncMock()
    mock_redis.eval.return_value = 1
    count = await atomic_incr_expire(mock_redis, "test:key", 60)
    assert count == 1
    mock_redis.eval.assert_called_once()


@pytest.mark.anyio
async def test_atomic_sliding_window_allowed():
    mock_redis = AsyncMock()
    mock_redis.eval.return_value = [1, 5]
    is_allowed, count = await atomic_sliding_window(mock_redis, "rate:test", 60, 60)
    assert is_allowed is True
    assert count == 5


@pytest.mark.anyio
async def test_atomic_sliding_window_blocked():
    mock_redis = AsyncMock()
    mock_redis.eval.return_value = [0, 60]
    is_allowed, count = await atomic_sliding_window(mock_redis, "rate:test", 60, 60)
    assert is_allowed is False
    assert count == 60


@pytest.mark.anyio
async def test_atomic_release_lock_success():
    mock_redis = AsyncMock()
    mock_redis.eval.return_value = 1
    released = await atomic_release_lock(mock_redis, "lock:key", "owner-123")
    assert released is True


@pytest.mark.anyio
async def test_atomic_release_lock_mismatch():
    mock_redis = AsyncMock()
    mock_redis.eval.return_value = 0
    released = await atomic_release_lock(mock_redis, "lock:key", "wrong-owner")
    assert released is False


@pytest.mark.anyio
async def test_safe_redis_degraded_returns_none(monkeypatch):
    monkeypatch.setattr("app.db.redis.redis_client", None)
    client = safe_redis()
    assert client is None


@pytest.mark.anyio
async def test_auth_rate_limit_degrades_when_redis_unavailable(monkeypatch):
    monkeypatch.setattr("app.db.redis.redis_client", None)
    monkeypatch.setattr("app.core.config.settings.ENVIRONMENT", "production")
    mock_request = MagicMock()
    mock_request.client.host = "192.168.1.100"
    # Should complete without throwing HTTPException or RuntimeError
    await auth_rate_limit(mock_request)


@pytest.mark.anyio
async def test_student_rate_limit_degrades_when_redis_unavailable(monkeypatch):
    monkeypatch.setattr("app.db.redis.redis_client", None)
    monkeypatch.setattr("app.core.config.settings.ENVIRONMENT", "production")
    # Should complete without throwing HTTPException or RuntimeError
    await rate_limit_student("student-123", max_requests=10, window_seconds=60)


@pytest.mark.anyio
async def test_token_revocation_fail_open_by_default(monkeypatch):
    monkeypatch.setattr("app.db.redis.redis_client", None)
    monkeypatch.setattr("app.core.config.settings.TOKEN_REVOCATION_FAIL_CLOSED", False)
    # Should not raise 503 when fail closed is disabled
    await _check_token_revoked("sample-jwt-token")


@pytest.mark.anyio
async def test_token_revocation_fail_closed_raises_503(monkeypatch):
    monkeypatch.setattr("app.db.redis.redis_client", None)
    monkeypatch.setattr("app.core.config.settings.TOKEN_REVOCATION_FAIL_CLOSED", True)
    with pytest.raises(HTTPException) as exc_info:
        await _check_token_revoked("sample-jwt-token")
    assert exc_info.value.status_code == 503
