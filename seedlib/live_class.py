"""Today's class: the teacher opens attendance and students scan the rotating QR code, as in a real lecture."""
from seedlib import data
from seedlib.client import section
from seedlib.context import Ctx
from seedlib.history import ist_today
from seedlib.users import device_for

OUTSIDE_CAMPUS = {"latitude": 18.5204, "longitude": 73.8567, "accuracy": 10.0}  # Shaniwar Wada, 6 km away


def _class_of(ctx: Ctx, section_id: str) -> str | None:
    return next((code for (code, _subject), sid in ctx.sections.items() if sid == section_id), None)


def _pick_class(ctx: Ctx) -> tuple[str, dict] | None:
    """The first of today's classes that is still open, with a teacher who can sign in.
    Nothing is picked once a class has been closed today, so a second run does not open another."""
    today = ist_today().isoformat()
    open_class = None
    for token in ctx.teacher_tokens.values():
        for occurrence in ctx.api.read("/faculty/daily-schedule", token, params={"target_date": today}):
            if occurrence["is_attendance_locked"]:
                return None
            if open_class is None and occurrence["status"] != "CANCELLED":
                open_class = (token, occurrence)
    return open_class


def run(ctx: Ctx) -> None:
    api = ctx.api
    section("Today's class")
    picked = _pick_class(ctx)
    if not picked:
        api.skip("no open class today (weekend, or today's classes are already closed)")
        return
    token, occurrence = picked
    code = _class_of(ctx, occurrence["course_section_id"])
    roster = [s for s in data.CLASSES[code][4] if s["enrollment"] in ctx.student_tokens] if code else []
    if not roster:
        api.skip("no signed-in students in today's class")
        return
    occ = f"/faculty/occurrences/{occurrence['id']}"
    api.act(f"{occurrence['course_name']} ({code}) opened for attendance", "POST", f"{occ}/start", token)

    scanning = roster[: max(1, len(roster) * 3 // 4)]
    for student in scanning:
        _scan(ctx, token, occurrence["id"], student["enrollment"], f"{student['first']} scans the QR")
    late_student = roster[-1]
    api.expect_rejection(
        f"{late_student['first']} scans from outside campus", "POST", "/student/smart-pass/scan", 400,
        ctx.student_tokens[late_student["enrollment"]],
        json={"qr_token": _qr(ctx, token, occurrence["id"]), "device_uuid": device_for(late_student["enrollment"]), **OUTSIDE_CAMPUS},
    )
    _scan(ctx, token, occurrence["id"], scanning[0]["enrollment"], "repeat scan returns the original mark")
    _wrong_class_scan(ctx, token, occurrence["id"], code)
    api.read(f"{occ}/register", token)
    api.act("class closed", "POST", f"{occ}/stop", token)
    _correct_after_close(ctx, token, occurrence["id"], late_student)


def _qr(ctx: Ctx, token: str, occurrence_id: str) -> str:
    return ctx.api.read(f"/faculty/occurrences/{occurrence_id}/qr", token)["qr_token"]


def _scan(ctx: Ctx, token: str, occurrence_id: str, enrollment: str, label: str) -> None:
    ctx.api.act(
        label, "POST", "/student/smart-pass/scan", ctx.student_tokens[enrollment],
        json={
            "qr_token": _qr(ctx, token, occurrence_id), "latitude": data.CAMPUS["campusLatitude"],
            "longitude": data.CAMPUS["campusLongitude"], "accuracy": 12.0, "device_uuid": device_for(enrollment),
        },
    )


def _wrong_class_scan(ctx: Ctx, token: str, occurrence_id: str, code: str | None) -> None:
    outsider = next(
        (s for key, entry in data.CLASSES.items() if key != code for s in entry[4] if s["enrollment"] in ctx.student_tokens),
        None,
    )
    if not outsider:
        return
    ctx.api.expect_rejection(
        f"{outsider['first']} scans another class's QR", "POST", "/student/smart-pass/scan", 403,
        ctx.student_tokens[outsider["enrollment"]],
        json={
            "qr_token": _qr(ctx, token, occurrence_id), "latitude": data.CAMPUS["campusLatitude"],
            "longitude": data.CAMPUS["campusLongitude"], "accuracy": 12.0, "device_uuid": device_for(outsider["enrollment"]),
        },
    )


def _correct_after_close(ctx: Ctx, token: str, occurrence_id: str, student: dict) -> None:
    api = ctx.api
    register = api.read(f"/faculty/occurrences/{occurrence_id}/register", token)
    student_id = ctx.students[student["enrollment"]].id
    row = next(s for s in register["students"] if s["student_id"] == student_id)
    if row["status"] != "ABSENT":
        return
    update = [{"student_id": student_id, "status": "LATE", "remarks": "Arrived after the QR window closed"}]
    api.expect_rejection(
        "closed register refuses a change without a reason", "PUT", f"/faculty/occurrences/{occurrence_id}/register", 409, token,
        json={"occurrence_id": occurrence_id, "updates": update},
    )
    api.act(
        f"{student['first']} marked late, with a reason", "PUT", f"/faculty/occurrences/{occurrence_id}/register", token,
        json={"occurrence_id": occurrence_id, "updates": update, "reason": "Student reached the room after the QR window closed; seen by the teacher"},
    )
