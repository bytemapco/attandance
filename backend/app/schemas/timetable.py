from datetime import date, datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator

from app.schemas.clock_time import ClockTime, require_end_after_start


class CourseSectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

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


class CourseSectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
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
    start_time: ClockTime
    end_time: ClockTime
    classroom_id: Optional[str] = None
    teacher_id: Optional[str] = None
    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday..7=Sunday")
    effective_from: date
    effective_until: Optional[date] = Field(None, description="Leave empty for a rule that runs until removed")
    is_active: Optional[bool] = True

    @model_validator(mode="after")
    def end_is_after_start(self) -> "TimetableRuleCreate":
        require_end_after_start(self.start_time, self.end_time)
        return self


class TimetableRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    course_section_id: str
    classroom_id: Optional[str] = None
    teacher_id: Optional[str] = None
    day_of_week: int
    start_time: str
    end_time: str
    effective_from: date
    effective_until: Optional[date] = None
    is_active: bool
    teacher_name: Optional[str] = None
    classroom_name: Optional[str] = None


class AttendanceRegisterItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str
    status: Literal["PRESENT", "ABSENT", "EXCUSED", "LATE"]
    method: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceRegisterBulkUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    occurrence_id: str
    updates: List[AttendanceRegisterItem]
    reason: Optional[str] = Field(None, max_length=500, description="Required to change a register that is already closed")


class FlaggedDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision: Literal["APPROVE", "REJECT"]
    note: Optional[str] = Field(None, max_length=500, description="Required when the register is already closed")


class FlaggedDecisionResponse(BaseModel):
    record_id: str
    student_id: str
    status: Literal["APPROVED", "ABSENT"]
