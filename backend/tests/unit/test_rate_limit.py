from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException, Request
import pytest
from app.core.rate_limit import rate_limiter


def create_dummy_request(path: str = "/api/v1/test", client_ip: str = "127.0.0.1") -> Request:
    scope = {
        "type": "http",
        "method": "POST",
        "path": path,
        "headers": [(b"x-forwarded-for", client_ip.encode())],
        "client": ("127.0.0.1", 12345),
    }
    return Request(scope)


@pytest.mark.unit
async def test_rate_limiter_permits_under_limit(monkeypatch):
    mock_redis = MagicMock()
    pipe = MagicMock()
    pipe.zremrangebyscore.return_value = pipe
    pipe.zcard.return_value = pipe
    pipe.zadd.return_value = pipe
    pipe.expire.return_value = pipe
    # results[1] is zcard count
    pipe.execute = AsyncMock(return_value=[0, 2, 1, True])
    mock_redis.pipeline.return_value = pipe

    import app.core.rate_limit as rate_limit_module
    monkeypatch.setattr(rate_limit_module, "get_redis", lambda: mock_redis)

    limiter = rate_limiter(requests_limit=5, window_seconds=60)
    request = create_dummy_request()
    # Should not raise
    await limiter(request)


@pytest.mark.unit
async def test_rate_limiter_blocks_over_limit(monkeypatch):
    mock_redis = MagicMock()
    pipe = MagicMock()
    pipe.zremrangebyscore.return_value = pipe
    pipe.zcard.return_value = pipe
    pipe.zadd.return_value = pipe
    pipe.expire.return_value = pipe
    pipe.execute = AsyncMock(return_value=[0, 10, 1, True])
    mock_redis.pipeline.return_value = pipe

    import app.core.rate_limit as rate_limit_module
    monkeypatch.setattr(rate_limit_module, "get_redis", lambda: mock_redis)

    limiter = rate_limiter(requests_limit=5, window_seconds=60)
    request = create_dummy_request()

    with pytest.raises(HTTPException) as exc_info:
        await limiter(request)

    assert exc_info.value.status_code == 429
    assert exc_info.value.headers.get("Retry-After") == "60"


@pytest.mark.unit
async def test_rate_limiter_failsafe_on_redis_error(monkeypatch):
    import app.core.rate_limit as rate_limit_module
    monkeypatch.setattr(rate_limit_module, "get_redis", MagicMock(side_effect=RuntimeError("Redis down")))

    limiter = rate_limiter(requests_limit=5, window_seconds=60)
    request = create_dummy_request()
    # Must degrade gracefully and permit request
    await limiter(request)
