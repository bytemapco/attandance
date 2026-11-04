from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique UUID of the audit entry")
    event_type: str = Field(..., alias="eventType", description="Category of event")
    severity: str = Field(..., description="Severity level: INFO, WARNING, CRITICAL")
    actor: str = Field(..., description="Actor identity / email who performed the action")
    target: str = Field(..., description="Target object identifier")
    description: str = Field(..., description="Readable explanation of event")
    ip_address: Optional[str] = Field(None, alias="ipAddress", description="Originating client IP")
    timestamp: datetime = Field(..., alias="timestamp", description="ISO event timestamp")


class AbsenteeAnomalyItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="allow")

    student_id: str
    student_name: str
    enrollment_number: str
    total_absences: int
    anomaly_score: float
    primary_pattern: Optional[str] = None
    day_breakdown: Optional[dict[str, int]] = None


class AdminStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    studentCount: int
    teacherCount: int
    classCount: int
    attendanceCount: int = 0
    attendanceRate: float = 0.0


class StudentFilterFacetsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    semesters: list[int] = Field(default_factory=list, description="Unique active semesters found in student records")



class LicenseRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requested_seats: int = Field(..., ge=1, le=10000, description="Additional seats requested")
    reason: Optional[str] = Field(None, max_length=500, description="Justification note")
