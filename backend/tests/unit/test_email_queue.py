from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from arq import Retry

from app import worker
from app.services import email_queue, invitations


@pytest.fixture(autouse=True)
def no_cached_pool(monkeypatch):
    monkeypatch.setattr(email_queue, "_pool", None)


def queue_that_accepts(monkeypatch, accepted=True):
    pool = MagicMock()
    pool.enqueue_job = AsyncMock(return_value=SimpleNamespace(job_id="j-1") if accepted else None)
    monkeypatch.setattr(email_queue, "create_pool", AsyncMock(return_value=pool))
    return pool


class TestEnqueueEmail:
    async def test_it_queues_the_named_email_with_its_arguments(self, monkeypatch):
        pool = queue_that_accepts(monkeypatch)

        assert await email_queue.enqueue_email("send_invitation_email", to_email="a@b.in") is True

        pool.enqueue_job.assert_awaited_once_with("deliver_email", "send_invitation_email", {"to_email": "a@b.in"})

    async def test_it_refuses_a_method_that_is_not_a_queued_email(self, monkeypatch):
        queue_that_accepts(monkeypatch)

        with pytest.raises(ValueError):
            await email_queue.enqueue_email("send_email", to_email="a@b.in")

    async def test_an_unreachable_queue_is_reported_not_raised(self, monkeypatch):
        monkeypatch.setattr(email_queue, "create_pool", AsyncMock(side_effect=ConnectionError("redis down")))

        assert await email_queue.enqueue_email("send_invitation_email", to_email="a@b.in") is False

    async def test_a_job_that_cannot_be_enqueued_is_reported_not_raised(self, monkeypatch):
        pool = queue_that_accepts(monkeypatch)
        pool.enqueue_job.side_effect = ConnectionError("redis went away")

        assert await email_queue.enqueue_email("send_invitation_email", to_email="a@b.in") is False

    async def test_a_duplicate_job_that_arq_declines_is_not_counted_as_queued(self, monkeypatch):
        queue_that_accepts(monkeypatch, accepted=False)

        assert await email_queue.enqueue_email("send_invitation_email", to_email="a@b.in") is False

    async def test_the_pool_is_opened_once_and_closed_on_shutdown(self, monkeypatch):
        pool = queue_that_accepts(monkeypatch)
        pool.aclose = AsyncMock()

        await email_queue.enqueue_email("send_invitation_email", to_email="a@b.in")
        await email_queue.enqueue_email("send_invitation_email", to_email="c@d.in")
        await email_queue.close_queue()

        assert email_queue.create_pool.await_count == 1
        pool.aclose.assert_awaited_once()


class TestInvitation:
    async def test_it_queues_the_mail_and_never_sends_it_inline(self, monkeypatch):
        monkeypatch.setattr(invitations, "AuthService", lambda: SimpleNamespace(create_invitation_token=AsyncMock(return_value="tok")))
        queued = AsyncMock(return_value=True)
        monkeypatch.setattr(invitations, "enqueue_email", queued)

        result = await invitations.send_invitation("u-1", "a@b.in", "Asha", "STUDENT", "Enrollment Number", "EN1", "temp-pw")

        assert result is True
        method, = queued.await_args.args
        assert method == "send_invitation_email"
        assert queued.await_args.kwargs["invite_token"] == "tok"
        assert queued.await_args.kwargs["temp_password"] == "temp-pw"

    async def test_an_unqueueable_invitation_is_false_not_an_error(self, monkeypatch):
        monkeypatch.setattr(invitations, "AuthService", lambda: SimpleNamespace(create_invitation_token=AsyncMock(return_value="tok")))
        monkeypatch.setattr(invitations, "enqueue_email", AsyncMock(return_value=False))

        assert await invitations.send_invitation("u-1", "a@b.in", "Asha", "STUDENT", "x", "y", None) is False

    async def test_a_failure_creating_the_token_is_false_not_an_error(self, monkeypatch):
        monkeypatch.setattr(
            invitations, "AuthService", lambda: SimpleNamespace(create_invitation_token=AsyncMock(side_effect=RuntimeError("boom")))
        )

        assert await invitations.send_invitation("u-1", "a@b.in", "Asha", "STUDENT", "x", "y", None) is False


class TestWorker:
    @pytest.fixture
    def mail(self, monkeypatch):
        service = SimpleNamespace(send_invitation_email=AsyncMock(return_value=True))
        monkeypatch.setattr(worker, "email_service", service)
        return service

    async def test_a_delivered_mail_finishes_the_job(self, mail):
        assert await worker.deliver_email({"job_try": 1}, "send_invitation_email", {"to_email": "a@b.in"}) is True
        mail.send_invitation_email.assert_awaited_once_with(to_email="a@b.in")

    async def test_a_failed_delivery_is_retried_with_a_growing_delay(self, mail):
        mail.send_invitation_email.return_value = False

        delays = []
        for attempt in (1, 2, 3):
            with pytest.raises(Retry) as caught:
                await worker.deliver_email({"job_try": attempt}, "send_invitation_email", {})
            delays.append(caught.value.defer_score / 1000)

        assert delays == [60, 120, 180]

    async def test_the_last_attempt_gives_up_and_says_so(self, mail, caplog):
        mail.send_invitation_email.return_value = False

        result = await worker.deliver_email({"job_try": worker.MAX_TRIES}, "send_invitation_email", {})

        assert result is False
        assert "Gave up" in caplog.text

    async def test_a_method_outside_the_allow_list_is_refused(self, mail):
        with pytest.raises(ValueError):
            await worker.deliver_email({"job_try": 1}, "send_password_reset_email", {})
