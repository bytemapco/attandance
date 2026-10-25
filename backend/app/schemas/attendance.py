from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator


class AttendanceMarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the attendance record")
    student_id: str = Field(..., validation_alias="studentId", description="Student UUID")
    session_id: str = Field(..., validation_alias="sessionId", description="Session UUID")
    status: str = Field(..., description="Outcome of the weighted decision: 'Present' or 'Flagged'")
    face_score: float = Field(..., validation_alias="faceScore", description="AI Face similarity score (0.0 to 1.0)")
    liveness_score: float = Field(
        ..., validation_alias="livenessScore", description="AI Face liveness score (0.0 to 1.0)"
    )
    background_score: float = Field(
        ..., validation_alias="backgroundScore", description="AI Background learning-environment score (0.0 to 1.0)"
    )
    final_ai_score: float = Field(
        ..., validation_alias="finalAiScore", description="Composite decision engine score (0.0 to 1.0)"
    )
    gps_latitude: float = Field(..., validation_alias="gpsLatitude", description="Submitted GPS Latitude")
    gps_longitude: float = Field(..., validation_alias="gpsLongitude", description="Submitted GPS Longitude")
    created_at: datetime = Field(..., validation_alias="createdAt", description="Verification timestamp")


class FlaggedAttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Attendance Record UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    student_name: str = Field(..., description="Student full email or name context")
    class_name: str = Field(..., description="Class name")
    subject: str = Field(..., description="Course Subject")
    face_score: float = Field(..., validation_alias="faceScore", description="Similarity confidence")
    liveness_score: float = Field(..., validation_alias="livenessScore", description="Liveness confidence")
    background_score: float = Field(..., validation_alias="backgroundScore", description="Background confidence")
    final_ai_score: float = Field(..., validation_alias="finalAiScore", description="Composite engine decision score")
    gps_latitude: float = Field(..., validation_alias="gpsLatitude", description="Submitted GPS Latitude")
    gps_longitude: float = Field(..., validation_alias="gpsLongitude", description="Submitted GPS Longitude")
    created_at: datetime = Field(..., validation_alias="createdAt", description="Verification timestamp")
    student_note: Optional[str] = Field(
        None, validation_alias="studentNote", description="Student note on flagged record"
    )


class AttendanceAnalyzeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    face_score: float = Field(..., description="AI Face similarity score (0.0 to 1.0)")
    liveness_score: float = Field(..., description="AI Face liveness score (0.0 to 1.0)")
    background_score: float = Field(..., description="AI Background score (0.0 to 1.0)")
    final_ai_score: float = Field(..., description="Composite weighted score (0.0 to 1.0)")
    predicted_status: str = Field(..., description="'Present' or 'Flagged' — what would be saved on confirm")
    review_token: str = Field(..., description="Short-lived signed token to confirm submission without re-running AI")


class AttendanceReview(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["Approved", "Rejected"] = Field(..., description="Review decision: 'Approved' or 'Rejected'")
    remarks: Optional[str] = Field(default="", max_length=250, description="Audit notes/justification from the teacher")

    @field_validator("remarks", mode="before")
    @classmethod
    def strip_remarks(cls, v: Optional[str]) -> str:
        return v.strip() if isinstance(v, str) else ""


class AttendanceAsyncEnqueueResponse(BaseModel):
    job_id: str = Field(..., description="Unique UUID of the queued attendance job")
    status: str = Field("PENDING", description="Current status: PENDING")
    message: str = Field("Attendance submission queued for verification", description="Informational message")


class AttendanceJobStatusResponse(BaseModel):
    job_id: str
    student_id: str
    session_id: str
    status: Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED"]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None
