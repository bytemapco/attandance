from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class HistoryItemResponse(BaseModel):
    occurrence_id: str
    course_section_id: str
    date: datetime
    class_code: str
    subject_name: str
    time_range: str
    locked: bool
    present: int
    flagged: int
    total: int


class FlaggedRecordResponse(BaseModel):
    record_id: str
    occurrence_id: str
    student_name: str
    enrollment_number: str
    class_code: str
    subject_name: str
    date: datetime
    time_range: str
    method: str
    remarks: Optional[str] = None
    locked: bool
