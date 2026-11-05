from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from prisma.models import Teacher, User

from app.api.dependencies import RoleChecker, get_current_teacher, get_current_user, get_tenant_context
from app.core.datetime_utils import get_ist_today
from app.schemas.timetable import AttendanceRegisterBulkUpdate, FlaggedDecisionRequest, FlaggedDecisionResponse
from app.services import flagged_review_service
from app.services.occurrence_register_service import OccurrenceRegisterService
from app.services.teacher_schedule_service import TeacherScheduleService

router = APIRouter(prefix="/faculty", tags=["Faculty Daily Schedule & Attendance Register"])


@router.get("/daily-schedule")
async def get_daily_schedule(
    target_date: Optional[date] = Query(None, description="First date (defaults to today in IST)"),
    end_date: Optional[date] = Query(None, description="Last date, inclusive (defaults to target_date)"),
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
):
    query_date = target_date or get_ist_today()
    resolved_tenant = tenant_id or current_teacher.tenantId
    occurrences = await OccurrenceRegisterService.get_daily_schedule(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
        target_date=query_date,
        end_date=end_date,
    )
    return [
        {
            "id": o.id,
            "tenant_id": o.tenantId,
            "course_section_id": o.courseSectionId,
            "date": o.date,
            "classroom_id": o.classroomId,
            "faculty_id": o.facultyId,
            "substitute_faculty_id": o.substituteFacultyId,
            "status": o.status,
            "is_attendance_locked": o.isAttendanceLocked,
            "verification_active": o.verificationActive,
            "verification_expires": o.verificationExpires,
            "class_code": o.courseSection.name if o.courseSection else "",
            "course_name": o.courseSection.subject.name if o.courseSection and o.courseSection.subject else "Class",
            "subject_code": o.courseSection.subject.code if o.courseSection and o.courseSection.subject else "",
            "section_name": o.courseSection.name if o.courseSection else "",
            "classroom_name": o.classroom.name if o.classroom else "TBA",
            "faculty_name": (
                f"{getattr(o.faculty, 'firstName', '')} {getattr(o.faculty, 'lastName', '')}".strip()
                if (getattr(o.faculty, "firstName", None) or getattr(o.faculty, "lastName", None))
                else (getattr(getattr(o.faculty, "user", None), "name", "") or "")
            ),
            "start_time": o.startTime,
            "end_time": o.endTime,
            "present_count": len([r for r in o.attendanceRecords if r.status == "PRESENT"]),
            "total_enrolled": len(o.courseSection.enrollments) if o.courseSection and o.courseSection.enrollments else 0,
        }
        for o in occurrences
    ]


@router.get("/occurrences/{occurrence_id}/register")
async def get_occurrence_register(
    occurrence_id: str,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(RoleChecker(["TEACHER", "ADMIN"])),
):
    return await OccurrenceRegisterService.get_occurrence_register(tenant_id, occurrence_id, current_user)


@router.put("/occurrences/{occurrence_id}/register")
async def update_occurrence_register(
    occurrence_id: str,
    payload: AttendanceRegisterBulkUpdate,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(RoleChecker(["TEACHER", "ADMIN"])),
):
    return await OccurrenceRegisterService.update_register_bulk(
        tenant_id=tenant_id,
        user=current_user,
        occurrence_id=occurrence_id,
        updates=payload.updates,
        reason=payload.reason,
    )


@router.post("/occurrences/{occurrence_id}/flagged/{record_id}/resolve", response_model=FlaggedDecisionResponse)
async def resolve_flagged_mark(
    occurrence_id: str,
    record_id: str,
    payload: FlaggedDecisionRequest,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(RoleChecker(["TEACHER", "ADMIN"])),
) -> FlaggedDecisionResponse:
    result = await flagged_review_service.resolve_flagged(
        tenant_id, current_user, occurrence_id, record_id, payload.decision, payload.note
    )
    return FlaggedDecisionResponse(**result)


@router.get("/weekly-timetable")
async def get_weekly_timetable(
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
):
    resolved_tenant = tenant_id or current_teacher.tenantId
    return await TeacherScheduleService.get_weekly_timetable(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
    )


@router.post("/occurrences/{occurrence_id}/start")
async def start_occurrence_attendance(
    occurrence_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
):
    resolved_tenant = tenant_id or current_teacher.tenantId
    return await TeacherScheduleService.start_occurrence_attendance(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
        occurrence_id=occurrence_id,
    )


@router.post("/occurrences/{occurrence_id}/stop")
async def stop_occurrence_attendance(
    occurrence_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_context),
):
    resolved_tenant = tenant_id or current_teacher.tenantId
    return await TeacherScheduleService.stop_occurrence_attendance(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
        user_id=current_user.id,
        occurrence_id=occurrence_id,
    )
