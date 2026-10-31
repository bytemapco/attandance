from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ClassCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = Field(None, max_length=100, description="Name of the class e.g. CE-A-1")
    department_id: Optional[str] = Field(None, max_length=64, description="UUID of the linked Department")
    subject_id: Optional[str] = Field(None, max_length=64, description="UUID of the linked Subject")
    teacher_id: Optional[str] = Field(None, max_length=64, description="UUID of the associated Teacher profile")
    classroom_id: Optional[str] = Field(None, max_length=64, description="UUID of the assigned Classroom")
    academic_year_id: Optional[str] = Field(None, max_length=64, description="UUID of the associated AcademicYear")
    academic_term_id: Optional[str] = Field(None, max_length=64, description="Deprecated alias")
    semester: Optional[int] = Field(None, ge=1, le=8, description="Academic semester (1–8)")
    batch: Optional[str] = Field(None, max_length=50, description="Batch identifier e.g. CE-A-1")

    @field_validator("name", "batch", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class ClassUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    subject_id: Optional[str] = Field(None, min_length=1, max_length=64)
    teacher_id: Optional[str] = Field(None, min_length=1, max_length=64)
    classroom_id: Optional[str] = Field(None, max_length=64)
    academic_year_id: Optional[str] = Field(None, max_length=64)
    academic_term_id: Optional[str] = Field(None, max_length=64)
    semester: Optional[int] = Field(None, ge=1, le=8)
    batch: Optional[str] = Field(None, max_length=20)

    @field_validator("name", "batch", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class AssignTeacherRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    teacher_id: str = Field(..., min_length=1, max_length=64, description="UUID of the Teacher profile to assign")


class EnrollRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_ids: list[str] = Field(..., min_length=1, description="List of Student UUIDs to enroll in the class")


class EnrollStudentsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    enrolled_count: int
    class_id: str
    message: str = "Students successfully enrolled"


class ClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the Academic Class")
    name: str = Field(..., description="Class name")
    subject_name: str = Field(..., description="Resolved name of the subject")
    subject_code: str = Field(..., description="Short code of the subject")
    teacher_id: str = Field(..., alias="teacherId", description="Assigned Teacher profile UUID")
    classroom_name: Optional[str] = Field(None, description="Resolved physical classroom name")
    academic_year_id: Optional[str] = Field(None, alias="academicYearId", description="Associated Academic Year UUID")
    year_name: Optional[str] = Field(None, description="Associated Academic Year Name")
    academic_term_id: Optional[str] = Field(None, alias="academicTermId", description="Associated Academic Term UUID")
    term_name: Optional[str] = Field(None, description="Associated Academic Term Name")
    semester: Optional[int] = Field(None, description="Current semester")
    batch: Optional[str] = Field(None, description="Batch year range")
    enrolled_count: int = Field(0, description="Total count of enrolled students")
    enrolled_student_ids: list[str] = Field(default_factory=list, description="List of enrolled Student UUIDs")
