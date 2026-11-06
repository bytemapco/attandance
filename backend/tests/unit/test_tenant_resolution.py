from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services import tenant_resolver as resolver
from app.services.tenant_resolver import TenantResolutionError, resolve_tenant_id


class FakeRedis:
    def __init__(self, data=None, broken=False):
        self.data = dict(data or {})
        self.broken = broken

    async def get(self, key):
        if self.broken:
            raise ConnectionError("down")
        return self.data.get(key)

    async def setex(self, key, ttl, value):
        if self.broken:
            raise ConnectionError("down")
        self.data[key] = value

    async def delete(self, key):
        self.data.pop(key, None)


def tenant_row(status="ACTIVE", tenant_id="tid-1"):
    return SimpleNamespace(id=tenant_id, status=status)


@pytest.fixture
def world(monkeypatch):
    redis = FakeRedis()
    db = MagicMock()
    db.tenant.find_first = AsyncMock(return_value=tenant_row())
    monkeypatch.setattr(resolver, "get_redis", lambda: redis)
    monkeypatch.setattr(resolver, "db", db)
    return SimpleNamespace(redis=redis, db=db)


class TestResolveTenantId:
    async def test_an_active_tenant_resolves_to_its_id(self, world):
        assert await resolve_tenant_id("acme") == "tid-1"

    async def test_the_lookup_matches_by_id_or_slug(self, world):
        await resolve_tenant_id("acme")
        where = world.db.tenant.find_first.await_args.kwargs["where"]
        assert where == {"OR": [{"id": "acme"}, {"slug": "acme"}]}

    async def test_the_second_lookup_comes_from_the_cache(self, world):
        await resolve_tenant_id("acme")
        world.db.tenant.find_first.reset_mock()

        assert await resolve_tenant_id("acme") == "tid-1"
        world.db.tenant.find_first.assert_not_awaited()

    async def test_an_unknown_tenant_is_a_404(self, world):
        world.db.tenant.find_first.return_value = None

        with pytest.raises(TenantResolutionError) as caught:
            await resolve_tenant_id("ghost")

        assert caught.value.status_code == 404

    async def test_a_suspended_tenant_is_a_403(self, world):
        world.db.tenant.find_first.return_value = tenant_row(status="SUSPENDED")

        with pytest.raises(TenantResolutionError) as caught:
            await resolve_tenant_id("acme")

        assert caught.value.status_code == 403

    async def test_a_suspended_tenant_is_never_cached_as_active(self, world):
        world.db.tenant.find_first.return_value = tenant_row(status="SUSPENDED")
        with pytest.raises(TenantResolutionError):
            await resolve_tenant_id("acme")

        assert world.redis.data == {}

    async def test_a_cached_suspension_blocks_without_touching_the_database(self, world):
        world.redis.data["tenant:resolved:acme"] = "SUSPENDED:tid-1"

        with pytest.raises(TenantResolutionError) as caught:
            await resolve_tenant_id("acme")

        assert caught.value.status_code == 403
        world.db.tenant.find_first.assert_not_awaited()

    async def test_a_database_failure_is_a_500_not_a_leak(self, world):
        world.db.tenant.find_first.side_effect = RuntimeError("connection reset")

        with pytest.raises(TenantResolutionError) as caught:
            await resolve_tenant_id("acme")

        assert caught.value.status_code == 500

    async def test_redis_down_still_resolves_from_the_database(self, world):
        world.redis.broken = True
        assert await resolve_tenant_id("acme") == "tid-1"


