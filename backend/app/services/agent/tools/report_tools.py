"""Attendance reports for a teacher (own classes) or an admin (any class): shortage, at-risk, eligibility, trend."""
from datetime import date
from typing import Optional
from urllib.parse import urlencode

from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.services.agent.tools.common import BOTH, capped, link, pct, recent_window, report_query, table, teacher_id_of
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.reports import service
from app.services.reports.loader import load_filters

CLASS_CAP = 20
RECENT_DAYS = 14
DROP_POINTS = 15.0
MIN_RECENT_CLASSES = 3


class ScopeArgs(BaseModel):
    class_id: Optional[str] = Field(None, description="Class id from find_classes. Teachers may leave it out for all their classes.")
    section_id: Optional[str] = Field(None, description="Subject id (section_id) from find_classes.")
    date_from: Optional[date] = Field(None, description="Count classes from this day, YYYY-MM-DD.")
    date_to: Optional[date] = Field(None, description="Count classes up to this day, YYYY-MM-DD.")


def _download(path: str, args: ScopeArgs) -> str:
    query = {k: v for k, v in {"class_id": args.class_id, "section_id": args.section_id,
                               "date_from": args.date_from, "date_to": args.date_to, "format": "xlsx"}.items() if v}
    return f"/reports/{path}/export?{urlencode(query)}"


async def students_below_minimum(principal: Principal, args: ScopeArgs) -> ToolResult:
    report = await service.shortage_report(
        principal.tenant_id, teacher_id_of(principal),
        report_query(args.class_id, args.section_id, args.date_from, args.date_to),
    )
    rows = [{"student_id": r.student_id, "name": r.student_name, "roll": r.roll, "class": r.class_code,
             "attended": r.attended, "held": r.held, "percentage": r.percentage, "classes_needed": r.classes_needed}
            for r in report.rows]
    ui = [table(f"Below {report.meta.threshold:g}% in {report.meta.scope}", ["Name", "Roll", "Class", "Attended", "Held", "%", "Needs"],
                [[r["name"], r["roll"], r["class"], r["attended"], r["held"], r["percentage"], r["classes_needed"] if r["classes_needed"] is not None else "-"]
                 for r in rows], _download("shortage", args))]
    data = {"scope": report.meta.scope, "minimum_percent": report.meta.threshold, "students_counted": report.students_counted,
            "average_percentage": report.average_percentage, "below_minimum": capped(rows)}
    return ToolResult(data, ui)


async def _overall(principal: Principal, class_id: str, window: Optional[tuple[date, date]]) -> dict[str, tuple]:
    first, last = window if window else (None, None)
    try:
        report = await service.summary_report(principal.tenant_id, teacher_id_of(principal), report_query(class_id, None, first, last))
    except HTTPException as exc:
        if exc.status_code == 404:
            return {}
        raise
    return {row.student_id: (row.student_name, row.roll, row.overall) for row in report.rows}


async def _class_ids(principal: Principal, class_id: Optional[str]) -> tuple[list[str], dict[str, str], float]:
    filters = await load_filters(principal.tenant_id, teacher_id_of(principal))
    names = {c.id: c.code for c in filters.classes}
    ids = [class_id] if class_id else list(names)[:CLASS_CAP]
    return ids, names, filters.threshold


async def at_risk_students(principal: Principal, args: ScopeArgs) -> ToolResult:
    ids, names, minimum = await _class_ids(principal, args.class_id)
    window = recent_window(RECENT_DAYS)
    rows: list[dict] = []
    for class_id in ids:
        overall, recent = await _overall(principal, class_id, None), await _overall(principal, class_id, window)
        for student_id, (name, roll, total) in overall.items():
            if total.percentage is None:
                continue
            latest = recent.get(student_id, (None, None, None))[2]
            recent_pct = latest.percentage if latest and latest.held >= MIN_RECENT_CLASSES else None
            below = total.percentage < minimum
            dropping = recent_pct is not None and total.percentage - recent_pct >= DROP_POINTS
            if below or dropping:
                rows.append({"student_id": student_id, "name": name, "roll": roll, "class": names.get(class_id, ""),
                             "percentage": total.percentage, "recent_percentage": recent_pct,
                             "reason": "below minimum" if below else f"dropped in the last {RECENT_DAYS} days"})
    rows.sort(key=lambda r: r["percentage"])
    ui = [table("At-risk students", ["Name", "Roll", "Class", "Overall %", f"Last {RECENT_DAYS}d %", "Why"],
                [[r["name"], r["roll"], r["class"], r["percentage"], r["recent_percentage"] if r["recent_percentage"] is not None else "-", r["reason"]]
                 for r in rows])] if rows else []
    return ToolResult({"minimum_percent": minimum, "at_risk": capped(rows), "classes_checked": len(ids)}, ui)


async def exam_eligibility(principal: Principal, args: ScopeArgs) -> ToolResult:
    """Lists who is under the minimum. It never decides condonation; that policy is the institution's."""
    result = await students_below_minimum(principal, args)
    result.data["note"] = "This lists students under the minimum only. Condonation is decided by the institution."
    result.ui.append(link("Open reports", "/admin/reports" if principal.role == "ADMIN" else "/teacher/analytics"))
    return result


class TrendArgs(BaseModel):
    days: int = Field(30, ge=7, le=90, description="Compare the last N days with the N days before.")


async def attendance_trend(principal: Principal, args: TrendArgs) -> ToolResult:
    ids, names, _ = await _class_ids(principal, None)
    now, before = recent_window(args.days), recent_window(args.days, back=args.days)
    rows = []
    for class_id in ids:
        latest, earlier = await _class_average(principal, class_id, now), await _class_average(principal, class_id, before)
        if latest is not None and earlier is not None:
            rows.append({"class": names[class_id], "now": latest, "before": earlier, "change": round(latest - earlier, 1)})
    rows.sort(key=lambda r: r["change"])
    ui = [table(f"Last {args.days} days vs the {args.days} before", ["Class", "Now %", "Before %", "Change"],
                [[r["class"], r["now"], r["before"], r["change"]] for r in rows])] if rows else []
    return ToolResult({"days": args.days, "classes": capped(rows), "classes_checked": len(ids)}, ui)


async def _class_average(principal: Principal, class_id: str, window: tuple[date, date]) -> Optional[float]:
    people = await _overall(principal, class_id, window)
    attended = sum(cell.attended for _, _, cell in people.values())
    held = sum(cell.held for _, _, cell in people.values())
    return pct(attended, held)


TOOLS = [
    Tool("students_below_minimum", "Students under the institution's minimum attendance, with classes needed to recover. Teachers: own classes.",
         ScopeArgs, BOTH, students_below_minimum),
    Tool("at_risk_students", "Students below the minimum OR whose last two weeks fell sharply, across one class or all of a teacher's classes.",
         ScopeArgs, BOTH, at_risk_students),
    Tool("exam_eligibility", "The list of students under the minimum for a class, with an Excel download. Does not decide condonation.",
         ScopeArgs, BOTH, exam_eligibility),
    Tool("attendance_trend", "How each class's attendance changed over the last N days versus the N days before, worst drop first. "
         "Teachers: own classes.",
         TrendArgs, BOTH, attendance_trend),
]
