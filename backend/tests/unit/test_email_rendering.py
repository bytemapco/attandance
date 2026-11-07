"""Every e-mail the system sends renders with its real template and logo and reaches the SMTP call. Only that call is replaced."""
import pytest

from app.core.config import settings
from app.services import email_service as email_module
from app.services.email_service import EmailService


@pytest.fixture
def outbox(monkeypatch):
    sent = []

    async def record(message, **options):
        sent.append((message, options))

    for name, value in (
        ("SMTP_HOST", "smtp.test"), ("SMTP_PORT", 587), ("SMTP_USER", "mailer@example.com"),
        ("SMTP_PASSWORD", "secret"), ("EMAILS_FROM_EMAIL", "mailer@example.com"),
    ):
        monkeypatch.setattr(settings, name, value)
    monkeypatch.setattr(email_module.aiosmtplib, "send", record)
    return sent


def html_of(message) -> str:
    alternatives = message.get_payload()[0]
    return alternatives.get_payload()[1].get_payload(decode=True).decode()


def text_of(message) -> str:
    alternatives = message.get_payload()[0]
    return alternatives.get_payload()[0].get_payload(decode=True).decode()


CASES = {
    "invite_student": (
        lambda s: s.send_invitation_email("a@example.com", "Asha Rao", "STUDENT", "tok1", "Enrollment Number", "EN001", "Tmp#1"),
        "Set up your SAHAJ account", ["as a student", "Enrollment Number", "EN001", "/onboarding?token=tok1", "Tmp#1"],
    ),
    "invite_teacher": (
        lambda s: s.send_invitation_email("a@example.com", "Ravi Iyer", "TEACHER", "tok2", "Employee ID", "EM001", "Tmp#2"),
        "Set up your SAHAJ account", ["as a teacher", "Employee ID", "EM001", "/onboarding?token=tok2", "Tmp#2"],
    ),
    "invite_administrator": (
        lambda s: s.send_invitation_email("a@example.com", "Meena Das", "TENANT_ADMIN", "tok3"),
        "Set up your SAHAJ account", ["as an administrator", "/onboarding?token=tok3"],
    ),
    "password_reset": (
        lambda s: s.send_password_reset_email("a@example.com", "Ravi", "tok4", "TEACHER"),
        "Choose a new SAHAJ password", ["/reset-password?token=tok4"],
    ),
    "device_requested": (
        lambda s: s.send_device_change_requested_email("a@example.com", "Asha", "EN001", "uuid-1", "Lost my phone"),
        "We received your new device request", ["EN001", "Lost my phone"],
    ),
    "device_approved": (
        lambda s: s.send_device_change_reviewed_email("a@example.com", "Asha", "EN001", "APPROVED"),
        "Your new device request was approved", ["EN001"],
    ),
    "device_rejected": (
        lambda s: s.send_device_change_reviewed_email("a@example.com", "Asha", "EN001", "REJECTED"),
        "Your new device request was rejected", ["EN001"],
    ),
}


@pytest.mark.parametrize("name", CASES)
async def test_the_email_renders_and_is_handed_to_the_mail_server(outbox, name):
    send, subject, expected = CASES[name]

    delivered = await send(EmailService())

    assert delivered is True
    (message, options), = outbox
    assert (message["To"], message["Subject"]) == ("a@example.com", subject)
    assert (options["hostname"], options["port"], options["start_tls"]) == ("smtp.test", 587, True)
    html = html_of(message)
    for part in expected:
        assert part in html, f"{part!r} is missing from the {name} e-mail"
    assert text_of(message).strip(), "the plain-text part must not be empty"


async def test_the_logo_travels_inside_the_message(outbox):
    await EmailService().send_invitation_email("a@example.com", "Ravi", "TEACHER", "tok")

    message, _ = outbox[0]
    logo = message.get_payload()[1]
    assert logo["Content-ID"] == "<sahaj-logo>" and logo.get_content_type() == "image/png"
    assert len(logo.get_payload(decode=True)) > 1000


async def test_port_465_uses_a_tls_connection_from_the_start(outbox, monkeypatch):
    monkeypatch.setattr(settings, "SMTP_PORT", 465)

    await EmailService().send_password_reset_email("a@example.com", "Ravi", "tok")

    _, options = outbox[0]
    assert options["use_tls"] is True and options["start_tls"] is False


@pytest.mark.parametrize("missing", ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "EMAILS_FROM_EMAIL"])
async def test_a_missing_mail_setting_means_not_sent_and_nothing_is_attempted(outbox, monkeypatch, missing):
    monkeypatch.setattr(settings, missing, "")
    if missing == "SMTP_USER":
        monkeypatch.setattr(settings, "EMAILS_FROM_EMAIL", "mailer@example.com")
    if missing == "EMAILS_FROM_EMAIL":
        monkeypatch.setattr(settings, "SMTP_USER", "")

    assert await EmailService().send_invitation_email("a@example.com", "Ravi", "TEACHER", "tok") is False
    assert outbox == []


async def test_an_invalid_recipient_is_refused_before_connecting(outbox):
    assert await EmailService().send_invitation_email("not-an-address", "Ravi", "TEACHER", "tok") is False
    assert outbox == []


async def test_a_mail_server_error_is_a_false_not_a_crash(outbox, monkeypatch):
    async def refuse(message, **options):
        raise ConnectionRefusedError("smtp is down")

    monkeypatch.setattr(email_module.aiosmtplib, "send", refuse)

    assert await EmailService().send_invitation_email("a@example.com", "Ravi", "TEACHER", "tok") is False
