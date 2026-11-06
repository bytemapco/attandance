from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class TeacherCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(..., description="Unique email address of the teacher")
    employee_id: str = Field(..., min_length=3, max_length=30, description="Unique employee identifier e.g. EMP2024001")
    first_name: str = Field(..., min_length=1, max_length=100, description="Teacher first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Teacher last name")
    name_initials: Optional[str] = Field(None, max_length=30, description="Short name initials e.g. nmd, pkp")
    department_id: str = Field(..., min_length=1, max_length=64, description="UUID of the teacher's department")
    designation_id: str = Field(..., min_length=1, max_length=64, description="UUID of the teacher's designation")
    phone: Optional[str] = Field(None, max_length=20, description="Contact phone number")
    send_invite: Optional[bool] = Field(default=True, description="Whether to dispatch an invitation email")

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator(
        "employee_id",
        "first_name",
        "last_name",
        "name_initials",
        "phone",
        mode="before",
    )
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class TeacherUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    employee_id: Optional[str] = Field(None, min_length=3, max_length=30)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    name_initials: Optional[str] = Field(None, max_length=30)
    department_id: Optional[str] = Field(None, max_length=64)
    designation_id: Optional[str] = Field(None, max_length=64)
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator(
        "employee_id",
        "first_name",
        "last_name",
        "name_initials",
        "phone",
        mode="before",
    )
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class TeacherResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique UUID of the teacher record")
    user_id: str = Field(..., description="Mapped User UUID")
    email: str = Field(..., description="Email address associated with the user profile")
    employee_id: str = Field(..., description="Unique employee ID")
    first_name: str = Field(..., description="Teacher first name")
    last_name: str = Field(..., description="Teacher last name")
    name_initials: Optional[str] = Field(None, description="Short name initials")
    department_id: str = Field(..., description="Raw department UUID")
    designation_id: str = Field(..., description="Raw designation UUID")
    department: str = Field(..., description="Resolved department name")
    designation: str = Field(..., description="Resolved designation name")
    phone: Optional[str] = Field(None, description="Contact phone number")
    is_active: bool = Field(True, description="Account active status")
    invitation_sent: Optional[bool] = Field(None, description="Whether the invite email was queued for delivery; null when no invite was requested")
