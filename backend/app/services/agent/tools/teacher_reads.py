"""What a teacher asks about their own day: the schedule, a class's register, flagged scans, their classes."""
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.core.datetime_utils import get_ist_today
from app.services.agent.tools.common import TEACHER_ONLY, capped, link, table
from app.services.agent.types import Principal, Tool, ToolResult
from app.services.occurrence_register_service import OccurrenceRegisterService
from app.services.teacher_class_session_service import list_my_classes
from app.services.teacher_overview_service import list_flagged


class ScheduleArgs(BaseModel):
    date_from: Optional[date] = Field(None, description="First day, YYYY-MM-DD. Defaults to today.")
    date_to: Optional[date] = Field(None, description="Last day, YYYY-MM-DD. Defaults to date_from.")


async def my_schedule(principal: Principal, args: ScheduleArgs) -> ToolResult:
    first = args.date_from or get_ist_today()
    schedule = await OccurrenceRegisterService.get_daily_schedule(principal.tenant_id, principal.teacher.id, first, args.date_to)
    rows = [
        {
            "occurrence_id": o.id,
            "date": o.date.date().isoformat(),
            "time": f"{o.startTime}-{o.endTime}",
            "class": o.courseSection.name,
            "subject": o.courseSection.subject.name,
            "room": o.classroom.name if o.classroom else None,
            "status": str(o.status),
            "present": schedule.present_counts.get(o.id, 0),
            "enrolled": schedule.enrolled_counts.get(o.courseSectionId, 0),
        }
        for o in schedule.occurrences
    ]
    ui = [table("Schedule", ["Date", "Time", "Class", "Subject", "Room", "Status", "Present"],
                [[r["date"], r["time"], r["class"], r["subject"], r["room"] or "-", r["status"],
                  f"{r['present']}/{r['enrolled']}"] for r in rows])] if rows else []
    return ToolResult({"classes": capped(rows)}, ui)


class RegisterArgs(BaseModel):
    occurrence_id: str = Field(description="Id of one class on one day, from my_schedule.")


async def class_register(principal: Principal, args: RegisterArgs) -> ToolResult:
    register = await OccurrenceRegisterService.get_occurrence_register(principal.tenant_id, args.occurrence_id, principal.user)
    counts: dict[str, int] = {}
    for student in register["students"]:
        counts[student["status"]] = counts.get(student["status"], 0) + 1
    absent = [[s["student_name"], s["enrollment_number"]] for s in register["students"] if s["status"] == "ABSENT"]
    flagged = [[s["student_name"], s["enrollment_number"], s["remarks"] or ""] for s in register["students"] if s["status"] == "FLAGGED"]
    ui = []
    if absent:
        ui.append(table("Absent", ["Name", "Roll"], absent))
    if flagged:
        ui.append(table("Flagged", ["Name", "Roll", "Reason"], flagged))
    data = {
        "class": register["class_code"], "subject": register["course_name"], "time": register["time_range"],
        "date": str(register["date"]), "status": str(register["status"]), "locked": register["is_attendance_locked"],
        "counts": counts, "absent": capped(absent), "flagged": capped(flagged),
    }
    return ToolResult(data, ui)


class NoArgs(BaseModel):
    pass


async def my_flagged_records(principal: Principal, args: NoArgs) -> ToolResult:
    records = await list_flagged(principal.tenant_id, principal.teacher)
    rows = [[r["student_name"], r["enrollment_number"], r["class_code"], str(r["date"]), r["remarks"] or ""] for r in records]
    ui = [table("Flagged scans waiting for you", ["Student", "Roll", "Class", "Date", "Reason"], rows),
          link("Review flagged scans", "/teacher/review")] if rows else []
    detail = [{"record_id": r["record_id"], "occurrence_id": r["occurrence_id"], "student": r["student_name"],
               "class": r["class_code"], "date": str(r["date"]), "reason": r["remarks"]} for r in records]
    return ToolResult({"flagged": capped(detail)}, ui)


async def my_classes(principal: Principal, args: NoArgs) -> ToolResult:
    classes = await list_my_classes(principal.tenant_id, principal.teacher)
    rows = [{"section_id": c["course_section_id"], "class": c["class_code"], "subject": c["subject_name"],
             "semester": c["semester"], "students": c["student_count"], "live": bool(c["live_occurrence_id"])} for c in classes]
    ui = [table("My classes", ["Class", "Subject", "Semester", "Students"],
                [[r["class"], r["subject"], r["semester"] or "-", r["students"]] for r in rows])] if rows else []
    return ToolResult({"classes": capped(rows)}, ui)


TOOLS = [
    Tool("my_schedule", "The teacher's own classes for a day or a range of days, with how many are present.",
         ScheduleArgs, TEACHER_ONLY, my_schedule),
    Tool("class_register", "Who is present, absent or flagged in one class on one day. Needs an occurrence_id from my_schedule.",
         RegisterArgs, TEACHER_ONLY, class_register),
    Tool("my_flagged_records", "Attendance marks flagged for this teacher's review, with the reason for each.",
         NoArgs, TEACHER_ONLY, my_flagged_records),
    Tool("my_classes", "The teacher's classes and subjects with student counts and the ids other tools need.",
         NoArgs, TEACHER_ONLY, my_classes),
]
