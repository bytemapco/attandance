from fastapi import APIRouter, Depends, HTTPException, status
from prisma.models import Teacher

from app.api.dependencies import get_current_teacher, get_tenant_context
from app.db.client import db
from app.schemas.teacher.class_session import ClassSessionStartResponse, OccurrenceQrResponse, TeacherClassResponse
from app.schemas.teacher.overview import ClassAnalyticsResponse, FlaggedRecordResponse, HistoryItemResponse
from app.services import occurrence_qr_service, teacher_class_session_service, teacher_overview_service

router = APIRouter(prefix="/faculty", tags=["Faculty Classes & Attendance Sessions"])


@router.get("/classes", response_model=list[TeacherClassResponse])
async def list_my_classes(
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
) -> list[TeacherClassResponse]:
    rows = await teacher_class_session_service.list_my_classes(tenant_id or current_teacher.tenantId, current_teacher)
    return [TeacherClassResponse(**row) for row in rows]


@router.post("/classes/{section_id}/start", response_model=ClassSessionStartResponse)
async def start_class_session(
    section_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
) -> ClassSessionStartResponse:
    started = await teacher_class_session_service.start_class_session(
        tenant_id or current_teacher.tenantId, current_teacher, section_id
    )
    return ClassSessionStartResponse(**started)


@router.get("/occurrences/{occurrence_id}/qr", response_model=OccurrenceQrResponse)
async def get_occurrence_qr(
    occurrence_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
) -> OccurrenceQrResponse:
    occurrence = await db.classoccurrence.find_first(
        where={"id": occurrence_id, "tenantId": tenant_id or current_teacher.tenantId}
    )
    if not occurrence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found.")
    if current_teacher.id not in (occurrence.facultyId, occurrence.substituteFacultyId):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this class.")
    return OccurrenceQrResponse(**occurrence_qr_service.issue_qr(occurrence))


@router.get("/history", response_model=list[HistoryItemResponse])
async def list_session_history(
    section_id: str | None = None,
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
) -> list[HistoryItemResponse]:
    rows = await teacher_overview_service.list_history(tenant_id or current_teacher.tenantId, current_teacher, section_id)
    return [HistoryItemResponse(**row) for row in rows]


@router.get("/flagged", response_model=list[FlaggedRecordResponse])
async def list_flagged_records(
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
) -> list[FlaggedRecordResponse]:
    rows = await teacher_overview_service.list_flagged(tenant_id or current_teacher.tenantId, current_teacher)
    return [FlaggedRecordResponse(**row) for row in rows]


@router.get("/analytics", response_model=list[ClassAnalyticsResponse])
async def class_analytics(
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
) -> list[ClassAnalyticsResponse]:
    rows = await teacher_overview_service.class_analytics(tenant_id or current_teacher.tenantId, current_teacher)
    return [ClassAnalyticsResponse(**row) for row in rows]
