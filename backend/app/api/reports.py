from datetime import date
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from prisma.models import User

from app.api.dependencies import RoleChecker, get_tenant_context
from app.repositories.teacher_repository import TeacherRepository
from app.schemas.reports import RegisterReport, ReportFilters, ShortageReport, SummaryReport
from app.services.reports import service
from app.services.reports.loader import load_filters
from app.services.reports.render import PDF_TYPE, XLSX_TYPE, to_pdf, to_xlsx
from app.services.reports.service import ReportQuery
from app.services.reports.tables import ExportTable, register_table, shortage_table, summary_table

router = APIRouter(prefix="/reports", tags=["Attendance Reports"])

ReportName = Literal["shortage", "register", "subject-summary"]


async def _teacher_scope(user: User = Depends(RoleChecker(["TEACHER", "ADMIN"]))) -> Optional[str]:
    """A teacher's id limits every report to their own classes; an admin gets None and sees the whole institution."""
    if user.role != "TEACHER":
        return None
    teacher = await TeacherRepository().get_by_user_id(user.id)
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher profile not found")
    return teacher.id


def _query(
    class_id: Optional[str] = Query(None),
    section_id: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
) -> ReportQuery:
    return ReportQuery(class_id, section_id, date_from, date_to)


@router.get("/filters", response_model=ReportFilters)
async def report_filters(tenant_id: str = Depends(get_tenant_context), teacher_id: Optional[str] = Depends(_teacher_scope)):
    return await load_filters(tenant_id, teacher_id)


@router.get("/shortage", response_model=ShortageReport)
async def shortage(
    query: ReportQuery = Depends(_query),
    tenant_id: str = Depends(get_tenant_context),
    teacher_id: Optional[str] = Depends(_teacher_scope),
):
    return await service.shortage_report(tenant_id, teacher_id, query)


@router.get("/register", response_model=RegisterReport)
async def register(
    query: ReportQuery = Depends(_query),
    tenant_id: str = Depends(get_tenant_context),
    teacher_id: Optional[str] = Depends(_teacher_scope),
):
    return await service.register_report(tenant_id, teacher_id, query)


@router.get("/subject-summary", response_model=SummaryReport)
async def subject_summary(
    query: ReportQuery = Depends(_query),
    tenant_id: str = Depends(get_tenant_context),
    teacher_id: Optional[str] = Depends(_teacher_scope),
):
    return await service.summary_report(tenant_id, teacher_id, query)


async def _table(report: ReportName, tenant_id: str, teacher_id: Optional[str], query: ReportQuery) -> ExportTable:
    if report == "shortage":
        return shortage_table(await service.shortage_report(tenant_id, teacher_id, query))
    if report == "register":
        return register_table(await service.register_report(tenant_id, teacher_id, query))
    return summary_table(await service.summary_report(tenant_id, teacher_id, query))


@router.get("/{report}/export")
async def export_report(
    report: ReportName,
    format: Literal["xlsx", "pdf"] = Query("xlsx"),
    query: ReportQuery = Depends(_query),
    tenant_id: str = Depends(get_tenant_context),
    teacher_id: Optional[str] = Depends(_teacher_scope),
) -> Response:
    table = await _table(report, tenant_id, teacher_id, query)
    body, media_type = (to_xlsx(table), XLSX_TYPE) if format == "xlsx" else (to_pdf(table), PDF_TYPE)
    return Response(
        content=body,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{report}-report.{format}"'},
    )
