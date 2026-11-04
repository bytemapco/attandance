from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.middleware import tenant as middleware
from app.middleware.tenant import TenantResolutionMiddleware, get_current_tenant_id
from app.services import tenant_resolver
from app.services.tenant_resolver import TenantResolutionError, resolve_tenant_id

app = FastAPI()
app.add_middleware(TenantResolutionMiddleware)


@app.get("/api/v1/things")
async def things() -> dict:
    return {"tenant": get_current_tenant_id()}


@pytest.fixture
def resolver(monkeypatch):
    fake = AsyncMock(side_effect=lambda identifier: f"id-of-{identifier}")
    monkeypatch.setattr(middleware, "resolve_tenant_id", fake)
    monkeypatch.setattr(middleware.settings, "ENVIRONMENT", "production")
    return fake


def bearer(role="TEACHER", tid=None):
    extra = {"tid": tid} if tid else None
    return {"Authorization": f"Bearer {create_access_token(subject='u1', role=role, extra_data=extra)}"}


def test_the_tenant_in_the_token_is_the_one_used(resolver):
    response = TestClient(app).get("/api/v1/things", headers=bearer(tid="acme"))
    assert response.json() == {"tenant": "id-of-acme"}


def test_a_header_that_disagrees_with_the_token_is_refused(resolver):
    response = TestClient(app).get("/api/v1/things", headers={**bearer(tid="acme"), "X-Tenant-ID": "rival"})
    assert response.status_code == 403
    resolver.assert_not_awaited()


def test_a_super_admin_needs_no_tenant(resolver):
    assert TestClient(app).get("/api/v1/things", headers=bearer(role="SUPER_ADMIN")).json() == {"tenant": None}


def test_a_refresh_token_does_not_pick_a_tenant(resolver):
    from app.core.security import create_refresh_token

    headers = {"Authorization": f"Bearer {create_refresh_token(subject='u1', role='SUPER_ADMIN')}"}
    assert TestClient(app).get("/api/v1/things", headers=headers).status_code == 400


def test_outside_development_a_request_must_name_its_tenant(resolver):
    assert TestClient(app).get("/api/v1/things").status_code == 400


def test_in_development_a_request_without_a_tenant_uses_the_default_institution(resolver, monkeypatch):
    monkeypatch.setattr(middleware.settings, "ENVIRONMENT", "development")
    assert TestClient(app).get("/api/v1/things").json() == {"tenant": "id-of-default-institution"}
    strict = TestClient(app).get("/api/v1/things", headers={"X-Strict-Tenant-Check": "1"})
    assert strict.status_code == 400


def test_a_tenant_that_cannot_be_used_stops_the_request(resolver):
    resolver.side_effect = TenantResolutionError(403, "Tenant account is currently suspended.")
    response = TestClient(app).get("/api/v1/things", headers={"X-Tenant-ID": "acme"})
    assert (response.status_code, response.json()) == (403, {"detail": "Tenant account is currently suspended."})


@pytest.mark.parametrize(
    "host, expected",
    [
        ("acme.sahaj.example.com", "acme"),
        ("api.acme.sahaj.example.com", "acme"),
        ("api.admin.example.com", None),
        ("sahaj-backend.example.com", None),
        ("localhost:8000", None),
        ("example.com", None),
    ],
)
def test_the_subdomain_names_the_tenant(host, expected):
    request = SimpleNamespace(headers={"host": host})
    assert middleware._subdomain_tenant(request) == expected


class FakeRedis:
    def __init__(self, value=None):
        self.value, self.stored = value, {}

    async def get(self, key):
        return self.value

    async def setex(self, key, ttl, value):
        self.stored[key] = (ttl, value)


async def test_a_suspended_tenant_is_refused_from_the_cache(monkeypatch):
    monkeypatch.setattr(tenant_resolver, "get_redis", lambda: FakeRedis("SUSPENDED:t1"))
    with pytest.raises(TenantResolutionError) as caught:
        await resolve_tenant_id("acme")
    assert caught.value.status_code == 403


async def test_a_cached_tenant_needs_no_database_lookup(monkeypatch):
    monkeypatch.setattr(tenant_resolver, "get_redis", lambda: FakeRedis("ACTIVE:t1"))
    assert await resolve_tenant_id("acme") == "t1"


async def test_an_active_tenant_is_looked_up_once_then_cached(monkeypatch):
    redis = FakeRedis()
    monkeypatch.setattr(tenant_resolver, "get_redis", lambda: redis)
    find = AsyncMock(return_value=SimpleNamespace(id="t1", status="ACTIVE"))
    monkeypatch.setattr(tenant_resolver, "db", SimpleNamespace(tenant=SimpleNamespace(find_first=find)))
    assert await resolve_tenant_id("acme") == "t1"
    assert redis.stored == {"tenant:resolved:acme": (3600, "ACTIVE:t1")}


@pytest.mark.parametrize("tenant, code", [(None, 404), (SimpleNamespace(id="t1", status="SUSPENDED"), 403)])
async def test_unknown_and_inactive_tenants_are_refused(monkeypatch, tenant, code):
    monkeypatch.setattr(tenant_resolver, "get_redis", lambda: FakeRedis())
    find = AsyncMock(return_value=tenant)
    monkeypatch.setattr(tenant_resolver, "db", SimpleNamespace(tenant=SimpleNamespace(find_first=find)))
    with pytest.raises(TenantResolutionError) as caught:
        await resolve_tenant_id("acme")
    assert caught.value.status_code == code


async def test_a_database_failure_is_reported_not_swallowed(monkeypatch):
    monkeypatch.setattr(tenant_resolver, "get_redis", lambda: FakeRedis())
    find = AsyncMock(side_effect=RuntimeError("down"))
    monkeypatch.setattr(tenant_resolver, "db", SimpleNamespace(tenant=SimpleNamespace(find_first=find)))
    with pytest.raises(TenantResolutionError) as caught:
        await resolve_tenant_id("acme")
    assert caught.value.status_code == 500
