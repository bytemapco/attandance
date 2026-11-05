from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel

OccurrenceStatusName = Literal["SCHEDULED", "CONDUCTED", "CANCELLED", "RESCHEDULED"]


class TimetableEntry(BaseModel):
    occurrence_id: Optional[str] = None
    course_section_id: str
    subject_name: str
    subject_code: str
    class_code: str
    date: date
    start_time: str
    end_time: str
    classroom_name: Optional[str] = None
    teacher_name: Optional[str] = None
    status: OccurrenceStatusName
    cancellation_reason: Optional[str] = None
    is_substitute: bool = False
    # A class a teacher started that is not on the weekly timetable.
    is_extra: bool = False
    # The student's own record for this class, when there is one.
    attendance_status: Optional[str] = None
    window_open: bool = False
    window_closes_at: Optional[datetime] = None


class TimetableDay(BaseModel):
    date: date
    weekday: int
    entries: List[TimetableEntry]


class StudentTimetableResponse(BaseModel):
    generated_at: datetime
    today: date
    saturday_enabled: bool
    days: List[TimetableDay]
