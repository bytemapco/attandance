from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from prisma.models import Teacher, User

from app.api.dependencies import get_current_teacher, get_current_user, get_tenant_context
from app.core.datetime_utils import get_ist_today
from app.schemas.timetable import AttendanceRegisterBulkUpdate
from app.services.occurrence_register_service import OccurrenceRegisterService

router = APIRouter(prefix="/faculty", tags=["Faculty Daily Schedule & Attendance Register"])


@router.get("/daily-schedule")
async def get_daily_schedule(
    target_date: Optional[date] = Query(None, description="Target date (defaults to today in IST)"),
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
):
    query_date = target_date or get_ist_today()
    resolved_tenant = tenant_id or current_teacher.tenantId
    occurrences = await OccurrenceRegisterService.get_daily_schedule(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
        target_date=query_date,
    )
    return [
        {
            "id": o.id,
            "tenant_id": o.tenantId,
            "course_section_id": o.courseSectionId,
            "date": o.date,
            "time_slot_id": o.timeSlotId,
            "classroom_id": o.classroomId,
            "faculty_id": o.facultyId,
            "substitute_faculty_id": o.substituteFacultyId,
            "status": o.status,
            "is_attendance_locked": o.isAttendanceLocked,
            "course_name": o.courseSection.subject.name if o.courseSection and o.courseSection.subject else "Class",
            "subject_code": o.courseSection.subject.code if o.courseSection and o.courseSection.subject else "",
            "section_name": o.courseSection.name if o.courseSection else "",
            "classroom_name": o.classroom.name if o.classroom else "TBA",
            "faculty_name": (
                f"{getattr(o.faculty, 'firstName', '')} {getattr(o.faculty, 'lastName', '')}".strip()
                if (getattr(o.faculty, "firstName", None) or getattr(o.faculty, "lastName", None))
                else (getattr(getattr(o.faculty, "user", None), "name", "") or "")
            ),
            "start_time": o.timeSlot.startTime if o.timeSlot else "",
            "end_time": o.timeSlot.endTime if o.timeSlot else "",
            "present_count": len([r for r in o.attendanceRecords if r.status == "PRESENT"]),
            "total_enrolled": len(o.courseSection.enrollments) if o.courseSection and o.courseSection.enrollments else 0,
        }
        for o in occurrences
    ]


@router.get("/occurrences/{occurrence_id}/register")
async def get_occurrence_register(
    occurrence_id: str,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    return await OccurrenceRegisterService.get_occurrence_register(tenant_id, occurrence_id)


@router.put("/occurrences/{occurrence_id}/register")
async def update_occurrence_register(
    occurrence_id: str,
    payload: AttendanceRegisterBulkUpdate,
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    return await OccurrenceRegisterService.update_register_bulk(
        tenant_id=tenant_id,
        user_id=current_user.id,
        occurrence_id=occurrence_id,
        updates=payload.updates,
        reason=payload.reason,
    )


@router.get("/weekly-timetable")
async def get_weekly_timetable(
    academic_year_id: Optional[str] = Query(None, description="Optional Academic Year / Semester ID filter"),
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
):
    from app.services.teacher_schedule_service import TeacherScheduleService
    resolved_tenant = tenant_id or current_teacher.tenantId
    return await TeacherScheduleService.get_weekly_timetable(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
        academic_year_id=academic_year_id,
    )


@router.post("/occurrences/{occurrence_id}/start")
async def start_occurrence_attendance(
    occurrence_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    tenant_id: str = Depends(get_tenant_context),
):
    from app.services.teacher_schedule_service import TeacherScheduleService
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
    from app.services.teacher_schedule_service import TeacherScheduleService
    resolved_tenant = tenant_id or current_teacher.tenantId
    return await TeacherScheduleService.stop_occurrence_attendance(
        tenant_id=resolved_tenant,
        faculty_id=current_teacher.id,
        user_id=current_user.id,
        occurrence_id=occurrence_id,
    )
