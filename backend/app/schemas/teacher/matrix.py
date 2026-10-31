from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


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
