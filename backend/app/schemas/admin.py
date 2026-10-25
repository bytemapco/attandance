from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class ClassCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100, description="Name of the class e.g. CS-101-A")
    subject_id: str = Field(..., min_length=1, max_length=64, description="UUID of the linked Subject")
    teacher_id: str = Field(..., min_length=1, max_length=64, description="UUID of the associated Teacher profile")
    classroom_id: Optional[str] = Field(None, max_length=64, description="UUID of the assigned Classroom (optional)")
    semester: Optional[int] = Field(None, ge=1, le=8, description="Academic semester (1–8)")
    batch: Optional[str] = Field(None, max_length=20, description="Batch year range e.g. 2022-2026")

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
    name: str = Field(..., description="Name of the class")
    subject_name: str = Field(..., description="Resolved subject name")
    subject_code: str = Field(..., description="Resolved subject code")
    teacher_id: str = Field(..., alias="teacherId", description="Teacher ID associated with this class")
    classroom_name: Optional[str] = Field(None, description="Resolved classroom name")
    semester: Optional[int] = Field(None, description="Academic semester")
    batch: Optional[str] = Field(None, description="Batch year range")
    enrolled_count: int = Field(0, description="Current number of enrolled students")
    enrolled_student_ids: list[str] = Field(default_factory=list, description="List of student IDs currently enrolled")


class DepartmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=3, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    head: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "code", "head", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class DepartmentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=3, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    head: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "code", "head", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    head: Optional[str] = None
    description: Optional[str] = None
    classCount: int = 0


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    timestamp: datetime
    eventType: str
    severity: str
    actor: str
    target: str
    description: str
    ip: Optional[str] = Field(None, alias="ipAddress")
    meta: Optional[dict[str, Any]] = Field(None, alias="metadata")


class AdminStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    studentCount: int
    teacherCount: int
    classCount: int
    attendanceCount: int = 0
    biometricPassRate: float = 0.0


class StudentBulkItem(BaseModel):
    email: EmailStr
    enrollment_number: str = Field(..., min_length=3, max_length=30)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    department_id: Optional[str] = Field(None, max_length=64)
    gender: Optional[str] = Field(None, max_length=20)
    branch: Optional[str] = Field(None, max_length=50)
    semester: Optional[int] = Field(None, ge=1, le=8)
    batch: Optional[str] = Field(None, max_length=20)
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


class ClassBulkItem(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    subject_code: str = Field(..., min_length=1, max_length=50)
    teacher_email: EmailStr
    classroom_name: Optional[str] = Field(None, max_length=100)
    semester: Optional[int] = Field(None, ge=1, le=8)
    batch: Optional[str] = Field(None, max_length=20)

    @field_validator("teacher_email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class ClassBulkCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    classes: list[ClassBulkItem] = Field(..., min_length=1, description="List of class records to ingest")


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


class BulkImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    imported_count: int
    failed_count: int
    invitations_sent: int = 0
    errors: list[str] = Field(default_factory=list)


class AbsenteeAnomalyItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    student_id: str
    student_name: str
    enrollment_number: str
    total_absences: int
    anomaly_score: float
    primary_pattern: Optional[str] = None
    day_breakdown: Optional[dict[str, int]] = None


class StudentFilterFacetsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    branches: list[str] = Field(default_factory=list, description="Unique branches found in student records")
    batches: list[str] = Field(default_factory=list, description="Unique batches found in student records")
    semesters: list[int] = Field(default_factory=list, description="Unique active semesters found in student records")
