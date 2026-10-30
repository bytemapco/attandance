import os
import sys
import pytest
from typing import AsyncGenerator
from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient

os.environ["ENVIRONMENT"] = "testing"
os.environ["JWT_SECRET"] = "test-jwt-secret-for-testing-purposes-only-32bytes"
os.environ["DATABASE_URL"] = "postgresql://postgres:password@localhost:5432/test"
os.environ["REDIS_URL"] = "redis://localhost:6379/1"
os.environ["AI_FORCE_CPU_FALLBACK"] = "true"
os.environ["AI_DEVICE"] = "cpu"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_redis = AsyncMock()
    mock_redis.ping.return_value = True
    # If key starts with tenant:resolved:, return a valid tenant id
    async def fake_get(key: str):
        if "tenant:resolved:" in key:
            return "test-tenant-id"
        return None

    mock_redis.get = fake_get
    mock_redis.set.return_value = True
    mock_redis.delete.return_value = 1
    mock_redis.exists.return_value = 0
    monkeypatch.setattr("app.db.redis.redis_client", mock_redis)
    monkeypatch.setattr("app.db.redis.get_redis", lambda: mock_redis)


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver/api/v1") as client:
        yield client
