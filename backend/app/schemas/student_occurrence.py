from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StudentSubjectResponse(BaseModel):
    course_section_id: str
    class_code: str
    subject_name: str
    subject_code: str
    teacher_name: Optional[str] = None
    conducted: int
    attended: int
    percentage: Optional[float] = None


class LiveClassResponse(BaseModel):
    occurrence_id: str
    course_section_id: str
    class_code: str
    subject_name: str
    subject_code: str
    start_time: str
    end_time: str
    classroom_name: Optional[str] = None
    window_closes_at: datetime
    already_marked: bool
