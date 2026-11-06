"""E-mail goes through a real Redis queue and a real worker: a request returns before any mail is sent."""
import asyncio
import os
import time
import uuid

import pytest
from arq.connections import RedisSettings
from arq.worker import Worker
from redis.asyncio import Redis

from app.services.email_service import EmailService
from app.worker import RETRY_DELAY_SECONDS, WorkerSettings
from tests.integration.institution import Institution

SLOW_SMTP_SECONDS = 3


@pytest.fixture
def sent(monkeypatch):
    """Replaces the SMTP call with a slow one, and records what would have been sent."""
    calls = []

    async def slow_send(to_email, subject, template_name, context, frontend_url=None):
        await asyncio.sleep(SLOW_SMTP_SECONDS)
        calls.append({"to": to_email, "template": template_name, "context": context})
        return True

    monkeypatch.setattr(EmailService, "send_email", staticmethod(slow_send))
    return calls


@pytest.fixture
async def redis():
    url = os.environ.get("TEST_REDIS_URL")
    if not url:
        pytest.skip("TEST_REDIS_URL is not set; the queue needs a Redis server.")
    client = Redis.from_url(url)
    yield client
    await client.aclose()


def new_worker(**options) -> Worker:
    return Worker(
        functions=WorkerSettings.functions,
        redis_settings=RedisSettings.from_dsn(os.environ["TEST_REDIS_URL"]),
        max_tries=WorkerSettings.max_tries,
        keep_result=0,
        handle_signals=False,
        **options,
    )


async def run_worker() -> None:
    """Works through everything queued, then stops."""
    worker = new_worker(burst=True)
    await worker.main()
    await worker.close()


async def run_worker_briefly(seconds: float = 2.0) -> None:
    """For a job that is retried later: burst mode would wait for it forever, so stop a normal worker instead."""
    worker = new_worker(poll_delay=0.1)
    task = asyncio.create_task(worker.main())
    await asyncio.sleep(seconds)
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)
    await worker.close()


def add_admin(client, super_admin_headers, tenant_id, email):
    started = time.perf_counter()
    response = client.post(
        f"/api/v1/super-admin/tenants/{tenant_id}/admins",
        headers=super_admin_headers,
        json={"name": "New Admin", "email": email, "role": "TENANT_ADMIN"},
    )
    return response, time.perf_counter() - started


@pytest.fixture
def platform(seed, client):
    super_admin = Institution(seed, role="SUPER_ADMIN")
    college = Institution(seed)
    return super_admin.sign_in(client), college.tenant_id


async def test_the_request_returns_long_before_the_slow_mail_server_answers(client, platform, sent, redis):
    headers, tenant_id = platform
    email = f"{uuid.uuid4().hex[:10]}@example.com"

    response, seconds = add_admin(client, headers, tenant_id, email)

    assert response.status_code == 201 and response.json()["invitation_sent"] is True
    assert seconds < SLOW_SMTP_SECONDS - 1
    assert sent == []
    assert await redis.zcard("arq:queue") == 1


async def test_the_worker_then_sends_the_queued_invitation_once(client, platform, sent, redis):
    headers, tenant_id = platform
    email = f"{uuid.uuid4().hex[:10]}@example.com"
    add_admin(client, headers, tenant_id, email)

    await run_worker()

    assert [call["to"] for call in sent] == [email]
    assert sent[0]["template"] == "user_invite.html"
    assert await redis.zcard("arq:queue") == 0


async def test_a_mail_that_fails_to_send_waits_in_the_queue_for_its_retry(client, platform, monkeypatch, redis):
    attempts = []

    async def failing_send(*_, **__):
        attempts.append(1)
        return False

    monkeypatch.setattr(EmailService, "send_email", staticmethod(failing_send))
    headers, tenant_id = platform
    add_admin(client, headers, tenant_id, f"{uuid.uuid4().hex[:10]}@example.com")

    await run_worker_briefly()

    (_, due_at), = await redis.zrange("arq:queue", 0, -1, withscores=True)
    assert len(attempts) == 1
    assert due_at > time.time() * 1000 + (RETRY_DELAY_SECONDS - 5) * 1000, "the retry must be deferred, not immediate"
