from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TeacherClassResponse(BaseModel):
    course_section_id: str
    class_code: str
    subject_name: str
    subject_code: str
    department_name: Optional[str] = None
    semester: Optional[int] = None
    student_count: int
    live_occurrence_id: Optional[str] = None
    window_closes_at: Optional[datetime] = None
    closed_occurrence_id: Optional[str] = None


class ClassSessionStartResponse(BaseModel):
    occurrence_id: str
    window_closes_at: Optional[datetime] = None


class OccurrenceQrResponse(BaseModel):
    qr_token: str
    expires_at: str
    refresh_interval_seconds: int
