"""Open and close attendance for a class. Both wait for the teacher's Confirm."""
from typing import Optional

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, model_validator

from app.core.datetime_utils import get_ist_today
from app.db.client import db
from app.services.agent.tools.common import TEACHER_ONLY, link
from app.services.agent.tools.occurrence_access import bad_request, describe, my_occurrence
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.attendance_percentage import ATTENDED_STATUSES
from app.services.system_config_service import SystemConfigService
from app.services.teacher_class_session_service import start_class_session
from app.services.teacher_schedule_service import TeacherScheduleService


class StartArgs(BaseModel):
    occurrence_id: Optional[str] = Field(None, description="One class on one day, from my_schedule.")
    section_id: Optional[str] = Field(None, description="A subject from my_classes, for a class that is not on today's timetable.")

    @model_validator(mode="after")
    def exactly_one(self) -> "StartArgs":
        if bool(self.occurrence_id) == bool(self.section_id):
            raise ValueError("Give either occurrence_id or section_id, not both and not neither.")
        return self


class StopArgs(BaseModel):
    occurrence_id: str = Field(description="The class to close, from my_schedule.")


async def _window_minutes(principal: Principal) -> int:
    return (await SystemConfigService().get_config(tenant_id=principal.tenant_id)).verificationWindowMin


async def preview_start(principal: Principal, args: StartArgs) -> Preview:
    minutes = await _window_minutes(principal)
    if args.section_id:
        section = await db.coursesection.find_first(
            where={"id": args.section_id, "tenantId": principal.tenant_id,
                   "faculties": {"some": {"teacherId": principal.teacher.id}}},
            include={"subject": True},
        )
        if not section:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "That subject was not found among your classes.")
        return Preview(f"Start attendance now for {section.name} {section.subject.name}", {"window_minutes": minutes})
    occurrence = await my_occurrence(principal, args.occurrence_id)
    if occurrence.isAttendanceLocked:
        raise bad_request("This class is already closed.")
    if occurrence.status == "CANCELLED":
        raise bad_request("This class was cancelled.")
    if occurrence.date.date() != get_ist_today():
        raise bad_request("Attendance can only be started on the day of the class.")
    return Preview(f"Start attendance for {describe(occurrence)}", {"window_minutes": minutes})


async def start_attendance(principal: Principal, args: StartArgs) -> ToolResult:
    teacher = principal.teacher
    if args.section_id:
        started = await start_class_session(principal.tenant_id, teacher, args.section_id)
    else:
        occurrence = await TeacherScheduleService.start_occurrence_attendance(principal.tenant_id, teacher.id, args.occurrence_id)
        started = {"occurrence_id": occurrence.id, "window_closes_at": occurrence.verificationExpires}
    page = f"/teacher/attendance/{started['occurrence_id']}"
    return ToolResult(
        {"message": "Attendance is open. Show the QR code to the class.", **started},
        [link("Open the class and show the QR code", page)],
    )


async def preview_stop(principal: Principal, args: StopArgs) -> Preview:
    occurrence = await my_occurrence(principal, args.occurrence_id)
    if occurrence.isAttendanceLocked:
        raise bad_request("This class is already closed.")
    enrolled = await db.courseenrollment.count(
        where={"courseSectionId": occurrence.courseSectionId, "status": "ACTIVE", "endedAt": None}
    )
    recorded = await db.attendancerecord.count(where={"occurrenceId": occurrence.id})
    present = await db.attendancerecord.count(where={"occurrenceId": occurrence.id, "status": {"in": sorted(ATTENDED_STATUSES)}})
    unmarked = max(enrolled - recorded, 0)
    return Preview(
        f"Close attendance for {describe(occurrence)}",
        {"present": present, "enrolled": enrolled, "will_be_recorded_absent_or_excused": unmarked,
         "note": "Students who have not marked are recorded absent, or excused if they have approved leave. "
                 "After this the register is locked and changes need a reason."},
    )


async def stop_attendance(principal: Principal, args: StopArgs) -> ToolResult:
    closed = await TeacherScheduleService.stop_occurrence_attendance(
        principal.tenant_id, principal.teacher.id, principal.user_id, args.occurrence_id
    )
    return ToolResult({"message": f"Class closed. {closed['absent_marked_count']} students were recorded absent or excused.", **closed})


TOOLS = [
    Tool("start_attendance", "Prepare to open attendance for one of the teacher's classes. Give occurrence_id (from my_schedule) "
         "or section_id (from my_classes). Nothing starts until the teacher confirms.",
         StartArgs, TEACHER_ONLY, start_attendance, preview=preview_start),
    Tool("stop_attendance", "Prepare to close a class's register. Students who have not marked are recorded absent. "
         "Nothing is closed until the teacher confirms.",
         StopArgs, TEACHER_ONLY, stop_attendance, preview=preview_stop),
]
