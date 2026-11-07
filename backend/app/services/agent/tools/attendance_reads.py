"""One student's attendance subject by subject, and one class's attendance. Teachers see their own subjects only."""
from datetime import date
from typing import Optional
from urllib.parse import urlencode

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.repositories.student_repository import taught_by
from app.schemas.reports import SummaryReport
from app.services.agent.tools.common import BOTH, capped, pct, report_query, table, teacher_id_of
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.reports import service

STUDENT_ROWS = 60


class Period(BaseModel):
    date_from: Optional[date] = Field(None, description="Count classes from this day, YYYY-MM-DD.")
    date_to: Optional[date] = Field(None, description="Count classes up to this day, YYYY-MM-DD.")


class StudentArgs(Period):
    student_id: str = Field(description="From find_students.")


async def _own_student(principal: Principal, student_id: str):
    where: dict = {"id": student_id, "tenantId": principal.tenant_id}
    if principal.teacher:
        where.update(taught_by(principal.teacher.id))
    found = await db.student.find_first(where=where, include={"department": True})
    if not found:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found.")
    return found


async def _summary(principal: Principal, class_id: str, period: Period) -> SummaryReport:
    return await service.summary_report(principal.tenant_id, teacher_id_of(principal), report_query(class_id, None, period.date_from, period.date_to))


async def _class_ids_of(student_id: str) -> list[str]:
    """Every class whose subjects the student is enrolled in, so a backlog subject taken elsewhere counts too."""
    enrollments = await db.courseenrollment.find_many(where={"studentId": student_id, "status": "ACTIVE", "endedAt": None}, include={"courseSection": True})
    return list(dict.fromkeys(e.courseSection.groupId for e in enrollments if e.courseSection.groupId))


async def student_attendance(principal: Principal, args: StudentArgs) -> ToolResult:
    student = await _own_student(principal, args.student_id)
    class_ids = await _class_ids_of(student.id)
    if not class_ids:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This student is not enrolled in any subject yet, so there is no attendance to show.")
    reports = [await _summary(principal, class_id, args) for class_id in class_ids]
    found = [(report, row) for report in reports for row in report.rows if row.student_id == student.id]
    if not found:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "None of your subjects have this student.")
    subjects = [{"class": report.meta.scope, "subject": subject.subject_name, "attended": cell.attended, "held": cell.held, "percentage": cell.percentage}
                for report, row in found for subject, cell in zip(report.subjects, row.cells) if cell and cell.held]
    attended, held = sum(s["attended"] for s in subjects), sum(s["held"] for s in subjects)
    overall, minimum = pct(attended, held), reports[0].meta.threshold
    ui = [table(f"{found[0][1].student_name}", ["Class", "Subject", "Attended", "Held", "%"],
                [[s["class"], s["subject"], s["attended"], s["held"], s["percentage"]] for s in subjects])] if subjects else []
    data = {"name": found[0][1].student_name, "roll": found[0][1].roll, "department": student.department.name, "minimum_percent": minimum,
            "overall": {"attended": attended, "held": held, "percentage": overall},
            "below_minimum": overall is not None and overall < minimum, "subjects": subjects}
    return ToolResult(data, ui)


class ClassArgs(Period):
    class_id: str = Field(description="From find_classes or list_all_classes.")


async def class_attendance(principal: Principal, args: ClassArgs) -> ToolResult:
    report = await _summary(principal, args.class_id, args)
    subjects = []
    for index, subject in enumerate(report.subjects):
        cells = [row.cells[index] for row in report.rows if row.cells[index]]
        attended, held = sum(c.attended for c in cells), sum(c.held for c in cells)
        subjects.append({"subject": subject.subject_name, "attended": attended, "held": held, "percentage": pct(attended, held)})
    people = sorted((r for r in report.rows if r.overall.held), key=lambda r: r.overall.percentage)
    students = [{"student_id": r.student_id, "name": r.student_name, "roll": r.roll, "attended": r.overall.attended,
                 "held": r.overall.held, "percentage": r.overall.percentage} for r in people]
    query = {key: value for key, value in {"class_id": args.class_id, "date_from": args.date_from, "date_to": args.date_to, "format": "xlsx"}.items() if value}
    ui = [table(f"{report.meta.scope} by subject", ["Subject", "Attended", "Held", "%"],
                [[s["subject"], s["attended"], s["held"], s["percentage"] if s["percentage"] is not None else "-"] for s in subjects],
                f"/reports/subject-summary/export?{urlencode(query)}"),
          table(f"Students in {report.meta.scope}, lowest first", ["Name", "Roll", "Attended", "Held", "%"],
                [[s["name"], s["roll"], s["attended"], s["held"], s["percentage"]] for s in students[:STUDENT_ROWS]])]
    return ToolResult({"class": report.meta.scope, "minimum_percent": report.meta.threshold, "subjects": subjects,
                       "students_lowest_first": capped(students), "students_without_classes_yet": len(report.rows) - len(students)}, ui)


TOOLS = [
    Tool("student_attendance", "One student's attendance overall and subject by subject, and whether they are under the minimum. "
         "Teachers: own students.", StudentArgs, BOTH, student_attendance),
    Tool("class_attendance", "One class's attendance by subject and its students, lowest first, with student ids. Teachers: own subjects.",
         ClassArgs, BOTH, class_attendance),
]
