from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class AttendanceMarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the attendance record")
    student_id: str = Field(..., validation_alias="studentId", description="Student UUID")
    session_id: str = Field(..., validation_alias="sessionId", description="Session UUID")
    status: str = Field(..., description="Outcome of the weighted decision: 'Present' or 'Flagged'")
    face_score: Optional[float] = Field(
        ..., validation_alias="faceScore", description="AI Face similarity score (0.0 to 1.0), null if not checked"
    )
    liveness_score: Optional[float] = Field(
        ..., validation_alias="livenessScore", description="AI Face liveness score (0.0 to 1.0), null if not checked"
    )
    background_score: Optional[float] = Field(
        ...,
        validation_alias="backgroundScore",
        description="AI Background learning-environment score (0.0 to 1.0), null if not checked",
    )
    final_ai_score: Optional[float] = Field(
        ..., validation_alias="finalAiScore", description="Mean of the checks that ran (0.0 to 1.0), null if none ran"
    )
    gps_latitude: float = Field(..., validation_alias="gpsLatitude", description="Submitted GPS Latitude")
    gps_longitude: float = Field(..., validation_alias="gpsLongitude", description="Submitted GPS Longitude")
    created_at: datetime = Field(..., validation_alias="createdAt", description="Verification timestamp")


class AttendanceAnalyzeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    face_score: Optional[float] = Field(..., description="AI Face similarity score (0.0 to 1.0), null if not checked")
    liveness_score: Optional[float] = Field(..., description="AI Face liveness score (0.0 to 1.0), null if not checked")
    background_score: Optional[float] = Field(..., description="AI Background score (0.0 to 1.0), null if not checked")
    final_ai_score: Optional[float] = Field(..., description="Mean of the checks that ran (0.0 to 1.0), null if none ran")
    predicted_status: str = Field(..., description="'Present' or 'Flagged' — what would be saved on confirm")
    review_token: str = Field(..., description="Short-lived signed token to confirm submission without re-running AI")


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
