from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AcademicYearCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=100, description="Semester / Year name e.g. Sem 1 — 2025–26")
    start_date: date
    end_date: date
    attendance_start_date: Optional[date] = None
    attendance_end_date: Optional[date] = None
    min_attendance_pct: float = Field(75.0, ge=0.0, le=100.0)
    saturday_enabled: bool = False
    verification_window_min: int = Field(60, ge=5, le=360)


class AcademicYearUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    attendance_start_date: Optional[date] = None
    attendance_end_date: Optional[date] = None
    min_attendance_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    saturday_enabled: Optional[bool] = None
    verification_window_min: Optional[int] = Field(None, ge=5, le=360)
    status: Optional[str] = Field(None, description="PLANNING, ACTIVE, LOCKED, ARCHIVED")


class AcademicYearResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    name: str
    start_date: date
    end_date: date
    attendance_start_date: Optional[date] = None
    attendance_end_date: Optional[date] = None
    min_attendance_pct: float
    saturday_enabled: bool
    verification_window_min: int
    status: str
    created_at: datetime
    updated_at: datetime
    sections_count: Optional[int] = 0


class TimeSlotCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slot_number: int = Field(..., ge=1, le=50)
    name: str = Field(..., min_length=1, max_length=50, description="e.g. Period 1, Lunch, Lab Block")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format e.g. 09:00")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format e.g. 10:00")
    is_break: bool = False
    is_lab_block: bool = False


class TimeSlotUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slot_number: Optional[int] = Field(None, ge=1, le=50)
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    is_break: Optional[bool] = None
    is_lab_block: Optional[bool] = None


class TimeSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: Optional[str] = None
    slot_number: int
    name: str
    start_time: str
    end_time: str
    is_break: bool
    is_lab_block: bool


class CalendarEventCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    academic_year_id: str
    title: str = Field(..., min_length=1, max_length=120)
    date: date
    event_type: str = Field(..., description="HOLIDAY, EXAM_DAY, NON_INSTRUCTIONAL, TIMETABLE_OVERRIDE")
    affects_all_courses: bool = True
    substitute_day_of_week: Optional[int] = Field(None, ge=1, le=7)
    description: Optional[str] = None


class CalendarEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    academic_year_id: str
    title: str
    date: date
    event_type: str
    affects_all_courses: bool
    substitute_day_of_week: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime
