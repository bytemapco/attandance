"""The super admin's health view reports only what it measured, and the overall status follows the rules below."""
import pytest

from app.services.super_admin import system_health_service as health


class FakeRedis:
    def __init__(self, heartbeat=True, waiting=0, fail=False):
        self.heartbeat, self.waiting, self.fail = heartbeat, waiting, fail

    async def ping(self):
        if self.fail:
            raise ConnectionError("redis down")
        return True

    async def info(self, section):
        return {"used_memory_human": "1.5M"} if section == "memory" else {"connected_clients": 4}

    async def exists(self, key):
        assert key == health.ARQ_HEARTBEAT
        return int(self.heartbeat)

    async def zcard(self, key):
        assert key == health.ARQ_QUEUE
        return self.waiting


class FakeDb:
    def __init__(self, fail=False):
        self.fail = fail

    async def query_raw(self, sql):
        if self.fail:
            raise ConnectionError("db down")
        if "server_version" in sql:
            return [{"server_version": "16.4"}]
        if "pg_stat_activity" in sql:
            return [{"total": 7}]
        return [{"max_connections": "100"}]


class FakeBucket:
    def __init__(self, bucket="attendance-prod", fail=False):
        self.bucket_name = bucket
        self.fail = fail
        self.client = self

    def head_bucket(self, Bucket):
        if self.fail:
            raise PermissionError("denied")


def healthy_world(monkeypatch, **overrides):
    monkeypatch.setattr(health, "db", overrides.get("db", FakeDb()))
    monkeypatch.setattr(health, "get_redis", lambda: overrides.get("redis", FakeRedis()))
    monkeypatch.setattr(health, "s3_service", overrides.get("s3", FakeBucket()))
    monkeypatch.setattr(health.hardware_manager, "get_status", lambda: {"active_device": "/device:CPU:0", "target_device": "auto"})


async def test_everything_working_is_healthy_and_shows_the_measured_figures(monkeypatch):
    healthy_world(monkeypatch)
    result = await health.SystemHealthService.get_system_health()

    assert result["status"] == "healthy"
    assert result["services"]["postgresql"]["details"] == {"version": "16.4", "connections": 7, "max_connections": 100}
    assert result["services"]["redis_cache"]["details"] == {"memory_used": "1.5M", "clients": 4}
    assert result["services"]["email_worker"]["details"] == {"online": True, "jobs_waiting": 0}
    assert result["services"]["object_storage"]["details"]["bucket"] == "attendance-prod"


async def test_a_lost_database_makes_the_platform_unhealthy_and_no_figure_is_invented(monkeypatch):
    healthy_world(monkeypatch, db=FakeDb(fail=True))
    result = await health.SystemHealthService.get_system_health()

    assert result["status"] == "unhealthy"
    assert result["services"]["postgresql"]["status"] == "down"
    assert result["services"]["postgresql"]["latency_ms"] is None
    assert "error" in result["services"]["postgresql"]["details"]


async def test_redis_down_only_degrades_the_platform(monkeypatch):
    healthy_world(monkeypatch, redis=FakeRedis(fail=True))
    result = await health.SystemHealthService.get_system_health()
    assert result["status"] == "degraded" and result["services"]["redis_cache"]["status"] == "down"


async def test_no_bucket_is_reported_as_not_configured_not_as_ready(monkeypatch):
    healthy_world(monkeypatch, s3=FakeBucket(bucket=""))
    result = await health.SystemHealthService.get_system_health()
    assert result["services"]["object_storage"]["status"] == "not_configured"
    assert result["status"] == "healthy"


async def test_a_bucket_that_refuses_the_check_is_down_and_degrades_the_platform(monkeypatch):
    healthy_world(monkeypatch, s3=FakeBucket(fail=True))
    result = await health.SystemHealthService.get_system_health()
    assert result["services"]["object_storage"]["status"] == "down" and result["status"] == "degraded"


async def test_a_stopped_worker_with_jobs_waiting_is_a_warning(monkeypatch):
    healthy_world(monkeypatch, redis=FakeRedis(heartbeat=False, waiting=3))
    result = await health.SystemHealthService.get_system_health()
    assert result["services"]["email_worker"] == {"status": "warning", "latency_ms": result["services"]["email_worker"]["latency_ms"],
                                                  "details": {"online": False, "jobs_waiting": 3}}


async def test_a_stopped_worker_with_nothing_waiting_is_down(monkeypatch):
    healthy_world(monkeypatch, redis=FakeRedis(heartbeat=False, waiting=0))
    result = await health.SystemHealthService.get_system_health()
    assert result["services"]["email_worker"]["status"] == "down" and result["status"] == "degraded"


async def test_uptime_is_how_long_this_process_has_run(monkeypatch):
    healthy_world(monkeypatch)
    monkeypatch.setattr(health, "STARTED_AT", health.time.time() - 90)
    result = await health.SystemHealthService.get_system_health()
    assert 89 <= result["server_uptime_seconds"] <= 92


@pytest.mark.parametrize("statuses, expected", [
    (["healthy", "healthy", "healthy", "healthy"], "healthy"),
    (["healthy", "not_configured", "healthy", "healthy"], "healthy"),
    (["healthy", "warning", "healthy", "healthy"], "degraded"),
    (["down", "healthy", "healthy", "healthy"], "unhealthy"),
])
def test_the_overall_status_follows_the_rules(statuses, expected):
    services = {name: {"status": s} for name, s in zip(["postgresql", "redis_cache", "object_storage", "email_worker"], statuses)}
    services["ai_hardware"] = {"status": "healthy"}
    assert health._overall(services) == expected
