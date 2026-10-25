from unittest.mock import AsyncMock
import pytest


@pytest.mark.integration
async def test_health_check_healthy(async_client, mock_db, fake_redis):
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "services" in data
    assert "database" in data["services"]
    assert "redis" in data["services"]
    assert "storage" in data["services"]
    assert "ai_engine" in data["services"]


@pytest.mark.integration
async def test_health_check_database_unhealthy_returns_503(async_client, mock_db):
    mock_db.query_raw = AsyncMock(side_effect=ConnectionError("Database disconnected"))

    response = await async_client.get("/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unhealthy"
    assert data["services"]["database"]["status"] == "unhealthy"


@pytest.mark.integration
async def test_api_v1_health_alias(async_client, mock_db):
    response = await async_client.get("/api/v1/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "environment" in data
    assert "version" in data
