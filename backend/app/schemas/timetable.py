from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CourseSectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    academic_year_id: Optional[str] = Field(None, description="Target Academic Year / Semester ID")
    academic_term_id: Optional[str] = Field(None, description="Deprecated alias for academic_year_id")
    subject_id: str = Field(..., description="Subject ID")
    department_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=50, description="e.g. Section A, Div 1")
    batch: Optional[str] = Field(None, max_length=50, description="Optional batch e.g. B1")
    default_room_id: Optional[str] = None
    primary_teacher_id: Optional[str] = None

    @field_validator("name", "batch", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v

    def resolve_year_id(self) -> str:
        val = self.academic_year_id or self.academic_term_id
        if not val:
            raise ValueError("academic_year_id is required")
        return val


class CourseSectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    academic_year_id: str
    academic_term_id: Optional[str] = None
    subject_id: str
    department_id: Optional[str] = None
    name: str
    batch: Optional[str] = None
    default_room_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    default_room_name: Optional[str] = None
    enrolled_count: Optional[int] = 0


class CourseEnrollmentBulkRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    course_section_id: str
    student_ids: List[str] = Field(..., min_length=1)


class TimetableRuleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    course_section_id: str
    time_slot_id: str
    classroom_id: Optional[str] = None
    teacher_id: Optional[str] = None
    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday..7=Sunday")
    effective_from: date
    effective_until: date
    is_active: Optional[bool] = True


class TimetableRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    course_section_id: str
    time_slot_id: str
    classroom_id: Optional[str] = None
    teacher_id: Optional[str] = None
    day_of_week: int
    effective_from: date
    effective_until: date
    is_active: bool
    time_slot_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    teacher_name: Optional[str] = None
    classroom_name: Optional[str] = None


class ClassOccurrenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    course_section_id: str
    timetable_rule_id: Optional[str] = None
    date: date
    time_slot_id: str
    classroom_id: Optional[str] = None
    faculty_id: str
    substitute_faculty_id: Optional[str] = None
    status: str
    cancellation_reason: Optional[str] = None
    topic_covered: Optional[str] = None
    is_attendance_locked: bool
    verification_active: bool
    verification_expires: Optional[datetime] = None
    conducted_at: Optional[datetime] = None
    course_name: Optional[str] = None
    subject_code: Optional[str] = None
    section_name: Optional[str] = None
    classroom_name: Optional[str] = None
    faculty_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    present_count: Optional[int] = 0
    total_enrolled: Optional[int] = 0


class AttendanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    occurrence_id: str
    student_id: str
    status: str
    method: str
    face_score: Optional[float] = None
    liveness_score: Optional[float] = None
    remarks: Optional[str] = None
    verified_at: datetime
    student_name: Optional[str] = None
    enrollment_number: Optional[str] = None


class AttendanceRegisterItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str
    status: str = Field(..., description="PRESENT, ABSENT, EXCUSED, LATE")
    method: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceRegisterBulkUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    occurrence_id: str
    updates: List[AttendanceRegisterItem]
    reason: Optional[str] = Field("Manual faculty register submission", max_length=255)
