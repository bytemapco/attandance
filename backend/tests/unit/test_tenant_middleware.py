from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.security import create_access_token, create_refresh_token
from app.middleware import tenant as middleware
from app.services.tenant_resolver import TenantResolutionError


@pytest.fixture
def client(monkeypatch):
    resolved = AsyncMock(return_value="resolved-tid")
    monkeypatch.setattr(middleware, "resolve_tenant_id", resolved)
    app = FastAPI()
    app.add_middleware(middleware.TenantResolutionMiddleware)

    @app.get("/api/v1/things")
    async def things():
        return {"tenant": middleware.get_current_tenant_id()}

    @app.get("/health")
    async def health():
        return {"ok": True}

    test_client = TestClient(app)
    test_client.resolved = resolved
    return test_client


def bearer(role="TEACHER", tid="tid-1"):
    return {"Authorization": f"Bearer {create_access_token('u-1', role, extra_data={'tid': tid})}"}


class TestTenantMiddleware:
    def test_exempt_paths_skip_tenant_resolution(self, client):
        assert client.get("/health").status_code == 200
        client.resolved.assert_not_awaited()

    def test_the_header_names_the_tenant(self, client):
        response = client.get("/api/v1/things", headers={"X-Tenant-ID": "acme"})

        assert response.json() == {"tenant": "resolved-tid"}
        client.resolved.assert_awaited_once_with("acme")

    def test_the_tenant_in_the_token_is_used_when_there_is_no_header(self, client):
        client.get("/api/v1/things", headers=bearer(tid="tid-9"))
        client.resolved.assert_awaited_once_with("tid-9")

    def test_a_header_that_disagrees_with_the_token_is_a_403(self, client):
        response = client.get("/api/v1/things", headers={**bearer(tid="tid-1"), "X-Tenant-ID": "other"})

        assert response.status_code == 403
        assert "Cross-tenant" in response.json()["detail"]
        client.resolved.assert_not_awaited()

    def test_a_matching_header_and_token_pass(self, client):
        response = client.get("/api/v1/things", headers={**bearer(tid="tid-1"), "X-Tenant-ID": "tid-1"})
        assert response.status_code == 200

    def test_a_super_admin_is_not_bound_to_a_tenant(self, client):
        response = client.get("/api/v1/things", headers={**bearer(role="SUPER_ADMIN"), "X-Tenant-ID": "any"})

        assert response.status_code == 200
        client.resolved.assert_not_awaited()

    def test_a_forged_token_does_not_count_as_a_tenant_claim(self, client):
        client.get("/api/v1/things", headers={"Authorization": "Bearer not.a.token", "X-Tenant-ID": "acme"})
        client.resolved.assert_awaited_once_with("acme")

    def test_a_refresh_token_is_not_used_to_pick_a_tenant(self, client):
        headers = {"Authorization": f"Bearer {create_refresh_token('u-1', 'ADMIN')}", "X-Tenant-ID": "acme"}
        client.get("/api/v1/things", headers=headers)
        client.resolved.assert_awaited_once_with("acme")

    def test_a_resolution_error_becomes_its_http_status(self, client):
        client.resolved.side_effect = TenantResolutionError(403, "Tenant account is currently suspended.")

        response = client.get("/api/v1/things", headers={"X-Tenant-ID": "acme"})

        assert response.status_code == 403

    def test_a_production_request_with_no_tenant_is_a_400(self, client, monkeypatch):
        monkeypatch.setattr(middleware.settings, "ENVIRONMENT", "production")

        response = client.get("/api/v1/things")

        assert response.status_code == 400

    def test_local_development_falls_back_to_the_default_institution(self, client, monkeypatch):
        monkeypatch.setattr(middleware.settings, "ENVIRONMENT", "development")
        client.get("/api/v1/things")
        client.resolved.assert_awaited_once_with("default-institution")

    def test_strict_header_disables_the_local_fallback(self, client, monkeypatch):
        monkeypatch.setattr(middleware.settings, "ENVIRONMENT", "development")
        response = client.get("/api/v1/things", headers={middleware.STRICT_TENANT_HEADER: "1"})
        assert response.status_code == 400

    def test_the_tenant_context_does_not_leak_between_requests(self, client):
        client.get("/api/v1/things", headers={"X-Tenant-ID": "acme"})
        assert middleware.get_current_tenant_id() is None


class TestSubdomain:
    @staticmethod
    def request(host):
        return SimpleNamespace(headers={"host": host})

    @pytest.mark.parametrize(
        "host, expected",
        [
            ("acme.sahaj.example.com", "acme"),
            ("acme.sahaj.example.com:8443", "acme"),
            ("localhost:3000", None),
            ("example.com", None),
            ("www.example.com", None),
            ("attendance-backend.bytemap.in", None),
            ("acme-backend.bytemap.in", None),
            ("www.acme.sahaj.example.com", "acme"),
            ("", None),
        ],
    )
    def test_which_hosts_name_a_tenant(self, host, expected):
        assert middleware._subdomain_tenant(self.request(host)) == expected
