from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_tenant_context
from app.schemas.academic_year import (
    AcademicYearCreate,
    AcademicYearResponse,
    AcademicYearUpdate,
    CalendarEventCreate,
    CalendarEventResponse,
    TimeSlotCreate,
    TimeSlotResponse,
    TimeSlotUpdate,
)
from app.services.academic_year_service import AcademicYearService
from app.services.timeslot_service import TimeSlotService

router = APIRouter()


# Academic Years / Semesters
@router.get("/academic-years", response_model=List[AcademicYearResponse])
async def list_academic_years(tenant_id: str = Depends(get_tenant_context)):
    items = await AcademicYearService.list_academic_years(tenant_id)
    return [
        AcademicYearResponse(
            id=y.id,
            tenant_id=y.tenantId,
            name=y.name,
            start_date=y.startDate.date() if hasattr(y.startDate, "date") else y.startDate,
            end_date=y.endDate.date() if hasattr(y.endDate, "date") else y.endDate,
            attendance_start_date=y.attendanceStartDate.date() if y.attendanceStartDate and hasattr(y.attendanceStartDate, "date") else y.attendanceStartDate,
            attendance_end_date=y.attendanceEndDate.date() if y.attendanceEndDate and hasattr(y.attendanceEndDate, "date") else y.attendanceEndDate,
            min_attendance_pct=y.minAttendancePct,
            saturday_enabled=y.saturdayEnabled,
            verification_window_min=y.verificationWindowMin,
            status=y.status,
            created_at=y.createdAt,
            updated_at=y.updatedAt,
            sections_count=len(y.courseSections) if hasattr(y, "courseSections") and y.courseSections else 0,
        )
        for y in items
    ]


@router.post("/academic-years", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_year(data: AcademicYearCreate, tenant_id: str = Depends(get_tenant_context)):
    y = await AcademicYearService.create_academic_year(tenant_id, data)
    return AcademicYearResponse(
        id=y.id,
        tenant_id=y.tenantId,
        name=y.name,
        start_date=y.startDate.date() if hasattr(y.startDate, "date") else y.startDate,
        end_date=y.endDate.date() if hasattr(y.endDate, "date") else y.endDate,
        attendance_start_date=y.attendanceStartDate.date() if y.attendanceStartDate and hasattr(y.attendanceStartDate, "date") else y.attendanceStartDate,
        attendance_end_date=y.attendanceEndDate.date() if y.attendanceEndDate and hasattr(y.attendanceEndDate, "date") else y.attendanceEndDate,
        min_attendance_pct=y.minAttendancePct,
        saturday_enabled=y.saturdayEnabled,
        verification_window_min=y.verificationWindowMin,
        status=y.status,
        created_at=y.createdAt,
        updated_at=y.updatedAt,
    )


@router.get("/academic-years/{id}", response_model=AcademicYearResponse)
async def get_academic_year(id: str, tenant_id: str = Depends(get_tenant_context)):
    y = await AcademicYearService.get_academic_year(tenant_id, id)
    return AcademicYearResponse(
        id=y.id,
        tenant_id=y.tenantId,
        name=y.name,
        start_date=y.startDate.date() if hasattr(y.startDate, "date") else y.startDate,
        end_date=y.endDate.date() if hasattr(y.endDate, "date") else y.endDate,
        attendance_start_date=y.attendanceStartDate.date() if y.attendanceStartDate and hasattr(y.attendanceStartDate, "date") else y.attendanceStartDate,
        attendance_end_date=y.attendanceEndDate.date() if y.attendanceEndDate and hasattr(y.attendanceEndDate, "date") else y.attendanceEndDate,
        min_attendance_pct=y.minAttendancePct,
        saturday_enabled=y.saturdayEnabled,
        verification_window_min=y.verificationWindowMin,
        status=y.status,
        created_at=y.createdAt,
        updated_at=y.updatedAt,
        sections_count=len(y.courseSections) if hasattr(y, "courseSections") and y.courseSections else 0,
    )


@router.put("/academic-years/{id}", response_model=AcademicYearResponse)
async def update_academic_year(id: str, data: AcademicYearUpdate, tenant_id: str = Depends(get_tenant_context)):
    y = await AcademicYearService.update_academic_year(tenant_id, id, data)
    return AcademicYearResponse(
        id=y.id,
        tenant_id=y.tenantId,
        name=y.name,
        start_date=y.startDate.date() if hasattr(y.startDate, "date") else y.startDate,
        end_date=y.endDate.date() if hasattr(y.endDate, "date") else y.endDate,
        attendance_start_date=y.attendanceStartDate.date() if y.attendanceStartDate and hasattr(y.attendanceStartDate, "date") else y.attendanceStartDate,
        attendance_end_date=y.attendanceEndDate.date() if y.attendanceEndDate and hasattr(y.attendanceEndDate, "date") else y.attendanceEndDate,
        min_attendance_pct=y.minAttendancePct,
        saturday_enabled=y.saturdayEnabled,
        verification_window_min=y.verificationWindowMin,
        status=y.status,
        created_at=y.createdAt,
        updated_at=y.updatedAt,
    )


@router.post("/academic-years/{id}/activate", response_model=AcademicYearResponse)
async def activate_academic_year(id: str, tenant_id: str = Depends(get_tenant_context)):
    y = await AcademicYearService.activate_academic_year(tenant_id, id)
    return AcademicYearResponse(
        id=y.id,
        tenant_id=y.tenantId,
        name=y.name,
        start_date=y.startDate.date() if hasattr(y.startDate, "date") else y.startDate,
        end_date=y.endDate.date() if hasattr(y.endDate, "date") else y.endDate,
        attendance_start_date=y.attendanceStartDate.date() if y.attendanceStartDate and hasattr(y.attendanceStartDate, "date") else y.attendanceStartDate,
        attendance_end_date=y.attendanceEndDate.date() if y.attendanceEndDate and hasattr(y.attendanceEndDate, "date") else y.attendanceEndDate,
        min_attendance_pct=y.minAttendancePct,
        saturday_enabled=y.saturdayEnabled,
        verification_window_min=y.verificationWindowMin,
        status=y.status,
        created_at=y.createdAt,
        updated_at=y.updatedAt,
    )


@router.delete("/academic-years/{id}")
async def delete_academic_year(id: str, tenant_id: str = Depends(get_tenant_context)):
    return await AcademicYearService.delete_academic_year(tenant_id, id)


# Time Slots
@router.get("/timeslots", response_model=List[TimeSlotResponse])
async def list_timeslots(tenant_id: str = Depends(get_tenant_context)):
    slots = await TimeSlotService.list_time_slots(tenant_id)
    return [
        TimeSlotResponse(
            id=s.id,
            tenant_id=s.tenantId,
            slot_number=s.slotNumber,
            name=s.name,
            start_time=s.startTime,
            end_time=s.endTime,
            is_break=s.isBreak,
            is_lab_block=s.isLabBlock,
        )
        for s in slots
    ]


@router.post("/timeslots", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_timeslot(data: TimeSlotCreate, tenant_id: str = Depends(get_tenant_context)):
    s = await TimeSlotService.create_time_slot(tenant_id, data)
    return TimeSlotResponse(
        id=s.id,
        tenant_id=s.tenantId,
        slot_number=s.slotNumber,
        name=s.name,
        start_time=s.startTime,
        end_time=s.endTime,
        is_break=s.isBreak,
        is_lab_block=s.isLabBlock,
    )


@router.put("/timeslots/{id}", response_model=TimeSlotResponse)
async def update_timeslot(id: str, data: TimeSlotUpdate, tenant_id: str = Depends(get_tenant_context)):
    s = await TimeSlotService.update_time_slot(tenant_id, id, data)
    return TimeSlotResponse(
        id=s.id,
        tenant_id=s.tenantId,
        slot_number=s.slotNumber,
        name=s.name,
        start_time=s.startTime,
        end_time=s.endTime,
        is_break=s.isBreak,
        is_lab_block=s.isLabBlock,
    )


@router.delete("/timeslots/{id}")
async def delete_timeslot(id: str, tenant_id: str = Depends(get_tenant_context)):
    return await TimeSlotService.delete_time_slot(tenant_id, id)


@router.post("/timeslots/seed-standard", response_model=List[TimeSlotResponse])
async def seed_standard_timeslots(tenant_id: str = Depends(get_tenant_context)):
    slots = await TimeSlotService.seed_standard_indian_schedule(tenant_id)
    return [
        TimeSlotResponse(
            id=s.id,
            tenant_id=s.tenantId,
            slot_number=s.slotNumber,
            name=s.name,
            start_time=s.startTime,
            end_time=s.endTime,
            is_break=s.isBreak,
            is_lab_block=s.isLabBlock,
        )
        for s in slots
    ]


# Calendar Events
@router.get("/calendar-events", response_model=List[CalendarEventResponse])
async def list_calendar_events(year_id: Optional[str] = Query(None), tenant_id: str = Depends(get_tenant_context)):
    evts = await AcademicYearService.list_calendar_events(tenant_id, year_id=year_id)
    return [
        CalendarEventResponse(
            id=e.id,
            tenant_id=e.tenantId,
            academic_year_id=e.academicYearId,
            title=e.title,
            date=e.date.date() if hasattr(e.date, "date") else e.date,
            event_type=e.eventType,
            affects_all_courses=e.affectsAllCourses,
            substitute_day_of_week=e.substituteDayOfWeek,
            description=e.description,
            created_at=e.createdAt,
        )
        for e in evts
    ]


@router.post("/calendar-events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(data: CalendarEventCreate, tenant_id: str = Depends(get_tenant_context)):
    e = await AcademicYearService.create_calendar_event(tenant_id, data)
    return CalendarEventResponse(
        id=e.id,
        tenant_id=e.tenantId,
        academic_year_id=e.academicYearId,
        title=e.title,
        date=e.date.date() if hasattr(e.date, "date") else e.date,
        event_type=e.eventType,
        affects_all_courses=e.affectsAllCourses,
        substitute_day_of_week=e.substituteDayOfWeek,
        description=e.description,
        created_at=e.createdAt,
    )


@router.delete("/calendar-events/{id}")
async def delete_calendar_event(id: str, tenant_id: str = Depends(get_tenant_context)):
    return await AcademicYearService.delete_calendar_event(tenant_id, id)
