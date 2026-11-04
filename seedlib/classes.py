"""Classes (a batch in a semester), their subjects and teachers, and the weekly timetable."""
from datetime import date, timedelta

from seedlib import data
from seedlib.client import section
from seedlib.context import Ctx
from seedlib.timetable_data import PERIODS, SLOTS

HISTORY_WEEKS = 4


def history_start(today: date) -> date:
    """Monday of the week HISTORY_WEEKS ago: the first day classes ran."""
    return today - timedelta(days=today.weekday() + 7 * HISTORY_WEEKS)


def classes_and_sections(ctx: Ctx) -> None:
    api, token = ctx.api, ctx.admin_token
    section("Classes")
    base = "/admin/class-management/classes"
    existing = {c["batch"]: c["id"] for c in api.read(base, token)}
    for code, (dept, _letter, semester, _room, roster) in data.CLASSES.items():
        if code in existing:
            api.skip(f"class {code}")
        else:
            created = api.act(
                f"class {code} (semester {semester}, {len(roster)} students)", "POST", base, token,
                json={
                    "department_id": ctx.departments[dept], "batch_id": ctx.batches[code], "semester_number": semester,
                    "student_ids": [ctx.students[s["enrollment"]].id for s in roster],
                },
            )
            if created:
                existing[code] = created["id"]
        ctx.classes[code] = existing.get(code, "")
    for code, class_id in ctx.classes.items():
        _sections_for(ctx, code, class_id)


def _sections_for(ctx: Ctx, code: str, class_id: str) -> None:
    api, token = ctx.api, ctx.admin_token
    detail = api.read(f"/admin/class-management/classes/{class_id}", token)
    have = {s["subject_code"]: s["id"] for s in detail["sections"]}
    room_id = ctx.rooms[data.CLASSES[code][3]]
    for subject_code in dict.fromkeys(s for s, _d, _p in SLOTS[code]):
        if subject_code in have:
            ctx.sections[(code, subject_code)] = have[subject_code]
            api.skip(f"{code} {subject_code}")
            continue
        teacher = ctx.teachers[data.SUBJECT_TEACHER[subject_code]]
        api.act(
            f"{code}: {subject_code} taught by {teacher.email.split('.')[0].title()}", "POST",
            f"/admin/class-management/classes/{class_id}/sections", token,
            json={"subject_id": ctx.subjects[subject_code], "primary_teacher_id": teacher.id, "default_room_id": room_id},
        )
    detail = api.read(f"/admin/class-management/classes/{class_id}", token)
    for s in detail["sections"]:
        ctx.sections[(code, s["subject_code"])] = s["id"]


def weekly_timetable(ctx: Ctx) -> None:
    """Rules start on the first day of term so that past weeks have classes too."""
    api, token = ctx.api, ctx.admin_token
    section("Timetable")
    start = history_start(date.today()).isoformat()
    have = {(r["course_section_id"], r["day_of_week"], r["start_time"]) for r in api.read("/timetable/rules", token)}
    for code, slots in SLOTS.items():
        room_id = ctx.rooms[data.CLASSES[code][3]]
        for subject_code, day, period in slots:
            section_id = ctx.sections[(code, subject_code)]
            begin, end = PERIODS[period]
            if (section_id, day, begin) in have:
                api.skip(f"{code} {subject_code} day {day} {begin}")
                continue
            teacher = ctx.teachers[data.SUBJECT_TEACHER[subject_code]]
            api.act(
                f"{code} {subject_code}: day {day} {begin}-{end}", "POST", "/timetable/rules", token,
                json={
                    "course_section_id": section_id, "day_of_week": day, "start_time": begin, "end_time": end,
                    "classroom_id": room_id, "teacher_id": teacher.id, "effective_from": start,
                },
            )
    api.read("/timetable/sections", token)


def schedule_rules(ctx: Ctx) -> None:
    """The class screen's own schedule checks: a clash is refused, a free slot is added and removed again."""
    if not ctx.fresh:
        return
    api, token = ctx.api, ctx.admin_token
    section("Schedule checks")
    cse_b, cse_a = ctx.classes["CSE-B-1"], ctx.classes["CSE-A-1"]
    clash = ctx.sections[("CSE-B-1", "CS201")]
    api.expect_rejection(
        "Data Structures for CSE-B on Monday 09:00 (teacher already teaching CSE-A)", "POST",
        f"/admin/class-management/classes/{cse_b}/sections/{clash}/schedule", 409, token,
        json={"day_of_week": 1, "start_time": "09:00", "end_time": "09:55"},
    )
    api.expect_rejection(
        "Saturday class while Saturday is off", "POST",
        f"/admin/class-management/classes/{cse_a}/sections/{ctx.sections[('CSE-A-1', 'CS203')]}/schedule", 400, token,
        json={"day_of_week": 6, "start_time": "09:00", "end_time": "09:55"},
    )
    section_id = ctx.sections[("CSE-A-1", "CS203")]
    path = f"/admin/class-management/classes/{cse_a}/sections/{section_id}"
    detail = api.act("remedial DBMS slot, Wednesday 14:00", "POST", f"{path}/schedule", token,
                     json={"day_of_week": 3, "start_time": "14:00", "end_time": "14:55"})
    slot = next((r for s in (detail or {}).get("sections", []) if s["id"] == section_id
                 for r in s["schedule"] if r["day_of_week"] == 3 and r["start_time"] == "14:00"), None)
    if slot:
        api.act("drop the remedial slot", "DELETE", f"{path}/schedule/{slot['id']}", token)
    teacher = ctx.teachers[data.SUBJECT_TEACHER["CS203"]]
    api.act("confirm DBMS teacher for CSE-A", "PUT", path, token, json={"primary_teacher_id": teacher.id})
    api.act("confirm CSE-A semester", "PATCH", f"/admin/class-management/classes/{cse_a}", token, json={"semester_number": 3})
    api.read("/admin/class-management/classes", token, params={"semester_number": 3})
