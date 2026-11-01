from fastapi import APIRouter, Depends, HTTPException, Response, status
from prisma.models import User

from app.api.dependencies import get_current_user, get_tenant_context
from app.core.rate_limit import rate_limiter
from app.repositories.attendance_repository import AttendanceRepository
from app.schemas.admin import AbsenteeAnomalyItem, AdminStatsResponse, AuditLogResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.system_config import SystemConfigResponse, SystemConfigUpdate
from app.services.absentee_scanner import run_absentee_scan
from app.services.admin_service import AdminService
from app.services.system_config_service import SystemConfigService

router = APIRouter()


@router.get(
    "/audit",
    response_model=PaginatedResponse[AuditLogResponse],
    dependencies=[Depends(rate_limiter(requests_limit=120, window_seconds=60))],
)
async def get_audit_logs(
    page: int = 1,
    page_size: int = 20,
    sort_by: str | None = None,
    sort_order: str = "desc",
    q: str | None = None,
    severity: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_audit_logs(
        page=page,
        page_size=min(page_size, 100),
        sort_by=sort_by,
        sort_order=sort_order,
        q=q,
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        tenant_id=tenant_id,
    )


@router.get("/audit/export", dependencies=[Depends(rate_limiter(requests_limit=10, window_seconds=60))])
async def export_audit_logs(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    csv_data = await admin_service.export_audit_logs_csv(tenant_id=tenant_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=system-audit-logs.csv"},
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    tenant_id: str = Depends(get_tenant_context),
    admin_service: AdminService = Depends(),
):
    return await admin_service.get_stats(tenant_id=tenant_id)


@router.post("/scan-absentees", response_model=list[AbsenteeAnomalyItem], status_code=status.HTTP_200_OK)
async def scan_absentee_anomalies(
    contamination: float = 0.10,
    tenant_id: str = Depends(get_tenant_context),
    attendance_repo: AttendanceRepository = Depends(),
) -> list[AbsenteeAnomalyItem]:
    records = await attendance_repo.get_all_absences(tenant_id=tenant_id)
    if not records or len(records) < 5:
        return []

    student_map = {}
    for r in records:
        student = getattr(r, "student", None)
        if student:
            first_name = getattr(student, "firstName", "") or ""
            last_name = getattr(student, "lastName", "") or ""
            full_name = f"{first_name} {last_name}".strip() or "Unknown Student"
            student_map[getattr(r, "studentId", "")] = {
                "student_name": full_name,
                "enrollment_number": getattr(student, "enrollmentNumber", "N/A"),
            }

    rows = []
    for r in records:
        session = getattr(r, "session", None)
        created_at = getattr(r, "createdAt", None)
        if session and getattr(session, "sessionDate", None):
            day_str = session.sessionDate.strftime("%A")
        elif created_at:
            day_str = created_at.strftime("%A")
        else:
            day_str = "Monday"
        rows.append(
            {
                "student_id": getattr(r, "studentId", ""),
                "status": getattr(r, "status", "Absent"),
                "day_of_week": day_str,
            }
        )

    try:
        flagged = await run_absentee_scan(attendance_records=rows, contamination=contamination)
        for item in flagged:
            s_id = item.get("student_id")
            s_info = student_map.get(s_id, {})
            item["student_name"] = s_info.get("student_name", "Unknown Student")
            item["enrollment_number"] = s_info.get("enrollment_number", "N/A")
        return [AbsenteeAnomalyItem.model_validate(item) for item in flagged]
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Outlier pattern extraction failed: {str(err)}"
        )


@router.get("/config", response_model=SystemConfigResponse, response_model_by_alias=True)
async def get_system_config(
    tenant_id: str = Depends(get_tenant_context),
    config_service: SystemConfigService = Depends(),
):
    return await config_service.get_config(tenant_id=tenant_id)


@router.patch("/config", response_model=SystemConfigResponse, response_model_by_alias=True)
async def update_system_config(
    data: SystemConfigUpdate,
    tenant_id: str = Depends(get_tenant_context),
    config_service: SystemConfigService = Depends(),
):
    return await config_service.update_config(
        tenant_id=tenant_id,
        is_face_recognition_enabled=data.is_face_recognition_enabled,
        is_gps_verification_enabled=data.is_gps_verification_enabled,
        is_ai_background_validation_enabled=data.is_ai_background_validation_enabled,
        campus_latitude=data.campus_latitude,
        campus_longitude=data.campus_longitude,
        geofence_radius_meters=data.geofence_radius_meters,
        min_attendance_pct=data.min_attendance_pct,
        verification_window_min=data.verification_window_min,
        saturday_enabled=data.saturday_enabled,
    )




@router.post("/biometrics/purge-photos")
async def purge_biometric_photos(
    retention_days: int = 30,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
    admin_service: AdminService = Depends(),
):
    from app.services.biometric_consent_service import BiometricConsentService

    service = BiometricConsentService()
    result = await service.purge_attendance_photos(retention_days=retention_days, tenant_id=tenant_id)
    await admin_service._log_action(
        "PURGE_BIOMETRICS",
        "WARN",
        actor=current_user.email,
        target="attendance_photos",
        description=f"Purged raw photos for records older than {retention_days} days (Count: {result['purged_count']})",
        tenant_id=tenant_id,
    )
    return result
