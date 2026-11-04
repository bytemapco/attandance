from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ReportClass(BaseModel):
    id: str
    code: str
    department_name: str
    semester: int


class ReportSubject(BaseModel):
    section_id: str
    class_id: Optional[str] = None
    class_code: str
    subject_code: str
    subject_name: str


class ReportFilters(BaseModel):
    threshold: float
    classes: list[ReportClass]
    subjects: list[ReportSubject]


class ReportMeta(BaseModel):
    scope: str
    threshold: float
    date_from: Optional[date] = None
    date_to: date
    generated_at: datetime


class ShortageRow(BaseModel):
    student_id: str
    student_name: str
    roll: str
    class_code: str
    attended: int
    held: int
    percentage: float
    classes_needed: Optional[int] = None


class ShortageReport(BaseModel):
    meta: ReportMeta
    students_counted: int
    average_percentage: Optional[float] = None
    rows: list[ShortageRow]


class RegisterLecture(BaseModel):
    id: str
    day: date
    start: str
    end: str
    present: int


class RegisterRow(BaseModel):
    student_id: str
    student_name: str
    roll: str
    marks: list[Optional[str]]  # one per lecture: a status, NOT_ENROLLED, or null when nothing was recorded
    attended: int
    held: int
    percentage: Optional[float] = None


class RegisterReport(BaseModel):
    meta: ReportMeta
    lectures: list[RegisterLecture]
    rows: list[RegisterRow]


class SummaryCell(BaseModel):
    attended: int
    held: int
    percentage: Optional[float] = None


class SummaryRow(BaseModel):
    student_id: str
    student_name: str
    roll: str
    cells: list[Optional[SummaryCell]]  # one per subject; null when the student is not in that subject
    overall: SummaryCell


class SummaryReport(BaseModel):
    meta: ReportMeta
    subjects: list[ReportSubject]
    rows: list[SummaryRow]
