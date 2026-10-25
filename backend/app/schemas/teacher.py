from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


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


class StudentRosterItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    full_name: str = Field(..., description="Student full name (first + last)")
    email: str = Field(..., description="Student email address")
    status: str = Field(..., description="Attendance status (Present, Flagged, Absent)")
    final_score: float = Field(..., description="Final calculated AI attendance score")
    marked_at: Optional[datetime] = Field(None, description="Timestamp attendance was registered")


class SessionAttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str = Field(..., description="Session UUID")
    class_name: str = Field(..., description="Class name")
    roster: list[StudentRosterItem] = Field(..., description="Enrolled roster list details")


class StatusDistribution(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    present: int = Field(0, description="Count of present records")
    absent: int = Field(0, description="Count of absent records")
    flagged: int = Field(0, description="Count of flagged records")
    approved: int = Field(0, description="Count of approved records")


class DistributionTiers(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    below_50: int = Field(0, description="Students with attendance < 50%")
    between_50_75: int = Field(0, description="Students with attendance 50% - 74.9%")
    between_75_85: int = Field(0, description="Students with attendance 75% - 84.9%")
    above_85: int = Field(0, description="Students with attendance >= 85%")


class StudentAttendanceSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    full_name: str = Field(..., description="Student full name")
    email: str = Field(..., description="Student email address")
    total_sessions: int = Field(..., description="Total class sessions held")
    attended_sessions: int = Field(..., description="Total sessions attended by student")
    attendance_percentage: float = Field(..., description="Calculated student attendance percentage")
    at_risk: bool = Field(False, description="True if attendance is below 75%")
    last_attended_at: Optional[datetime] = Field(None, description="Timestamp of last attendance marked")


class SessionTrendItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str = Field(..., description="Session UUID")
    session_name: str = Field(..., description="Display name of session")
    session_date: Optional[str] = Field(None, description="Session date ISO format")
    attendance_percentage: float = Field(..., description="Attendance percentage for session")


class ClassStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    class_id: str = Field(..., description="Class UUID")
    class_name: Optional[str] = Field(None, description="Class name")
    subject: Optional[str] = Field(None, description="Subject name")
    total_sessions: int = Field(..., description="Total sessions held for class")
    total_students: int = Field(..., description="Total student count enrolled in class")
    overall_attendance_percentage: float = Field(..., description="Overall class attendance percentage")
    at_risk_count: int = Field(0, description="Count of students with attendance < 75%")
    status_distribution: StatusDistribution = Field(default_factory=StatusDistribution, description="Status breakdown")
    distribution_tiers: DistributionTiers = Field(default_factory=DistributionTiers, description="Performance tiers")
    history: list[SessionTrendItem] = Field(
        default_factory=list, description="Chronological list of sessions with stats"
    )
    students: list[StudentAttendanceSummaryItem] = Field(default_factory=list, description="Per-student summary items")


class StudentClassSessionLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str = Field(..., description="Session UUID")
    session_name: str = Field(..., description="Session display name")
    session_date: str = Field(..., description="ISO formatted session date")
    start_time: datetime = Field(..., description="Session start time")
    end_time: datetime = Field(..., description="Session end time")
    status: str = Field(..., description="Attendance status: Present, Absent, Flagged, Approved")
    final_ai_score: float = Field(0.0, description="Final AI verification score")
    marked_at: Optional[datetime] = Field(None, description="Timestamp attendance was registered")
    remarks: Optional[str] = Field(None, description="Teacher remarks or system notes")
    student_note: Optional[str] = Field(None, description="Note submitted by student if flagged")


class StudentClassHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    student_name: str = Field(..., description="Student full name")
    enrollment_number: str = Field(..., description="Student enrollment number")
    email: str = Field(..., description="Student email address")
    class_id: str = Field(..., description="Academic class UUID")
    class_name: str = Field(..., description="Academic class name")
    subject: str = Field(..., description="Subject name")
    total_sessions: int = Field(..., description="Total sessions held")
    attended_sessions: int = Field(..., description="Sessions student attended")
    attendance_percentage: float = Field(..., description="Overall attendance percentage for this class")
    at_risk: bool = Field(False, description="True if attendance < 75%")
    sessions: list[StudentClassSessionLog] = Field(
        default_factory=list, description="Complete session-by-session history"
    )


class AttendanceMatrixSessionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str = Field(..., description="Session UUID")
    session_name: str = Field(..., description="Session display name")
    session_date: str = Field(..., description="Session date string")


class AttendanceMatrixStudentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: str = Field(..., description="Student UUID")
    enrollment_number: str = Field(..., description="Student enrollment number")
    full_name: str = Field(..., description="Student full name")
    attendance_percentage: float = Field(..., description="Student attendance percentage")
    statuses: dict[str, str] = Field(
        default_factory=dict, description="Map of sessionId to status (e.g. 'Present', 'Absent')"
    )


class AttendanceMatrixResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    class_id: str = Field(..., description="Class UUID")
    class_name: str = Field(..., description="Class name")
    subject: str = Field(..., description="Subject name")
    sessions: list[AttendanceMatrixSessionItem] = Field(default_factory=list, description="Ordered class sessions")
    students: list[AttendanceMatrixStudentItem] = Field(
        default_factory=list, description="Ordered student rows with status map"
    )


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


class ClassAttendanceExportItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    enrollment_number: str
    first_name: str
    last_name: str
    email: str
    session_date: str
    class_name: str
    subject: str
    status: str
    final_ai_score: float
    remarks: str
