from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel

HistoryStatus = Literal["PRESENT", "LATE", "APPROVED", "EXCUSED", "FLAGGED", "ABSENT"]


class HistoryItem(BaseModel):
    occurrence_id: str
    attendance_id: Optional[str] = None
    course_section_id: str
    subject_name: str
    subject_code: str
    class_code: str
    date: date
    start_time: str
    end_time: str
    # What counts for the student. A closed class with no record is ABSENT.
    status: HistoryStatus
    method: Optional[str] = None
    marked_at: Optional[datetime] = None
    face_score: Optional[float] = None
    liveness_score: Optional[float] = None
    # Why the mark was flagged, or what the teacher wrote when reviewing it.
    remarks: Optional[str] = None
    student_note: Optional[str] = None
    can_add_note: bool = False


class StudentHistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    limit: int
    offset: int
    has_more: bool
