from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

GenderCode = Literal["M", "F", "O"]


class StudentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(..., description="Unique email address of the student")
    enrollment_number: str = Field(..., min_length=3, max_length=30, description="University Enrollment Number")
    first_name: str = Field(..., min_length=1, max_length=100, description="Student first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Student last name")
    department_id: str = Field(..., min_length=1, max_length=64, description="UUID of the student's department")
    batch_id: str = Field(..., min_length=1, max_length=64, description="UUID of the student's batch, e.g. CE-A-1")
    phone: str = Field(..., min_length=5, max_length=20, description="Contact phone number")
    gender: GenderCode = Field(..., description="Gender code: M, F or O")
    date_of_birth: datetime = Field(..., description="Date of birth")
    send_invite: Optional[bool] = Field(default=True, description="Whether to dispatch an invitation email")

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator(
        "enrollment_number", "first_name", "last_name", "phone", "gender", mode="before"
    )
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class StudentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enrollment_number: Optional[str] = Field(None, min_length=3, max_length=30)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    gender: Optional[GenderCode] = Field(None)
    date_of_birth: Optional[datetime] = Field(None)
    batch_id: Optional[str] = Field(None, min_length=1, max_length=64)
    department_id: Optional[str] = Field(None, min_length=1, max_length=64)

    @field_validator(
        "enrollment_number", "first_name", "last_name", "phone", "gender", mode="before"
    )
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v

    @field_validator("gender", mode="before")
    @classmethod
    def blank_gender_is_none(cls, v: Optional[str]) -> Optional[str]:
        return (v.strip() or None) if isinstance(v, str) else v


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique UUID of the student record")
    user_id: str = Field(..., description="Mapped User UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    email: str = Field(..., description="Email address associated with the user profile")
    first_name: Optional[str] = Field(None, description="Student first name")
    last_name: Optional[str] = Field(None, description="Student last name")
    phone: Optional[str] = Field(None, description="Contact phone number")
    gender: Optional[str] = Field(None, description="Gender identity")
    date_of_birth: Optional[datetime] = Field(None, description="Date of birth")
    department_id: str = Field(..., description="Raw department UUID")
    department_name: str = Field(..., description="Resolved department name")
    semester: Optional[int] = Field(None, description="Semester of the student's class; null while in no class")
    batch: Optional[str] = Field(None, description="Batch code, e.g. CE-A-1")
    invitation_sent: Optional[bool] = Field(None, description="Whether the invite email was queued for delivery; null when no invite was requested")
    batch_id: Optional[str] = Field(None, description="Batch UUID")
    is_active: bool = Field(True, description="Account active status")


class StudentAttendanceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attendance_id: str = Field(..., description="UUID of attendance record")
    class_id: str = Field(..., description="Class UUID")
    class_name: str = Field(..., description="Class name")
    subject: str = Field(..., description="Subject name")
    session_id: str = Field(..., description="Session UUID")
    status: str = Field(..., description="Attendance status (Present, Flagged, Absent)")
    marked_at: datetime = Field(..., description="Timestamp marked")
    face_score: Optional[float] = Field(None, description="AI face similarity score")
    liveness_score: Optional[float] = Field(None, description="AI liveness score")
    background_score: Optional[float] = Field(None, description="AI background score")
    final_ai_score: Optional[float] = Field(None, description="Composite AI score")
    teacher_note: Optional[str] = Field(None, description="Teacher review note/remarks")


class StudentAttendanceHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student profile UUID")
    overall_attendance_percentage: float = Field(
        ..., description="Overall attendance percentage over all enrolled courses"
    )
    history: list[StudentAttendanceItem] = Field(..., description="Detailed history itemized logs")


class StudentClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    class_id: str = Field(..., description="Class UUID")
    class_name: str = Field(..., description="Class name")
    subject: str = Field(..., description="Subject name")
    teacher_name: str = Field(..., description="Teacher name")
    active_session_id: Optional[str] = Field(None, description="UUID of active session if any")
    session_end_time: Optional[datetime] = Field(None, description="Active session end time if any")
    latitude: Optional[float] = Field(None, description="Geofence center latitude")
    longitude: Optional[float] = Field(None, description="Geofence center longitude")
    radius_meters: Optional[float] = Field(None, description="Geofence radius in meters")


class FcmTokenRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(..., min_length=1, max_length=512, description="FCM device push token")

    @field_validator("token", mode="before")
    @classmethod
    def strip_token(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class StudentAttendanceNoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str = Field(..., min_length=1, max_length=500, description="Student note on flagged attendance")

    @field_validator("note", mode="before")
    @classmethod
    def strip_note(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


from app.schemas.student_smartpass import (  # noqa: F401
    LeaderboardEntry,
    LeaderboardResponse,
    SmartPassResponse,
    StudentSmartPassScanRequest,
    StudentSmartPassScanResponse,
    StudentStatsResponse,
)
