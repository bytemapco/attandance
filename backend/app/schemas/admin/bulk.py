from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.student import GenderCode


class BulkImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    imported_count: int
    failed_count: int
    invitations_sent: int = 0
    errors: list[str] = Field(default_factory=list)


class StudentBulkItem(BaseModel):
    email: EmailStr
    enrollment_number: str = Field(..., min_length=3, max_length=30)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    department_id: str = Field(..., min_length=1, max_length=64)
    gender: Optional[GenderCode] = None
    semester: Optional[int] = Field(None, ge=1, le=8)
    batch_code: Optional[str] = Field(None, max_length=50, description="Batch code within the department, e.g. CE-A-1")
    phone: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=6, max_length=100)

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class StudentBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    students: list[StudentBulkItem] = Field(..., min_length=1, description="List of student records to ingest")
    send_invite: bool = Field(default=True, description="Whether to dispatch invitation email")


class TeacherBulkItem(BaseModel):
    email: EmailStr
    employee_id: str = Field(..., min_length=3, max_length=30)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    name_initials: Optional[str] = Field(None, max_length=30)
    department_id: Optional[str] = Field(None, max_length=100)
    designation_id: Optional[str] = Field(None, max_length=100)
    qualification: Optional[str] = Field(None, max_length=100)
    specialization: Optional[str] = Field(None, max_length=100)
    experience_years: Optional[int] = Field(None, ge=0, le=70)
    phone: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=6, max_length=100)

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class TeacherBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    teachers: list[TeacherBulkItem] = Field(..., min_length=1, description="List of faculty records to ingest")
    send_invite: bool = Field(default=True, description="Whether to dispatch invitation email")


class DepartmentBulkItem(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    head: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class DepartmentBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    departments: list[DepartmentBulkItem] = Field(..., min_length=1, description="List of departments to ingest")


class SubjectBulkItem(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    department_id: Optional[str] = Field(None, max_length=64)


class SubjectBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subjects: list[SubjectBulkItem] = Field(..., min_length=1, description="List of subjects to ingest")


class ClassroomBulkItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    building: Optional[str] = Field(None, max_length=100)


class ClassroomBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    classrooms: list[ClassroomBulkItem] = Field(..., min_length=1, description="List of classrooms to ingest")


class DesignationBulkItem(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=500)


class DesignationBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    designations: list[DesignationBulkItem] = Field(..., min_length=1, description="List of designations to ingest")
