from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ClassCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    department_id: str
    batch_id: str = Field(..., min_length=1, max_length=64, description="Batch UUID, e.g. CE-A-1")
    academic_year_id: str
    semester_number: int = Field(..., ge=1, le=8)
    student_ids: List[str] = Field(default_factory=list, max_length=500)


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


class BacklogEnrollment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str
    course_section_id: str


class PromoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    next_academic_year_id: str
    dry_run: bool = True
    detained_student_ids: List[str] = Field(default_factory=list)
    backlogs: List[BacklogEnrollment] = Field(default_factory=list)


class MemberItem(BaseModel):
    student_id: str
    enrollment_number: str
    name: str
    status: str


class SectionScheduleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday..7=Sunday")
    time_slot_id: str
    classroom_id: Optional[str] = None


class ScheduleItem(BaseModel):
    id: str
    day_of_week: int
    time_slot_id: str
    slot_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
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
    group_id: str
    department_id: str
    department_name: str
    batch: str
    semester_number: int
    academic_year_id: str
    academic_year_name: str
    member_count: int
    subject_count: int
    status: str
    created_at: datetime


class ClassDetail(ClassSummary):
    members: List[MemberItem]
    sections: List[SectionItem]


class PromotionPreview(BaseModel):
    dry_run: bool
    next_class_id: Optional[str] = None
    next_semester_number: Optional[int] = None
    promoted: int
    detained: int
    backlog_enrollments: int
    graduated: bool
