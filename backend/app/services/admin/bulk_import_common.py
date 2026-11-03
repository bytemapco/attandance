"""What the student and teacher bulk imports have in common: row results, invitations, licence and lookups."""
import asyncio
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional

from app.db.client import db
from app.services.admin.account_setup import SEAT_ROLES
from app.services.admin.invitations import send_invitation

INVITE_CONCURRENCY = 5


class RowRejected(Exception):
    """A row that cannot be imported, with the reason to show the admin."""


@dataclass(frozen=True)
class Invite:
    row: int
    user_id: str
    email: str
    name: str
    role: str
    identifier_label: str
    identifier: str
    temp_password: Optional[str]


@dataclass
class ImportReport:
    imported: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)
    invites: list[Invite] = field(default_factory=list)

    def reject(self, message: str) -> None:
        self.failed += 1
        self.errors.append(message)


async def deliver_invites(invites: list[Invite]) -> tuple[int, list[str]]:
    """Sends the invitations a few at a time. Returns how many were sent and an error line for each that was not."""
    gate = asyncio.Semaphore(INVITE_CONCURRENCY)

    async def send(invite: Invite) -> bool:
        async with gate:
            return await send_invitation(
                invite.user_id, invite.email, invite.name, invite.role,
                invite.identifier_label, invite.identifier, invite.temp_password,
            )

    results = await asyncio.gather(*(send(invite) for invite in invites))
    failures = [
        f"Row {invite.row}: account created, but invitation email delivery failed. Check SMTP settings."
        for invite, sent in zip(invites, results)
        if not sent
    ]
    return sum(results), failures


async def check_license_capacity(tenant_id: str, additional_count: int) -> None:
    tenant = await db.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        return
    in_use = await db.user.count(where={"tenantId": tenant_id, "role": {"in": SEAT_ROLES}})
    if in_use + additional_count > tenant.licenseCount:
        available = max(0, tenant.licenseCount - in_use)
        raise ValueError(
            f"Bulk import exceeds license capacity. Available seats: {available}, requested: {additional_count}. "
            "Request additional licenses from your super administrator."
        )


async def find_by_reference(delegate: Any, reference: str, tenant_id: str):
    """A department or designation named by its id, code or name (the spreadsheet may use any of them)."""
    return await delegate.find_first(
        where={
            "tenantId": tenant_id,
            "OR": [
                {"id": reference},
                {"code": {"equals": reference, "mode": "insensitive"}},
                {"name": {"equals": reference, "mode": "insensitive"}},
            ],
        }
    )


async def reject_if_taken(email: str, tenant_id: str, profile_delegate: Any, profile_where: dict, taken: str) -> None:
    if await db.user.find_unique(where={"email": email}):
        raise RowRejected(f"Email '{email}' already registered.")
    if await profile_delegate.find_first(where={"tenantId": tenant_id, **profile_where}):
        raise RowRejected(taken)


async def run_import(rows: list, import_row: Callable[[Any, int], Awaitable[Invite]], send_invite: bool) -> dict:
    report = ImportReport()
    for row, item in enumerate(rows, start=1):
        try:
            invite = await import_row(item, row)
        except RowRejected as rejected:
            report.reject(f"Row {row}: {rejected}")
            continue
        except Exception as exc:
            report.reject(f"Row {row} ({item.email}): {exc}")
            continue
        report.imported += 1
        if send_invite:
            report.invites.append(invite)
    invitations_sent, invite_errors = await deliver_invites(report.invites)
    return {
        "imported_count": report.imported,
        "failed_count": report.failed,
        "invitations_sent": invitations_sent,
        "errors": report.errors + invite_errors,
    }
