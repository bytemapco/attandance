from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.academic_year import (
    AcademicYearCreate,
    AcademicYearUpdate,
    CalendarEventCreate,
    SemesterCreate,
    SemesterUpdate,
)
from app.services.occurrence_generator import OccurrenceGenerator


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


class AcademicYearService:
    @staticmethod
    async def create_academic_year(tenant_id: str, data: AcademicYearCreate):
        if data.start_date >= data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be strictly before end_date.",
            )
        existing = await db.academicyear.find_first(
            where={"tenantId": tenant_id, "name": data.name}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Academic year / semester with name '{data.name}' already exists.",
            )

        att_start = _to_dt(data.attendance_start_date) if data.attendance_start_date else _to_dt(data.start_date)
        att_end = _to_dt(data.attendance_end_date) if data.attendance_end_date else _to_dt(data.end_date)

        return await db.academicyear.create(
            data={
                "tenantId": tenant_id,
                "name": data.name,
                "startDate": _to_dt(data.start_date),
                "endDate": _to_dt(data.end_date),
                "attendanceStartDate": att_start,
                "attendanceEndDate": att_end,
                "minAttendancePct": data.min_attendance_pct,
                "saturdayEnabled": data.saturday_enabled,
                "verificationWindowMin": data.verification_window_min,
                "status": "PLANNING",
            }
        )

    @staticmethod
    async def list_academic_years(tenant_id: str):
        return await db.academicyear.find_many(
            where={"tenantId": tenant_id},
            include={"courseSections": True},
            order={"startDate": "desc"},
        )

    @staticmethod
    async def get_academic_year(tenant_id: str, year_id: str):
        item = await db.academicyear.find_first(
            where={"id": year_id, "tenantId": tenant_id},
            include={
                "courseSections": {"include": {"subject": True, "faculties": True, "defaultRoom": True}},
                "calendarEvents": True,
            },
        )
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic year not found.")
        return item

    @staticmethod
    async def update_academic_year(tenant_id: str, year_id: str, data: AcademicYearUpdate):
        await AcademicYearService.get_academic_year(tenant_id, year_id)
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.start_date is not None:
            update_data["startDate"] = _to_dt(data.start_date)
        if data.end_date is not None:
            update_data["endDate"] = _to_dt(data.end_date)
        if data.attendance_start_date is not None:
            update_data["attendanceStartDate"] = _to_dt(data.attendance_start_date)
        if data.attendance_end_date is not None:
            update_data["attendanceEndDate"] = _to_dt(data.attendance_end_date)
        if data.min_attendance_pct is not None:
            update_data["minAttendancePct"] = data.min_attendance_pct
        if data.saturday_enabled is not None:
            update_data["saturdayEnabled"] = data.saturday_enabled
        if data.verification_window_min is not None:
            update_data["verificationWindowMin"] = data.verification_window_min
        if data.status is not None:
            update_data["status"] = data.status

        return await db.academicyear.update(where={"id": year_id}, data=update_data)

    @staticmethod
    async def activate_academic_year(tenant_id: str, year_id: str):
        await AcademicYearService.get_academic_year(tenant_id, year_id)
        # Deactivate any currently active academic year
        await db.academicyear.update_many(
            where={"tenantId": tenant_id, "status": "ACTIVE"},
            data={"status": "LOCKED"},
        )
        updated = await db.academicyear.update(
            where={"id": year_id},
            data={"status": "ACTIVE"},
        )
        # Pre-generate occurrences for the upcoming 7 days
        today = date.today()
        for i in range(7):
            day_target = today + timedelta(days=i)
            await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, day_target)

        return updated

    @staticmethod
    async def delete_academic_year(tenant_id: str, year_id: str):
        year = await AcademicYearService.get_academic_year(tenant_id, year_id)
        if year.status == "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete an ACTIVE academic year. Deactivate or lock it first.",
            )
        await db.academicyear.delete(where={"id": year_id})
        return {"success": True, "message": "Academic year deleted successfully."}

    # Calendar Events
    @staticmethod
    async def create_calendar_event(tenant_id: str, data: CalendarEventCreate):
        await AcademicYearService.get_academic_year(tenant_id, data.academic_year_id)
        dt = _to_dt(data.date)
        existing = await db.academiccalendarevent.find_first(
            where={"tenantId": tenant_id, "academicYearId": data.academic_year_id, "date": dt, "eventType": data.event_type}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Calendar event of type '{data.event_type}' already exists on this date.",
            )
        return await db.academiccalendarevent.create(
            data={
                "tenantId": tenant_id,
                "academicYearId": data.academic_year_id,
                "title": data.title,
                "date": dt,
                "eventType": data.event_type,
                "affectsAllCourses": data.affects_all_courses,
                "substituteDayOfWeek": data.substitute_day_of_week,
                "description": data.description,
            }
        )

    @staticmethod
    async def list_calendar_events(tenant_id: str, year_id: Optional[str] = None):
        where = {"tenantId": tenant_id}
        if year_id:
            where["academicYearId"] = year_id
        return await db.academiccalendarevent.find_many(where=where, order={"date": "asc"})

    @staticmethod
    async def delete_calendar_event(tenant_id: str, event_id: str):
        evt = await db.academiccalendarevent.find_first(where={"id": event_id, "tenantId": tenant_id})
        if not evt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found.")
        await db.academiccalendarevent.delete(where={"id": event_id})
        return {"success": True, "message": "Calendar event deleted successfully."}

    # Semesters
    @staticmethod
    async def list_semesters(tenant_id: str, academic_year_id: Optional[str] = None):
        where = {"tenantId": tenant_id}
        if academic_year_id:
            where["academicYearId"] = academic_year_id
        return await db.semester.find_many(
            where=where,
            include={"classTerms": True},
            order=[{"academicYearId": "asc"}, {"number": "asc"}],
        )

    @staticmethod
    async def create_semester(tenant_id: str, academic_year_id: str, data: SemesterCreate):
        year = await AcademicYearService.get_academic_year(tenant_id, academic_year_id)
        if data.start_date >= data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be strictly before end_date.",
            )
        existing = await db.semester.find_first(
            where={"tenantId": tenant_id, "academicYearId": academic_year_id, "number": data.number}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Semester {data.number} already exists for '{year.name}'.",
            )
        return await db.semester.create(
            data={
                "tenantId": tenant_id,
                "academicYearId": academic_year_id,
                "number": data.number,
                "startDate": _to_dt(data.start_date),
                "endDate": _to_dt(data.end_date),
            },
            include={"classTerms": True},
        )

    @staticmethod
    async def update_semester(tenant_id: str, semester_id: str, data: SemesterUpdate):
        sem = await db.semester.find_first(where={"id": semester_id, "tenantId": tenant_id})
        if not sem:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found.")
        update_data = {}
        if data.number is not None:
            update_data["number"] = data.number
        if data.start_date is not None:
            update_data["startDate"] = _to_dt(data.start_date)
        if data.end_date is not None:
            update_data["endDate"] = _to_dt(data.end_date)
        return await db.semester.update(
            where={"id": semester_id}, data=update_data, include={"classTerms": True}
        )

    @staticmethod
    async def delete_semester(tenant_id: str, semester_id: str):
        sem = await db.semester.find_first(
            where={"id": semester_id, "tenantId": tenant_id}, include={"classTerms": True}
        )
        if not sem:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found.")
        if sem.classTerms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete a semester that has classes assigned to it.",
            )
        await db.semester.delete(where={"id": semester_id})
        return {"success": True, "message": "Semester deleted successfully."}
