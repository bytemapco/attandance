from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel

Standing = Literal["NO_DATA", "OK", "AT_RISK", "SHORTAGE"]


class AttendanceFigures(BaseModel):
    conducted: int
    attended: int
    # None until a class has been held; never a made-up 0 or 100.
    percentage: Optional[float] = None
    can_miss: int = 0
    must_attend: int = 0
    standing: Standing


class SubjectFigures(AttendanceFigures):
    course_section_id: str
    subject_name: str
    subject_code: str
    class_code: str
    teacher_name: Optional[str] = None


class WeekFigures(BaseModel):
    week_start: date
    conducted: int
    attended: int
    percentage: Optional[float] = None


class StreakFigures(BaseModel):
    current: int
    best: int


class StudentAnalyticsResponse(BaseModel):
    # The institution's minimum attendance, in percent.
    threshold: float
    # How many points above the threshold still counts as "at risk".
    at_risk_margin: float
    overall: AttendanceFigures
    subjects: List[SubjectFigures]
    weekly_trend: List[WeekFigures]
    streak: StreakFigures
