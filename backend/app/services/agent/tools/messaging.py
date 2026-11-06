"""Send an in-app message to students or teachers. The assistant drafts it; the person edits and confirms on the card."""
from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.db.client import db
from app.repositories.student_repository import taught_by
from app.services.agent.tools.common import BOTH
from app.services.agent.types import Preview, Principal, Tool, ToolResult
from app.services.notification_service import create_in_app_notification

RECIPIENT_CAP = 500
SAMPLE_NAMES = 8


class SendMessageArgs(BaseModel):
    audience: Literal["students", "section", "class", "teachers", "all_teachers"] = Field(
        description="students: student_ids. section: one section_id (all its students). class: one class_id (admin). "
        "teachers: teacher_ids (admin). all_teachers (admin)."
    )
    ids: list[str] = Field(default_factory=list, description="The ids the audience needs, from the find_* tools.")
    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=2000)


@dataclass(frozen=True)
class Recipient:
    user_id: str
    email: str
    name: str
    role: str


def _name(person) -> str:
    return f"{person.firstName or ''} {person.lastName or ''}".strip() or person.user.email


def _students(rows, role: str = "STUDENT") -> list[Recipient]:
    return [Recipient(s.userId, s.user.email, _name(s), role) for s in rows]


def _bad(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, detail)


async def _student_recipients(principal: Principal, args: SendMessageArgs) -> list[Recipient]:
    where: dict = {"tenantId": principal.tenant_id}
    if args.audience == "students":
        where["id"] = {"in": args.ids}
        if principal.teacher:
            where.update(taught_by(principal.teacher.id))
        return _students(await db.student.find_many(where=where, include={"user": True}, take=RECIPIENT_CAP + 1))
    if len(args.ids) != 1:
        raise _bad("Give exactly one id for this audience.")
    if args.audience == "section":
        section = {"id": args.ids[0], "tenantId": principal.tenant_id}
        if principal.teacher:
            section["faculties"] = {"some": {"teacherId": principal.teacher.id}}
        if not await db.coursesection.find_first(where=section):
            raise _bad("That subject was not found among your classes.")
        enrolled = await db.courseenrollment.find_many(
            where={"courseSectionId": args.ids[0], "status": "ACTIVE", "endedAt": None},
            include={"student": {"include": {"user": True}}}, take=RECIPIENT_CAP + 1,
        )
        return _students([e.student for e in enrolled])
    members = await db.classmember.find_many(
        where={"groupId": args.ids[0], "tenantId": principal.tenant_id, "status": "ACTIVE"},
        include={"student": {"include": {"user": True}}}, take=RECIPIENT_CAP + 1,
    )
    return _students([m.student for m in members])


async def _teacher_recipients(principal: Principal, args: SendMessageArgs) -> list[Recipient]:
    where: dict = {"tenantId": principal.tenant_id}
    if args.audience == "teachers":
        where["id"] = {"in": args.ids}
    rows = await db.teacher.find_many(where=where, include={"user": True}, take=RECIPIENT_CAP + 1)
    return [Recipient(t.userId, t.user.email, _name(t), "TEACHER") for t in rows]


async def recipients(principal: Principal, args: SendMessageArgs) -> list[Recipient]:
    staff = args.audience in ("teachers", "all_teachers", "class")
    if staff and principal.teacher:
        raise _bad("Teachers can message their own students and subjects only.")
    found = await (_teacher_recipients if args.audience in ("teachers", "all_teachers") else _student_recipients)(principal, args)
    if not found:
        raise _bad("No one matches that audience.")
    if len(found) > RECIPIENT_CAP:
        raise _bad(f"That is more than {RECIPIENT_CAP} people. Narrow the audience.")
    return found


async def preview_message(principal: Principal, args: SendMessageArgs) -> Preview:
    people = await recipients(principal, args)
    names = [p.name for p in people[:SAMPLE_NAMES]]
    more = len(people) - len(names)
    return Preview(
        summary=f"Send \"{args.title}\" to {len(people)} {'person' if len(people) == 1 else 'people'}",
        details={"recipients": names + ([f"and {more} more"] if more > 0 else []), "count": len(people),
                 "title": args.title, "message": args.message},
    )


async def send_message(principal: Principal, args: SendMessageArgs) -> ToolResult:
    people = await recipients(principal, args)
    for person in people:
        await create_in_app_notification(
            title=args.title, message=args.message, user_id=person.user_id, role=person.role,
            tenant_id=principal.tenant_id, category="message",
        )
    return ToolResult({"message": f"Sent to {len(people)} {'person' if len(people) == 1 else 'people'}", "sent": len(people)})


TOOLS = [
    Tool("send_message", "Prepare an in-app message to students or teachers. Nothing is sent until the user confirms the card; "
         "they can edit the text first. Draft clear, kind, short wording.",
         SendMessageArgs, BOTH, send_message, preview=preview_message, editable=frozenset({"title", "message"})),
]
