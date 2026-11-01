from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.clock_time import ClockTime, require_end_after_start


class ClassCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    department_id: str
    batch_id: str = Field(..., min_length=1, max_length=64, description="Batch UUID, e.g. CE-A-1")
    semester_number: int = Field(..., ge=1, le=8)
    student_ids: List[str] = Field(default_factory=list, max_length=500)


class ClassUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    semester_number: int = Field(..., ge=1, le=8)


class ClassMembersAdd(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_ids: List[str] = Field(..., min_length=1, max_length=500)


class ClassMemberMove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_class_id: str
    reason: str = Field(..., min_length=3, max_length=500)


class ClassMemberRemove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(..., min_length=3, max_length=500)


class ClassSectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject_id: str
    primary_teacher_id: Optional[str] = None
    default_room_id: Optional[str] = None


class ClassSectionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    primary_teacher_id: str


class MemberItem(BaseModel):
    student_id: str
    enrollment_number: str
    name: str
    status: str


class SectionScheduleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday..7=Sunday")
    start_time: ClockTime
    end_time: ClockTime
    classroom_id: Optional[str] = None

    @model_validator(mode="after")
    def end_is_after_start(self) -> "SectionScheduleCreate":
        require_end_after_start(self.start_time, self.end_time)
        return self


class ScheduleItem(BaseModel):
    id: str
    day_of_week: int
    start_time: str
    end_time: str
    room_name: Optional[str] = None


class SectionItem(BaseModel):
    id: str
    name: str
    subject_id: str
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    room_name: Optional[str] = None
    enrolled_count: int = 0
    schedule: List[ScheduleItem] = Field(default_factory=list)


class ClassSummary(BaseModel):
    id: str
    code: str
    department_id: str
    department_name: str
    batch: str
    semester_number: int
    member_count: int
    subject_count: int
    status: str
    created_at: datetime


class ClassDetail(ClassSummary):
    members: List[MemberItem]
    sections: List[SectionItem]
