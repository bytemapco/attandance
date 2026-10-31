from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class SessionStart(BaseModel):
    model_config = ConfigDict(extra="forbid")

    academic_class_id: str = Field(..., min_length=1, max_length=64, description="Target Class UUID for this session")
    duration_minutes: int = Field(10, ge=1, le=180, description="Session validity window in minutes")


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the active session")
    academic_class_id: str = Field(..., alias="academicClassId", description="Associated Class UUID")
    start_time: datetime = Field(..., alias="startTime", description="Timestamp when the session opened")
    end_time: datetime = Field(..., alias="endTime", description="Timestamp when the session will close")
    is_active: bool = Field(..., alias="isActive", description="Current state of the session")


class GeofenceUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float = Field(..., ge=-90.0, le=90.0, description="GPS Latitude coordinate")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="GPS Longitude coordinate")
    radius_meters: float = Field(..., gt=0.0, le=5000.0, description="Geofence boundary radius in meters")


class GeofenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the Geofence record")
    academic_class_id: str = Field(..., alias="academicClassId", description="Class ID")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    radius_meters: float = Field(..., alias="radiusMeters", description="Radius in meters")
    created_at: datetime = Field(..., alias="createdAt", description="Timestamp created")
    updated_at: datetime = Field(..., alias="updatedAt", description="Timestamp updated")


class AcademicClassWithGeofenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the Academic Class")
    name: str = Field(..., description="Class name")
    subject: str = Field(..., description="Resolved subject name")
    teacher_id: str = Field(..., alias="teacherId", description="Teacher ID")
    geofence: Optional[GeofenceResponse] = Field(None, description="Class geofence configuration")


class SessionStudentAttendanceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    full_name: str = Field(..., description="Student full name (first + last)")
    email: str = Field(..., description="Student email address")
    status: str = Field(..., description="Attendance status (Present, Flagged, Absent)")
    final_score: float = Field(..., description="Final calculated AI attendance score")
    marked_at: Optional[datetime] = Field(None, description="Timestamp attendance was registered")


# Backward-compatible alias
StudentRosterItem = SessionStudentAttendanceItem


class SessionAttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    session_id: str = Field(..., description="Session UUID")
    class_name: str = Field(..., description="Class name")
    attendance_roll: list[SessionStudentAttendanceItem] = Field(
        ..., alias="roster", description="Enrolled student attendance list"
    )

    @property
    def roster(self) -> list[SessionStudentAttendanceItem]:
        return self.attendance_roll


class AttendanceManualOverride(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str = Field(..., min_length=1, max_length=64, description="Student UUID to override")
    status: Literal["Present", "Absent"] = Field(..., description="Target status (Present or Absent)")


class SessionWithClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Unique UUID of the session")
    academic_class_id: str = Field(..., alias="academicClassId", description="Associated Class UUID")
    class_name: str = Field(..., description="Class Name")
    subject: str = Field(..., description="Resolved subject name")
    start_time: datetime = Field(..., alias="startTime", description="Timestamp when session opened")
    end_time: datetime = Field(..., alias="endTime", description="Timestamp when session closed")
    is_active: bool = Field(..., alias="isActive", description="Current state of session")


class BulkAttendanceRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str = Field(..., min_length=1, max_length=64, description="Student UUID")
    status: Literal["Present", "Absent"] = Field(..., description="Attendance status to set")


class BulkMarkRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    records: list[BulkAttendanceRecord] = Field(..., min_length=1, description="List of student attendance records")


class AbsentStudentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    full_name: str = Field(..., description="Student full name")
    email: str = Field(..., description="Student email address")


class DeviceChangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Device Change Request UUID")
    student_id: str = Field(..., description="Student UUID")
    student_name: str = Field(..., description="Student full name")
    enrollment_number: str = Field(..., description="Student enrollment number")
    new_device_uuid: str = Field(..., description="New device UUID requested")
    reason: Optional[str] = Field(None, description="Reason for device change")
    status: str = Field(..., description="Request status (PENDING, APPROVED, REJECTED)")
    approved_by: Optional[str] = Field(None, description="UUID of approver")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class DeviceChangeApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["APPROVED", "REJECTED"] = Field(..., description="Approval status decision")


class SmartPassVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    qr_token: str = Field(..., min_length=1, description="Rotating 30-second JWT token from student Smart Pass")
    session_id: str = Field(..., min_length=1, max_length=64, description="Active session UUID")


class SmartPassVerifyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str = Field(..., description="Status (success, already_marked, error)")
    student_id: str = Field(..., description="Student UUID")
    student_name: str = Field(..., description="Full name of student")
    enrollment_number: str = Field(..., description="Student enrollment number")
    attendance_status: str = Field(..., description="Resulting attendance status (e.g. Present)")
    session_id: str = Field(..., description="Session UUID")
    message: str = Field(..., description="User feedback message")


class TeacherSmartPassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    qr_token: str = Field(..., description="Rotating cryptographically signed session JWT token")
    session_id: str = Field(..., description="Active session UUID")
    class_name: str = Field(..., description="Academic class name")
    subject: str = Field(..., description="Subject name")
    expires_at: str = Field(..., description="ISO 8601 expiry timestamp")
    refresh_interval_seconds: int = Field(5, description="Recommended token rotation interval in seconds")
