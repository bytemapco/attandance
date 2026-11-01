import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services import email_service as email_module
from app.services.auth_token_service import AuthTokenService
from app.services.email_service import EmailService


@pytest.fixture
def smtp_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(email_module.settings, "SMTP_HOST", "smtp.test")
    monkeypatch.setattr(email_module.settings, "SMTP_PORT", 587)
    monkeypatch.setattr(email_module.settings, "SMTP_USER", " user@test.dev ")
    monkeypatch.setattr(email_module.settings, "SMTP_PASSWORD", " app pass ")
    monkeypatch.setattr(email_module.settings, "SMTP_TLS", True)
    monkeypatch.setattr(email_module.settings, "SMTP_SSL", False)


def _html_of(send_mock: AsyncMock) -> str:
    message = send_mock.call_args.args[0]
    return message.get_payload()[1].get_payload(decode=True).decode()


@pytest.mark.anyio
async def test_send_skipped_when_smtp_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(email_module.settings, "SMTP_USER", "")
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as send:
        sent = await EmailService().send_device_change_reviewed_email("a@b.co", "A", "EN1", "APPROVED")
    assert sent is False
    send.assert_not_called()


@pytest.mark.anyio
async def test_send_uses_stripped_credentials_and_starttls(smtp_settings: None) -> None:
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as send:
        sent = await EmailService().send_device_change_reviewed_email("a@b.co", "A", "EN1", "APPROVED")
    assert sent is True
    kwargs = send.call_args.kwargs
    assert kwargs["username"] == "user@test.dev"
    assert kwargs["password"] == "app pass"
    assert kwargs["start_tls"] is True and kwargs["use_tls"] is False


@pytest.mark.anyio
async def test_port_465_uses_implicit_ssl(smtp_settings: None, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(email_module.settings, "SMTP_PORT", 465)
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as send:
        await EmailService().send_device_change_reviewed_email("a@b.co", "A", "EN1", "REJECTED")
    assert send.call_args.kwargs["use_tls"] is True
    assert send.call_args.kwargs["start_tls"] is False


@pytest.mark.anyio
async def test_smtp_error_returns_false(smtp_settings: None) -> None:
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock(side_effect=OSError("refused"))):
        sent = await EmailService().send_password_reset_email("a@b.co", "A", "tok")
    assert sent is False


@pytest.mark.anyio
async def test_invitation_email_renders_links_and_credentials(smtp_settings: None) -> None:
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as send:
        sent = await EmailService().send_invitation_email(
            "s@b.co", "Sam", "STUDENT", "tok123", "Enrollment Number", "EN42", "Temp#Pass1",
            frontend_url="http://app.test",
        )
    html = _html_of(send)
    assert sent is True
    assert "http://app.test/login" in html
    assert "EN42" in html and "Temp#Pass1" in html


@pytest.mark.anyio
async def test_password_reset_email_renders_reset_link(smtp_settings: None) -> None:
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as send:
        sent = await EmailService().send_password_reset_email(
            "s@b.co", "Sam", "rst999", "STUDENT", frontend_url="http://app.test"
        )
    assert sent is True
    assert "http://app.test/reset-password?token=rst999" in _html_of(send)


@pytest.mark.anyio
async def test_device_change_emails_render(smtp_settings: None) -> None:
    with patch.object(email_module.aiosmtplib, "send", new=AsyncMock()) as send:
        requested = await EmailService().send_device_change_requested_email("s@b.co", "Sam", "EN1", "dev-uuid-7", "lost phone")
        assert "dev-uuid-7" in _html_of(send)
        reviewed = await EmailService().send_device_change_reviewed_email("s@b.co", "Sam", "EN1", "APPROVED")
        assert "EN1" in _html_of(send)
    assert requested is True and reviewed is True


def _onboarding_service(is_active: bool) -> tuple[AuthTokenService, MagicMock]:
    user_repo = MagicMock()
    user_repo.get_by_id = AsyncMock(return_value=SimpleNamespace(id="u1", isActive=is_active))
    redis = MagicMock()
    redis.get = AsyncMock(return_value=json.dumps({"user_id": "u1", "email": "s@b.co", "role": "STUDENT", "name": "S"}))
    redis.delete = AsyncMock()
    return AuthTokenService(user_repo, MagicMock()), redis


@pytest.mark.anyio
async def test_onboarding_completes_for_newly_created_active_user() -> None:
    service, redis = _onboarding_service(is_active=True)
    with patch("app.services.auth_token_service.safe_redis", return_value=redis), patch(
        "app.services.auth_token_service.db"
    ) as db:
        db.user.update = AsyncMock()
        assert await service.complete_onboarding("tok", "NewPassw0rd!") is True
    redis.delete.assert_awaited_once_with("invite:tok")
    assert db.user.update.call_args.kwargs["data"]["mustChangePassword"] is False


@pytest.mark.anyio
async def test_onboarding_rejects_disabled_account() -> None:
    service, redis = _onboarding_service(is_active=False)
    with patch("app.services.auth_token_service.safe_redis", return_value=redis), patch(
        "app.services.auth_token_service.db"
    ) as db:
        db.user.update = AsyncMock()
        with pytest.raises(HTTPException) as exc:
            await service.complete_onboarding("tok", "NewPassw0rd!")
    assert exc.value.status_code == 403
    db.user.update.assert_not_called()


def _reset_service(user: SimpleNamespace | None) -> tuple[AuthTokenService, MagicMock]:
    user_repo = MagicMock()
    user_repo.get_by_email = AsyncMock(return_value=user)
    redis = MagicMock()
    redis.setex = AsyncMock()
    redis.delete = AsyncMock()
    return AuthTokenService(user_repo, MagicMock()), redis


@pytest.mark.anyio
async def test_reset_unknown_email_is_404() -> None:
    service, redis = _reset_service(None)
    with patch("app.services.auth_token_service.safe_redis", return_value=redis):
        with pytest.raises(HTTPException) as exc:
            await service.request_password_reset("nobody@x.co")
    assert exc.value.status_code == 404


@pytest.mark.anyio
async def test_reset_email_failure_is_502_and_token_removed() -> None:
    user = SimpleNamespace(id="u1", email="a@x.co", role="ADMIN", isActive=True)
    service, redis = _reset_service(user)
    with patch("app.services.auth_token_service.safe_redis", return_value=redis), patch(
        "app.services.auth_token_service.email_service.send_password_reset_email", new=AsyncMock(return_value=False)
    ):
        with pytest.raises(HTTPException) as exc:
            await service.request_password_reset("a@x.co")
    assert exc.value.status_code == 502
    redis.delete.assert_awaited_once()


@pytest.mark.anyio
async def test_reset_success_returns_true() -> None:
    user = SimpleNamespace(id="u1", email="a@x.co", role="ADMIN", isActive=True)
    service, redis = _reset_service(user)
    with patch("app.services.auth_token_service.safe_redis", return_value=redis), patch(
        "app.services.auth_token_service.email_service.send_password_reset_email", new=AsyncMock(return_value=True)
    ):
        assert await service.request_password_reset("a@x.co") is True
