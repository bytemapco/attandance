"""What every bulk import has in common: checking each row, reporting the rows refused, invitations and lookups."""
import asyncio
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional

from pydantic import ValidationError

from app.core.logging_config import get_logger
from app.db.client import db
from app.schemas.admin.bulk import BulkItem, RowFailure
from app.services.admin.account_setup import SEAT_ROLES
from app.services.invitations import send_invitation

logger = get_logger("app.services.admin.bulk_import")

INVITE_CONCURRENCY = 5
FIELD_LABELS = {"department_id": "department", "designation_id": "designation"}


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
    failures: list[RowFailure] = field(default_factory=list)
    invites: list[Invite] = field(default_factory=list)

    def reject(self, row: int, message: str) -> None:
        self.failures.append(RowFailure(row=row, message=message))

    def response(self, invitations_sent: int, invite_errors: list[str]) -> dict:
        return {
            "imported_count": self.imported,
            "failed_count": len(self.failures),
            "invitations_sent": invitations_sent,
            "errors": [f"Row {failure.row}: {failure.message}" for failure in self.failures] + invite_errors,
            "failures": [failure.model_dump() for failure in self.failures],
        }


ImportRow = Callable[[Any, int], Awaitable[Optional[Invite]]]


def describe_problem(problem: dict) -> str:
    name = ".".join(str(part) for part in problem["loc"])
    label = FIELD_LABELS.get(name, name.replace("_", " ")) or "row"
    return f"{label} is required" if problem["type"] == "missing" else f"{label}: {problem['msg']}"


def check_row(model: type[BulkItem], raw: Any) -> Any:
    """The row as `model`, or RowRejected naming every field that is wrong."""
    try:
        return model.model_validate(raw)
    except ValidationError as invalid:
        raise RowRejected("; ".join(describe_problem(problem) for problem in invalid.errors())) from None


def _label(item: Any) -> str:
    return getattr(item, "email", None) or getattr(item, "name", None) or "row"


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


async def require_reference(delegate: Any, reference: str, tenant_id: str, label: str):
    record = await find_by_reference(delegate, reference, tenant_id)
    if not record:
        raise RowRejected(f"{label} '{reference}' not found.")
    return record


async def reject_if_taken(email: str, tenant_id: str, profile_delegate: Any, profile_where: dict, taken: str) -> None:
    if await db.user.find_unique(where={"email": email}):
        raise RowRejected(f"Email '{email}' already registered.")
    if await profile_delegate.find_first(where={"tenantId": tenant_id, **profile_where}):
        raise RowRejected(taken)


async def _import_one(model: type[BulkItem], import_row: ImportRow, raw: Any, row: int) -> Optional[Invite]:
    """Imports one row. A service's ValueError is a rule the row broke, so it is a refusal, like RowRejected."""
    item = check_row(model, raw)
    try:
        return await import_row(item, row)
    except (RowRejected, ValueError):
        raise
    except Exception as unexpected:
        logger.error("Bulk import row %s failed: %s", row, unexpected, exc_info=True)
        raise RowRejected(f"{_label(item)}: {unexpected}") from unexpected


async def run_import(rows: list, model: type[BulkItem], import_row: ImportRow, send_invite: bool = False) -> dict:
    """Checks and imports each row on its own. A refused row is reported and the others are still imported."""
    report = ImportReport()
    for row, raw in enumerate(rows, start=1):
        try:
            invite = await _import_one(model, import_row, raw, row)
        except (RowRejected, ValueError) as refused:
            report.reject(row, str(refused))
            continue
        report.imported += 1
        if send_invite and invite:
            report.invites.append(invite)
    invitations_sent, invite_errors = await deliver_invites(report.invites)
    return report.response(invitations_sent, invite_errors)
