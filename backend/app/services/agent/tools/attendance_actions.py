"""Mark or correct attendance, and decide flagged marks. Every change is audited by the services these call."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.db.client import db
from app.schemas.timetable import AttendanceRegisterItem
from app.services import flagged_review_service
from app.services.agent.tools.common import TEACHER_ONLY
from app.services.agent.tools.occurrence_access import bad_request, describe, my_occurrence
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.occurrence_register_service import OccurrenceRegisterService

MAX_CHANGES = 100
MAX_FLAGGED = 20
LOCKED_NEEDS_REASON = "This register is closed. Ask the teacher for a reason; it is kept in the audit log."


def _name(student) -> str:
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or student.enrollmentNumber


def _table(title: str, columns: list[str], rows: list[list[str]]) -> dict:
    return {"table": {"title": title, "columns": columns, "rows": rows}}


class Change(BaseModel):
    student_id: str = Field(description="From class_register or find_students.")
    status: Literal["PRESENT", "ABSENT", "EXCUSED", "LATE"]
    remarks: Optional[str] = Field(None, max_length=200)


class MarkArgs(BaseModel):
    occurrence_id: str = Field(description="The class and day, from my_schedule.")
    changes: list[Change] = Field(min_length=1, max_length=MAX_CHANGES)
    reason: Optional[str] = Field(None, max_length=300, description="Required when the register is already closed.")


async def preview_mark(principal: Principal, args: MarkArgs) -> Preview:
    occurrence = await my_occurrence(principal, args.occurrence_id)
    if occurrence.isAttendanceLocked and not (args.reason or "").strip():
        raise bad_request(LOCKED_NEEDS_REASON)
    wanted = {change.student_id: change.status for change in args.changes}
    enrolled = await db.courseenrollment.find_many(
        where={"courseSectionId": occurrence.courseSectionId, "studentId": {"in": list(wanted)}}, include={"student": True}
    )
    if len(enrolled) != len(wanted):
        raise bad_request(f"{len(wanted) - len(enrolled)} of these students are not enrolled in this class.")
    records = await db.attendancerecord.find_many(where={"occurrenceId": occurrence.id, "studentId": {"in": list(wanted)}})
    current = {record.studentId: record.status for record in records}
    rows = [[_name(e.student), e.student.enrollmentNumber, current.get(e.studentId, "ABSENT"), wanted[e.studentId]] for e in enrolled]
    if all(row[2] == row[3] for row in rows):
        raise bad_request("Nothing would change: every student already has that status.")
    return Preview(
        f"Change {len(rows)} attendance mark{'s' if len(rows) != 1 else ''} for {describe(occurrence)}",
        _table("Changes", ["Student", "Roll", "Now", "Becomes"], rows),
    )


async def mark_attendance(principal: Principal, args: MarkArgs) -> ToolResult:
    updates = [AttendanceRegisterItem(student_id=c.student_id, status=c.status, remarks=c.remarks) for c in args.changes]
    done = await OccurrenceRegisterService.update_register_bulk(
        principal.tenant_id, principal.user, args.occurrence_id, updates, args.reason
    )
    return ToolResult({"message": f"Updated {done['records_processed']} attendance marks.", **done})


class FlaggedRef(BaseModel):
    record_id: str
    occurrence_id: str


class ResolveArgs(BaseModel):
    decision: Literal["APPROVE", "REJECT"] = Field(description="APPROVE counts the student present; REJECT records absent.")
    items: list[FlaggedRef] = Field(min_length=1, max_length=MAX_FLAGGED, description="From my_flagged_records.")
    note: Optional[str] = Field(None, max_length=500, description="Required when the register is already closed.")


async def _flagged_record(principal: Principal, ref: FlaggedRef):
    record = await db.attendancerecord.find_first(
        where={"id": ref.record_id, "occurrenceId": ref.occurrence_id, "tenantId": principal.tenant_id, "status": "FLAGGED"},
        include={"student": True},
    )
    if not record:
        raise bad_request("One of these marks is not flagged any more.")
    occurrence = await my_occurrence(principal, ref.occurrence_id)
    return record, occurrence


async def preview_resolve(principal: Principal, args: ResolveArgs) -> Preview:
    rows, locked = [], False
    for ref in args.items:
        record, occurrence = await _flagged_record(principal, ref)
        locked = locked or occurrence.isAttendanceLocked
        rows.append([_name(record.student), describe(occurrence), record.remarks or ""])
    if locked and not (args.note or "").strip():
        raise bad_request(LOCKED_NEEDS_REASON)
    verb = "Approve" if args.decision == "APPROVE" else "Reject"
    return Preview(f"{verb} {len(rows)} flagged mark{'s' if len(rows) != 1 else ''}", _table("Flagged marks", ["Student", "Class", "Reason flagged"], rows))


async def resolve_flagged_marks(principal: Principal, args: ResolveArgs) -> ToolResult:
    decided = 0
    for ref in args.items:
        await flagged_review_service.resolve_flagged(
            principal.tenant_id, principal.user, ref.occurrence_id, ref.record_id, args.decision, args.note
        )
        decided += 1
    word = "approved" if args.decision == "APPROVE" else "rejected"
    return ToolResult({"message": f"{decided} flagged mark{'s' if decided != 1 else ''} {word}. Students were told.", "decided": decided})


TOOLS = [
    Tool("mark_attendance", "Prepare attendance changes for one class: set students PRESENT, ABSENT, EXCUSED or LATE. "
         "If the register is closed the teacher must give a reason. Nothing changes until the teacher confirms.",
         MarkArgs, TEACHER_ONLY, mark_attendance, preview=preview_mark, editable=frozenset({"reason"})),
    Tool("resolve_flagged_marks", "Prepare approving or rejecting flagged attendance marks from my_flagged_records. "
         "Nothing is decided until the teacher confirms.",
         ResolveArgs, TEACHER_ONLY, resolve_flagged_marks, preview=preview_resolve, editable=frozenset({"note"})),
]
