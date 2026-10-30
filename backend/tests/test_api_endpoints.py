import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from app.schemas.health import ServiceHealth


@pytest.mark.anyio
async def test_health_endpoint(async_client: AsyncClient) -> None:
    db_health = ServiceHealth(status="healthy", latency_ms=1.2, details={"engine": "PostgreSQL"})
    redis_health = ServiceHealth(status="healthy", latency_ms=0.5, details={"mode": "In-Memory Cache"})
    s3_health = ServiceHealth(status="healthy", latency_ms=2.1, details={"bucket": "test-bucket"})

    with patch("app.api.health.check_database", new_callable=AsyncMock, return_value=db_health), \
         patch("app.api.health.check_redis", new_callable=AsyncMock, return_value=redis_health), \
         patch("app.api.health.check_s3", return_value=s3_health):

        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("healthy", "degraded")
        assert "services" in data
        assert data["services"]["database"]["status"] == "healthy"


@pytest.mark.anyio
async def test_auth_login_validation_failure(async_client: AsyncClient) -> None:
    response = await async_client.post("/auth/login", json={"email": "invalid-email"})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_unauthorized_access_to_protected_route(async_client: AsyncClient) -> None:
    response = await async_client.get("/super-admin/stats")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_student_biometric_consent_unauthorized(async_client: AsyncClient) -> None:
    # Requires X-Tenant-ID header to pass TenantResolutionMiddleware
    response = await async_client.post(
        "/student/biometric/consent",
        json={"consent_given": True},
        headers={"X-Tenant-ID": "test-tenant-id"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_teacher_sessions_unauthorized(async_client: AsyncClient) -> None:
    # Requires X-Tenant-ID header to pass TenantResolutionMiddleware
    response = await async_client.get(
        "/teacher/sessions/all",
        headers={"X-Tenant-ID": "test-tenant-id"},
    )
    assert response.status_code == 401
