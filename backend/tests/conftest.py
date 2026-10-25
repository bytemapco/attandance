import os
import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/testdb"
os.environ["JWT_SECRET"] = "test-super-secret-jwt-key-for-testing-only-123456789"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["AWS_ACCESS_KEY_ID"] = "test"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test"
os.environ["S3_BUCKET_NAME"] = "test-bucket"

from main import app
from app.core.security import create_access_token


class FakeRedisPipeline:
    def __init__(self, fake_redis):
        self.fake_redis = fake_redis
        self.commands = []

    def zremrangebyscore(self, key, min_score, max_score):
        self.commands.append(("zremrangebyscore", key, min_score, max_score))
        return self

    def zcard(self, key):
        self.commands.append(("zcard", key))
        return self

    def zadd(self, key, mapping):
        self.commands.append(("zadd", key, mapping))
        return self

    def expire(self, key, seconds):
        self.commands.append(("expire", key, seconds))
        return self

    async def execute(self):
        results = []
        for command in self.commands:
            cmd = command[0]
            if cmd == "zremrangebyscore":
                results.append(0)
            elif cmd == "zcard":
                key = command[1]
                count = len(self.fake_redis.storage.get(key, []))
                results.append(count)
            elif cmd == "zadd":
                key = command[1]
                mapping = command[2]
                items = self.fake_redis.storage.setdefault(key, [])
                for score in mapping.values():
                    items.append(float(score))
                results.append(len(mapping))
            elif cmd == "expire":
                results.append(True)
        self.commands = []
        return results


class FakeRedis:
    def __init__(self):
        self.storage = {}

    async def ping(self):
        return True

    async def get(self, key: str):
        return self.storage.get(key)

    async def set(self, key: str, value: str, ex: int | None = None):
        self.storage[key] = value
        return True

    async def delete(self, key: str):
        self.storage.pop(key, None)
        return True

    async def incr(self, key: str) -> int:
        current = int(self.storage.get(key, 0))
        self.storage[key] = str(current + 1)
        return current + 1

    async def expire(self, key: str, seconds: int) -> bool:
        return True

    def pipeline(self):
        return FakeRedisPipeline(self)

    def __await__(self):
        async def _resolve():
            return self
        return _resolve().__await__()

    async def aclose(self):
        pass


@pytest.fixture
def fake_redis(monkeypatch):
    redis_instance = FakeRedis()
    import app.db.redis as redis_module
    import app.core.rate_limit as rate_limit_module
    import app.api.dependencies as deps_module

    monkeypatch.setattr(redis_module, "redis_client", redis_instance)
    monkeypatch.setattr(redis_module, "get_redis", lambda: redis_instance)
    monkeypatch.setattr(rate_limit_module, "get_redis", lambda: redis_instance)
    monkeypatch.setattr(deps_module, "get_redis", lambda: redis_instance)
    return redis_instance


@pytest.fixture
def mock_db(monkeypatch):
    mock_prisma = MagicMock()
    mock_prisma.query_raw = AsyncMock(return_value=[{"?column?": 1}])
    mock_prisma.is_connected = MagicMock(return_value=True)
    mock_prisma.connect = AsyncMock()
    mock_prisma.disconnect = AsyncMock()

    mock_prisma.user = MagicMock()
    mock_prisma.user.find_unique = AsyncMock()
    mock_prisma.user.find_first = AsyncMock()
    mock_prisma.user.create = AsyncMock()

    mock_prisma.student = MagicMock()
    mock_prisma.student.find_unique = AsyncMock()
    mock_prisma.student.find_first = AsyncMock()
    mock_prisma.student.update = AsyncMock()

    mock_prisma.teacher = MagicMock()
    mock_prisma.teacher.find_unique = AsyncMock()
    mock_prisma.teacher.find_first = AsyncMock()

    mock_prisma.tenant = MagicMock()
    mock_prisma.tenant.find_unique = AsyncMock()

    mock_prisma.session = MagicMock()
    mock_prisma.session.find_unique = AsyncMock()
    mock_prisma.session.find_many = AsyncMock(return_value=[])

    mock_prisma.attendance = MagicMock()
    mock_prisma.attendance.find_many = AsyncMock(return_value=[])

    mock_prisma.leaverequest = MagicMock()
    mock_prisma.leaverequest.find_many = AsyncMock(return_value=[])

    import app.db.client as db_client_module
    monkeypatch.setattr(db_client_module, "db", mock_prisma)

    import app.api.health as health_module
    monkeypatch.setattr(health_module, "db", mock_prisma)

    import app.api.auth as auth_module
    monkeypatch.setattr(auth_module, "db", mock_prisma)

    import app.services.auth_service as auth_service_module
    monkeypatch.setattr(auth_service_module, "db", mock_prisma)

    import app.repositories.user_repositorysitory as user_repo_module
    monkeypatch.setattr(user_repo_module, "db", mock_prisma)

    import app.repositories.student_repositorysitory as student_repo_module
    monkeypatch.setattr(student_repo_module, "db", mock_prisma)

    import app.repositories.teacher_repositorysitory as teacher_repo_module
    monkeypatch.setattr(teacher_repo_module, "db", mock_prisma)

    return mock_prisma


@pytest.fixture
async def async_client(fake_redis, mock_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture
def create_test_token():
    def _generator(user_id: str, role: str, tenant_id: str | None = None) -> str:
        extra_data = {"tid": tenant_id, "tenant_id": tenant_id} if tenant_id else None
        return create_access_token(subject=user_id, role=role, extra_data=extra_data)

    return _generator
