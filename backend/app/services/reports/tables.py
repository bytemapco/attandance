"""Flattens each report into a plain table, so Excel and PDF show exactly what the screen shows."""
from dataclasses import dataclass
from typing import Optional, Union

from app.schemas.reports import RegisterReport, ReportMeta, ShortageReport, SummaryReport

Cell = Union[str, int, float, None]

MARK_CODES = {
    "PRESENT": "P", "APPROVED": "P", "LATE": "L", "ABSENT": "A", "EXCUSED": "E", "FLAGGED": "F", "NOT_ENROLLED": "-",
}


@dataclass(frozen=True)
class ExportTable:
    title: str
    heading: list[str]
    columns: list[str]
    rows: list[list[Cell]]


def _heading(meta: ReportMeta) -> list[str]:
    since = meta.date_from.isoformat() if meta.date_from else "start of term"
    return [
        meta.scope,
        f"{since} to {meta.date_to.isoformat()} · required {meta.threshold:g}%",
        f"Generated {meta.generated_at.strftime('%d %b %Y %H:%M')} UTC",
    ]


def _pct(value: Optional[float]) -> Cell:
    return None if value is None else round(value, 2)


def shortage_table(report: ShortageReport) -> ExportTable:
    columns = ["Roll no.", "Student", "Class", "Attended", "Held", "Attendance %", "Classes still needed"]
    rows = [
        [r.roll, r.student_name, r.class_code, r.attended, r.held, _pct(r.percentage), r.classes_needed]
        for r in report.rows
    ]
    return ExportTable("Shortage list", _heading(report.meta), columns, rows)


def register_table(report: RegisterReport) -> ExportTable:
    columns = ["Roll no.", "Student"]
    columns += [f"{lecture.day.strftime('%d/%m')} {lecture.start}" for lecture in report.lectures]
    columns += ["Attended", "Held", "%"]
    rows: list[list[Cell]] = [
        [r.roll, r.student_name, *[MARK_CODES.get(m, "") if m else "" for m in r.marks], r.attended, r.held, _pct(r.percentage)]
        for r in report.rows
    ]
    return ExportTable("Lecture register", _heading(report.meta), columns, rows)


def summary_table(report: SummaryReport) -> ExportTable:
    columns = ["Roll no.", "Student", *[s.subject_code for s in report.subjects], "Overall %"]
    rows: list[list[Cell]] = [
        [r.roll, r.student_name, *[_pct(c.percentage) if c else "" for c in r.cells], _pct(r.overall.percentage)]
        for r in report.rows
    ]
    return ExportTable("Subject summary", _heading(report.meta), columns, rows)
