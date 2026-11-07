"""Small helpers the tools share."""
from datetime import date, timedelta
from typing import Any, Optional

from app.core.datetime_utils import get_ist_today
from app.services.agent.types import ADMIN, TEACHER, Principal
from app.services.reports.service import ReportQuery

BOTH = frozenset({ADMIN, TEACHER})
ADMIN_ONLY = frozenset({ADMIN})
TEACHER_ONLY = frozenset({TEACHER})
MODEL_ROWS = 40  # a tool shows the person every row but gives the model only this many


def table(title: str, columns: list[str], rows: list[list[Any]], download: Optional[str] = None) -> dict[str, Any]:
    block: dict[str, Any] = {"kind": "table", "title": title, "columns": columns, "rows": rows}
    if download:
        block["download"] = download
    return block


def link(label: str, path: str) -> dict[str, Any]:
    return {"kind": "link", "label": label, "path": path}


def capped(rows: list[Any]) -> dict[str, Any]:
    """The model gets a bounded slice and is told when there is more."""
    return {"rows": rows[:MODEL_ROWS], "total": len(rows), "truncated": len(rows) > MODEL_ROWS}


def full_name(person: Any) -> str:
    """A student or teacher's name; a student may have none on file, so fall back to the roll number."""
    name = f"{person.firstName or ''} {person.lastName or ''}".strip()
    return name or getattr(person, "enrollmentNumber", "")


def teacher_id_of(principal: Principal) -> Optional[str]:
    """A teacher's reports are limited to their own classes; an admin's are not."""
    return principal.teacher.id if principal.teacher else None


def report_query(
    class_id: Optional[str], section_id: Optional[str], date_from: Optional[date], date_to: Optional[date]
) -> ReportQuery:
    return ReportQuery(class_id, section_id, date_from, date_to)


def recent_window(days: int, back: int = 0) -> tuple[date, date]:
    """The `days` days ending `back` days ago (today when back is 0)."""
    end = get_ist_today() - timedelta(days=back)
    return end - timedelta(days=days - 1), end


def pct(attended: int, held: int) -> Optional[float]:
    return round(100 * attended / held, 1) if held else None
