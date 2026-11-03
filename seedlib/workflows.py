"""Requests that need a decision: leave applications and a phone replacement."""
from datetime import date, timedelta

from seedlib import data
from seedlib.client import section
from seedlib.context import Ctx
from seedlib.history import ist_today
from seedlib.timetable_data import SLOTS
from seedlib.users import REPLACED_PHONE


def _weekday(today: date, offset: int) -> date:
    """The offset-th weekday from today: negative is the past, positive the future."""
    step, day, left = (1 if offset > 0 else -1), today, abs(offset)
    while left:
        day += timedelta(days=step)
        if day.weekday() < 5:
            left -= 1
    return day


def _approver(ctx: Ctx, enrollment: str) -> str:
    """A teacher who takes the student's class: the one for that class's first timetable slot."""
    code = next(key for key, entry in data.CLASSES.items() if any(s["enrollment"] == enrollment for s in entry[4]))
    return data.SUBJECT_TEACHER[SLOTS[code][0][0]]


# (enrollment, first weekday offset, last weekday offset, reason, decision, teacher's note)
def _applications(today: date) -> list[tuple[str, date, date, str, str | None, str]]:
    return [
        ("VIT24CS005", _weekday(today, -6), _weekday(today, -5),
         "Viral fever with sore throat. Dr. Mehendale at Sassoon General Hospital advised two days of rest.",
         "APPROVED", "Get well soon. Please bring the prescription to the department office."),
        ("VIT24CS011", _weekday(today, -3), _weekday(today, -3),
         "Travelling to Nagpur for a cousin's engagement ceremony and returning the next morning.",
         "REJECTED", "No supporting document, and a unit test was held that day."),
        ("VIT22EC003", _weekday(today, 3), _weekday(today, 4),
         "Representing the college at the inter-collegiate debate at COEP; the event letter is attached to the department.",
         "APPROVED", "Approved. Collect the notes for these two days from a classmate."),
        ("VIT24CS008", _weekday(today, 10), _weekday(today, 11),
         "Attending my cousin's wedding in Jaipur. Travel tickets booked for the previous evening.",
         None, ""),
    ]


def leaves(ctx: Ctx) -> None:
    api = ctx.api
    section("Leave applications")
    for enrollment, first, last, reason, decision, note in _applications(ist_today()):
        token = ctx.student_tokens.get(enrollment)
        if not token:
            continue
        mine = api.read("/student/leaves", token)["leaves"]
        if any(item["reason"] == reason for item in mine):
            api.skip(f"leave for {enrollment}")
            continue
        created = api.act(
            f"{enrollment} applies for leave {first} to {last}", "POST", "/student/leaves", token,
            data={"start_date": first.isoformat(), "end_date": last.isoformat(), "reason": reason},
        )
        if not (created and decision):
            continue
        teacher_token = ctx.teacher_tokens[_approver(ctx, enrollment)]
        pending = api.read("/teacher/leaves/pending", teacher_token)
        if any(item["id"] == created["id"] for item in pending):
            api.act(
                f"leave {decision.lower()}", "PUT", f"/teacher/leaves/{created['id']}/approve", teacher_token,
                json={"status": decision, "approver_note": note},
            )


def phone_replacement(ctx: Ctx) -> None:
    """Yash Agarwal's phone was stolen. He asks to bind a new one and the teacher approves."""
    api = ctx.api
    enrollment, new_device = REPLACED_PHONE
    person = ctx.students[enrollment]
    section("Phone replacement")
    if ctx.fresh:
        api.act(
            "Yash Agarwal asks to change device", "POST", "/auth/request-device-change",
            json={
                "email": person.email, "password": ctx.password, "tenant_slug": data.TENANT_SLUG,
                "new_device_uuid": new_device, "reason": "Phone stolen on the Pune local train; bought a new one.",
            },
        )
        teacher_token = ctx.teacher_tokens[_approver(ctx, enrollment)]
        pending = api.read("/teacher/device-changes/pending", teacher_token)
        mine = next((r for r in pending if r["enrollment_number"] == enrollment), None)
        if mine:
            api.act("device change approved", "PUT", f"/teacher/device-changes/{mine['id']}/approve", teacher_token,
                    json={"status": "APPROVED"})
    token = api.login(person.email, ctx.password, device_uuid=new_device, tenant_slug=data.TENANT_SLUG)
    if token:
        ctx.student_tokens[enrollment] = token
