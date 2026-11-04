"""The three attendance reports for a teacher (their own classes) or an admin (any class in the institution)."""
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.datetime_utils import get_ist_today
from app.schemas.reports import RegisterReport, ReportMeta, ShortageReport, SummaryReport
from app.services.reports import builders
from app.services.reports.loader import load_sections
from app.services.reports.types import SectionData
from app.services.system_config_service import SystemConfigService

REGISTER_DEFAULT_DAYS = 30


@dataclass(frozen=True)
class ReportQuery:
    group_id: Optional[str] = None
    section_id: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _scope_label(sections: list[SectionData], query: ReportQuery) -> str:
    if query.section_id:
        return f"{sections[0].class_code} · {sections[0].subject_name}"
    return ", ".join(dict.fromkeys(section.class_code for section in sections))


async def _prepare(
    tenant_id: str, teacher_id: Optional[str], query: ReportQuery, default_days: Optional[int] = None
) -> tuple[list[SectionData], ReportMeta]:
    date_to = query.date_to or get_ist_today()
    date_from = query.date_from or (date_to - timedelta(days=default_days - 1) if default_days else None)
    if date_from and date_from > date_to:
        raise _bad_request("The start date must be on or before the end date.")
    if teacher_id is None and not (query.group_id or query.section_id):
        raise _bad_request("Choose a class first.")
    sections = await load_sections(tenant_id, teacher_id, query.group_id, query.section_id, date_from, date_to)
    if not sections:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching class found.")
    config = await SystemConfigService().get_config(tenant_id=tenant_id)
    meta = ReportMeta(
        scope=_scope_label(sections, query), threshold=config.minAttendancePct,
        date_from=date_from, date_to=date_to, generated_at=datetime.now(timezone.utc),
    )
    return sections, meta


async def shortage_report(tenant_id: str, teacher_id: Optional[str], query: ReportQuery) -> ShortageReport:
    sections, meta = await _prepare(tenant_id, teacher_id, query)
    return builders.build_shortage(sections, meta)


async def register_report(tenant_id: str, teacher_id: Optional[str], query: ReportQuery) -> RegisterReport:
    if not query.section_id:
        raise _bad_request("Choose a subject to see its register.")
    sections, meta = await _prepare(tenant_id, teacher_id, query, REGISTER_DEFAULT_DAYS)
    return builders.build_register(sections[0], meta)


async def summary_report(tenant_id: str, teacher_id: Optional[str], query: ReportQuery) -> SummaryReport:
    if not query.group_id:
        raise _bad_request("Choose a class to see its subject summary.")
    sections, meta = await _prepare(tenant_id, teacher_id, query)
    return builders.build_summary(sections, meta)
