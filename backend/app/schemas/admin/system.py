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


class AbsenteeScanAnomalyItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    student_name: str = Field(..., description="Full student name")
    enrollment_number: str = Field(..., description="Student enrollment number")
    class_id: str = Field(..., description="Academic class UUID")
    class_name: str = Field(..., description="Class name")
    attendance_rate: float = Field(..., description="Current overall attendance percentage")
    consecutive_absences: int = Field(..., description="Number of consecutive sessions missed")
    risk_level: str = Field(..., description="Risk tier: MODERATE, HIGH, CRITICAL")
    last_attended_date: Optional[str] = Field(None, description="Date of last session attended")


class AbsenteeScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scanned_at: str = Field(..., description="ISO timestamp of scan execution")
    total_scanned: int = Field(..., description="Total student enrollments examined")
    anomalies_detected: int = Field(..., description="Count of detected at-risk cases")
    anomalies: list[AbsenteeScanAnomalyItem] = Field(default_factory=list, description="List of detected anomalies")


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
    biometricPassRate: float = 0.0


class StudentFilterFacetsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    branches: list[str] = Field(default_factory=list, description="Unique branches found in student records")
    batches: list[str] = Field(default_factory=list, description="Unique batches found in student records")
    semesters: list[int] = Field(default_factory=list, description="Unique active semesters found in student records")



class LicenseDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    allocated_count: int
    used_count: int
    available_count: int
    license_key: str
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class LicenseRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requested_seats: int = Field(..., ge=1, le=10000, description="Additional seats requested")
    reason: Optional[str] = Field(None, max_length=500, description="Justification note")


class LicenseRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    tenant_name: Optional[str] = None
    requested_seats: int
    reason: Optional[str] = None
    status: str
    reviewer_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
