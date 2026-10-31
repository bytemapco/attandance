from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SmartPassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    qr_token: str = Field(..., description="Short-lived rotating JWT")
    expires_at: str = Field(..., description="ISO 8601 expiry timestamp")
    student_name: str = Field(..., description="Full student name")
    enrollment_number: str = Field(..., description="Enrollment identifier")


class StudentSmartPassScanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    qr_token: str = Field(..., min_length=1, description="Teacher dynamic session QR token")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Student GPS latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Student GPS longitude")
    accuracy: float = Field(..., ge=0.0, description="GPS horizontal accuracy in meters")
    device_uuid: str = Field(..., min_length=1, max_length=128, description="Hardware device UUID")


class StudentSmartPassScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="Status (success, already_marked)")
    session_id: str = Field(..., description="Session UUID")
    class_name: str = Field(..., description="Class name")
    subject: str = Field(..., description="Subject name")
    attendance_status: str = Field("Present", description="Resulting status")
    student_name: str = Field(..., description="Student full name")
    enrollment_number: str = Field(..., description="Student enrollment number")
    marked_at: str = Field(..., description="ISO timestamp")
    message: str = Field(..., description="Feedback message")


class StudentStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    current_streak: int = 0
    highest_streak: int = 0
    total_classes: int = 0
    present_count: int = 0
    absent_count: int = 0
    flagged_count: int = 0
    excused_count: int = 0
    attendance_percentage: float = 0.0


class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str
    name: str
    points: int
    current_streak: int = 0


class LeaderboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leaderboard: list[LeaderboardEntry] = Field(default_factory=list)
    user_rank: Optional[int] = None
    user_points: int = 0
