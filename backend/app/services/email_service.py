from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path
from typing import Any, Dict, Optional

try:
    import aiosmtplib
except ImportError:
    aiosmtplib = None  # type: ignore
from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.url_resolver import resolve_frontend_url
from app.services.email_content import is_valid_email_address, plain_text_from_html, render_email_template

logger = get_logger("app.services.email")
EMAIL_LOGO_PATH = Path(__file__).resolve().parents[1] / "templates" / "email" / "assets" / "sahaj-logo-transparent.png"


class EmailService:
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        frontend_url: Optional[str] = None,
    ) -> bool:
        smtp_host = (settings.SMTP_HOST or "").strip()
        smtp_user = (settings.SMTP_USER or "").strip()
        smtp_password = (settings.SMTP_PASSWORD or "").strip()
        from_email = (settings.EMAILS_FROM_EMAIL or "").strip() or smtp_user

        missing_settings = [
            name
            for name, value in (
                ("SMTP_HOST", smtp_host),
                ("SMTP_USER", smtp_user),
                ("SMTP_PASSWORD", smtp_password),
                ("EMAILS_FROM_EMAIL", from_email),
            )
            if not value
        ]
        if not aiosmtplib or missing_settings or not (1 <= settings.SMTP_PORT <= 65535):
            logger.warning(
                "Email delivery unavailable (missing_settings=%s, smtp_library_available=%s, valid_port=%s)",
                missing_settings,
                bool(aiosmtplib),
                1 <= settings.SMTP_PORT <= 65535,
            )
            return False
        if not is_valid_email_address(to_email) or not is_valid_email_address(from_email):
            logger.error("Email delivery rejected because the sender or recipient address is invalid")
            return False

        try:
            active_frontend_url = frontend_url or resolve_frontend_url()
            merged_context = {
                "system_name": "SAHAJ",
                "frontend_url": active_frontend_url,
                "logo_url": "cid:sahaj-logo",
                "subject": subject,
                **context,
            }
            html_content = render_email_template(template_name, merged_context)

            message = MIMEMultipart("related")
            message["From"] = formataddr(("SAHAJ", from_email))
            message["To"] = to_email
            message["Subject"] = subject

            alternatives = MIMEMultipart("alternative")
            message.attach(alternatives)

            # Plaintext fallback
            plain_fallback = plain_text_from_html(html_content)
            if not plain_fallback:
                plain_fallback = f"{subject}\n\n{active_frontend_url}"
            alternatives.attach(MIMEText(plain_fallback, "plain", "utf-8"))
            alternatives.attach(MIMEText(html_content, "html", "utf-8"))

            with EMAIL_LOGO_PATH.open("rb") as logo_file:
                logo = MIMEImage(logo_file.read(), _subtype="png")
            logo.add_header("Content-ID", "<sahaj-logo>")
            logo.add_header("Content-Disposition", "inline", filename="sahaj-logo.png")
            message.attach(logo)

            is_ssl_port = settings.SMTP_PORT == 465
            use_ssl = is_ssl_port or settings.SMTP_SSL
            start_tls = settings.SMTP_TLS and not use_ssl

            await aiosmtplib.send(
                message,
                hostname=smtp_host,
                port=settings.SMTP_PORT,
                username=smtp_user,
                password=smtp_password,
                start_tls=start_tls,
                use_tls=use_ssl,
                timeout=15.0,
            )
            logger.info("Email sent successfully: recipient=%s subject='%s'", to_email, subject)
            return True
        except Exception:
            logger.exception("Failed to render or send email (recipient=%s, subject=%s)", to_email, subject)
            return False

    async def send_invitation_email(
        self,
        to_email: str,
        recipient_name: str,
        role: str,
        invite_token: str = "",
        identifier_label: Optional[str] = None,
        identifier_value: Optional[str] = None,
        temp_password: Optional[str] = None,
        frontend_url: Optional[str] = None,
    ) -> bool:
        base_url = frontend_url or resolve_frontend_url()
        invite_url = f"{base_url}/onboarding?token={invite_token}" if invite_token else f"{base_url}/login"
        role_display = "Student" if role == "STUDENT" else ("Teacher" if role == "TEACHER" else "Administrator")

        return await self.send_email(
            to_email=to_email,
            subject="Set up your SAHAJ account",
            template_name="user_invite.html",
            frontend_url=base_url,
            context={
                "recipient_name": recipient_name,
                "role_title": role_display,
                "email": to_email,
                "invite_url": invite_url,
                "temp_password": temp_password,
                "expire_hours": settings.INVITATION_TOKEN_EXPIRE_HOURS,
                "identifier_label": identifier_label,
                "identifier_value": identifier_value,
            },
        )

    async def send_password_reset_email(
        self,
        to_email: str,
        recipient_name: str,
        reset_token: str,
        role: Optional[str] = None,
        frontend_url: Optional[str] = None,
    ) -> bool:
        base_url = frontend_url or resolve_frontend_url()
        reset_url = f"{base_url}/reset-password?token={reset_token}"
        app_reset_url = f"smartattendance://reset-password?token={reset_token}"

        return await self.send_email(
            to_email=to_email,
            subject="Choose a new SAHAJ password",
            template_name="password_reset.html",
            frontend_url=base_url,
            context={
                "recipient_name": recipient_name,
                "email": to_email,
                "reset_url": reset_url,
                "app_reset_url": app_reset_url,
                "role": role,
                "is_student": role == "STUDENT",
                "expire_minutes": settings.RESET_TOKEN_EXPIRE_MINUTES,
            },
        )

    async def send_device_change_requested_email(
        self,
        to_email: str,
        recipient_name: str,
        enrollment_number: str,
        new_device_uuid: str,
        reason: Optional[str] = None,
    ) -> bool:
        return await self.send_email(
            to_email=to_email,
            subject="We received your new device request",
            template_name="device_change_requested.html",
            context={
                "recipient_name": recipient_name,
                "enrollment_number": enrollment_number,
                "reason": reason,
            },
        )

    async def send_device_change_reviewed_email(
        self,
        to_email: str,
        recipient_name: str,
        enrollment_number: str,
        status: str,
    ) -> bool:
        subject_status = "Approved" if status == "APPROVED" else "Rejected"
        return await self.send_email(
            to_email=to_email,
            subject=f"Your new device request was {subject_status.lower()}",
            template_name="device_change_reviewed.html",
            context={
                "recipient_name": recipient_name,
                "enrollment_number": enrollment_number,
                "status": status,
            },
        )


email_service = EmailService()
