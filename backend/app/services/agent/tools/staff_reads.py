"""What an admin asks about one teacher: who they are, what they teach, and what they are doing on a day."""
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.services.agent.tools.common import ADMIN_ONLY, capped, full_name, table
from app.services.agent.tools.setup_lookups import DAYS
from app.services.agent.tools.teacher_reads import ScheduleArgs, schedule_of
from app.services.agent.types import Principal, Tool, ToolResult


class TeacherArgs(BaseModel):
    teacher_id: str = Field(description="From find_teachers.")


async def _teacher(principal: Principal, teacher_id: str, include: dict | None = None):
    found = await db.teacher.find_first(where={"id": teacher_id, "tenantId": principal.tenant_id}, include=include)
    if not found:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found.")
    return found


async def teacher_profile(principal: Principal, args: TeacherArgs) -> ToolResult:
    teacher = await _teacher(principal, args.teacher_id, {"department": True, "designation": True, "user": True})
    rules = await db.timetablerule.find_many(
        where={"tenantId": principal.tenant_id, "teacherId": teacher.id, "isActive": True},
        include={"courseSection": {"include": {"subject": True}}, "classroom": True}, order=[{"dayOfWeek": "asc"}, {"startTime": "asc"}])
    slots = [{"day": DAYS[r.dayOfWeek], "time": f"{r.startTime}-{r.endTime}", "class": r.courseSection.name,
              "subject": r.courseSection.subject.name, "room": r.classroom.name if r.classroom else None} for r in rules]
    ui = [table("Weekly timetable", ["Day", "Time", "Class", "Subject", "Room"],
                [[s["day"], s["time"], s["class"], s["subject"], s["room"] or "-"] for s in slots])] if slots else []
    data = {"name": full_name(teacher), "employee_id": teacher.employeeId, "email": teacher.user.email,
            "phone": teacher.phone, "department": teacher.department.name, "designation": teacher.designation.name,
            "active": teacher.user.isActive, "weekly_slots": len(slots),
            "subjects_taught": sorted({f"{s['class']} {s['subject']}" for s in slots}), "timetable": capped(slots)}
    return ToolResult(data, ui)


class TeacherDayArgs(ScheduleArgs):
    teacher_id: str = Field(description="From find_teachers.")


async def teacher_schedule(principal: Principal, args: TeacherDayArgs) -> ToolResult:
    teacher = await _teacher(principal, args.teacher_id)
    return await schedule_of(principal, teacher.id, args)


TOOLS = [
    Tool("teacher_profile", "One teacher: department, designation, contact, the subjects they teach and their weekly timetable.",
         TeacherArgs, ADMIN_ONLY, teacher_profile),
    Tool("teacher_schedule", "One teacher's classes for a day or a range, with how many students are present in each.",
         TeacherDayArgs, ADMIN_ONLY, teacher_schedule),
]
