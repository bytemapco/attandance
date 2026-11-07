"""Bulk import. A spreadsheet row is checked on its own, so one bad row never rejects the others."""
from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.schemas.student import GenderCode

MAX_BULK_ROWS = 200


class RowFailure(BaseModel):
    row: int = Field(..., description="Position of the row in the request, starting at 1")
    message: str


class BulkImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    imported_count: int
    failed_count: int
    invitations_sent: int = 0
    errors: list[str] = Field(default_factory=list)
    failures: list[RowFailure] = Field(default_factory=list)


class BulkItem(BaseModel):
    """One row. Text is trimmed, a blank cell means "not given", and a field the import does not know is refused."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @model_validator(mode="before")
    @classmethod
    def blank_cells_are_missing(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        return {key: value for key, value in data.items() if not (isinstance(value, str) and not value.strip())}


class AccountItem(BulkItem):
    """What a student and a teacher row share: the login and the person's name."""

    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=6, max_length=100)

    @field_validator("email", mode="before")
    @classmethod
    def lowercase_email(cls, v: Any) -> Any:
        return v.strip().lower() if isinstance(v, str) else v


class StudentBulkItem(AccountItem):
    enrollment_number: str = Field(..., min_length=3, max_length=30)
    department_id: str = Field(..., min_length=1, max_length=100, description="Department id, code or name")
    batch_code: Optional[str] = Field(None, max_length=50, description="Batch code within the department, e.g. CE-A-1")
    gender: Optional[GenderCode] = None
    date_of_birth: Optional[date] = None


class TeacherBulkItem(AccountItem):
    employee_id: str = Field(..., min_length=3, max_length=30)
    name_initials: Optional[str] = Field(None, max_length=30)
    department_id: Optional[str] = Field(None, max_length=100, description="Department id, code or name")
    designation_id: Optional[str] = Field(None, max_length=100, description="Designation id, code or name")


class DepartmentBulkItem(BulkItem):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)


class SubjectBulkItem(BulkItem):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    department_id: Optional[str] = Field(None, max_length=100, description="Department id, code or name")


class ClassroomBulkItem(BulkItem):
    name: str = Field(..., min_length=1, max_length=100)


class DesignationBulkItem(BulkItem):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)


def _rows(noun: str) -> Any:
    return Field(..., min_length=1, max_length=MAX_BULK_ROWS, description=f"{noun} rows. Each row is checked on its own.")


class _BulkRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class StudentBulkCreateRequest(_BulkRequest):
    students: list[dict[str, Any]] = _rows("Student")
    send_invite: bool = Field(default=True, description="Whether to dispatch invitation email")


class TeacherBulkCreateRequest(_BulkRequest):
    teachers: list[dict[str, Any]] = _rows("Faculty")
    send_invite: bool = Field(default=True, description="Whether to dispatch invitation email")


class DepartmentBulkCreateRequest(_BulkRequest):
    departments: list[dict[str, Any]] = _rows("Department")


class SubjectBulkCreateRequest(_BulkRequest):
    subjects: list[dict[str, Any]] = _rows("Subject")


class ClassroomBulkCreateRequest(_BulkRequest):
    classrooms: list[dict[str, Any]] = _rows("Classroom")


class DesignationBulkCreateRequest(_BulkRequest):
    designations: list[dict[str, Any]] = _rows("Designation")
