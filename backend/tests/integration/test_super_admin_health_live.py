"""The platform health endpoint, called through the real API against the real PostgreSQL and Redis."""
from tests.integration.institution import Institution


def test_the_health_view_reports_the_measured_database_and_redis(client, seed):
    headers = Institution(seed, role="SUPER_ADMIN").sign_in(client)

    response = client.get("/api/v1/super-admin/system-health", headers=headers)

    assert response.status_code == 200
    body = response.json()
    database = body["services"]["postgresql"]
    assert database["status"] == "healthy"
    assert database["details"]["version"].startswith("1")
    assert 1 <= database["details"]["connections"] <= database["details"]["max_connections"]
    assert body["services"]["redis_cache"]["status"] == "healthy"
    assert body["services"]["redis_cache"]["details"]["memory_used"]
    assert body["server_uptime_seconds"] >= 0
