from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class RoleEnum(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"


class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Unique email address or institutional Login ID / Enrollment Number",
    )
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password")
    device_uuid: Optional[str] = Field(
        None, max_length=128, description="Hardware device UUID for student device binding"
    )

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class Token(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str = Field(..., description="Signed JWT access token")
    refresh_token: Optional[str] = Field(None, description="Signed refresh token for extending session")
    token_type: str = Field("bearer", description="Token protocol type")
    role: str = Field(..., description="Role of the authenticated user")
    must_change_password: bool = Field(default=False, description="Flag indicating user must set a new password")
    tenant_id: Optional[str] = Field(None, description="UUID of the user's institution/tenant")
    tenant_slug: Optional[str] = Field(None, description="Tenant slug")
    tenant_name: Optional[str] = Field(None, description="Tenant institution name")


class RefreshTokenRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(..., min_length=1, description="Refresh token string")


class StudentProfileBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    enrollment_number: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    batch: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    face_registered: Optional[bool] = None


class TeacherProfileBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    department_id: Optional[str] = None
    designation_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique UUID of the user")
    email: EmailStr = Field(..., description="Email address of the user")
    role: str = Field(..., description="Assigned role of the user")
    is_active: bool = Field(..., description="System status flag")
    must_change_password: bool = Field(default=False, description="Flag indicating user must set a new password")
    tenant_id: Optional[str] = Field(None, description="UUID of the user's institution/tenant")
    tenant_slug: Optional[str] = Field(None, description="Tenant slug")
    tenant_name: Optional[str] = Field(None, description="Tenant institution name")
    student_profile: Optional[StudentProfileBrief] = Field(
        None, description="Detailed student profile if role is STUDENT"
    )
    teacher_profile: Optional[TeacherProfileBrief] = Field(
        None, description="Detailed teacher profile if role is TEACHER"
    )


def _check_password_complexity(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one numeric digit.")
    return password


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: Optional[str] = Field(
        None, min_length=1, max_length=128, description="Current or temporary password"
    )
    new_password: str = Field(..., min_length=8, max_length=128, description="New secure password")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _check_password_complexity(v)


class DeviceChangeRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(..., description="Unique email address of the user")
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password")
    new_device_uuid: str = Field(..., min_length=1, max_length=128, description="The new hardware device UUID")
    reason: Optional[str] = Field(None, max_length=500, description="Optional reason for changing the device")

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(..., description="Account email address")

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(..., min_length=1, description="Password reset token received via email")
    new_password: str = Field(..., min_length=8, max_length=128, description="New plaintext password")

    @field_validator("new_password")
    @classmethod
    def validate_reset_password(cls, v: str) -> str:
        return _check_password_complexity(v)


class CompleteOnboardingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(..., min_length=1, description="Invitation token received via email")
    password: str = Field(..., min_length=8, max_length=128, description="Chosen password")

    @field_validator("password")
    @classmethod
    def validate_onboarding_password(cls, v: str) -> str:
        return _check_password_complexity(v)


class VerifyTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    valid: bool
    email: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None
    message: Optional[str] = None
