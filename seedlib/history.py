"""Four weeks of past classes: each teacher takes the register and closes it, as they would after the lecture."""
import random
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from seedlib import data
from seedlib.classes import history_start
from seedlib.client import section
from seedlib.context import Ctx

CHUNK_DAYS = 14  # the API allows at most 31 days per schedule request
# attendance profile -> (chance present, chance late); the rest are absent
PROFILES = {"high": (0.95, 0.03), "mid": (0.82, 0.06), "low": (0.60, 0.05)}


def ist_today() -> date:
    return datetime.now(ZoneInfo("Asia/Kolkata")).date()


def _status(rng: random.Random, profile: str) -> str:
    present, late = PROFILES[profile]
    roll = rng.random()
    if roll < present:
        return "PRESENT"
    return "LATE" if roll < present + late else "ABSENT"


def _profiles() -> dict[str, str]:
    return {s["enrollment"]: s["attendance"] for entry in data.CLASSES.values() for s in entry[4]}


def _past_occurrences(ctx: Ctx, token: str, first: date, last: date) -> list[dict]:
    found: list[dict] = []
    day = first
    while day <= last:
        end = min(day + timedelta(days=CHUNK_DAYS - 1), last)
        found += ctx.api.read("/faculty/daily-schedule", token, params={"target_date": day.isoformat(), "end_date": end.isoformat()})
        day = end + timedelta(days=1)
    return found


def _take_register(ctx: Ctx, token: str, occurrence: dict, rng: random.Random, profiles: dict[str, str]) -> bool:
    api = ctx.api
    register = api.read(f"/faculty/occurrences/{occurrence['id']}/register", token)
    updates = [
        {"student_id": s["student_id"], "status": _status(rng, profiles[s["enrollment_number"]])}
        for s in register["students"]
    ]
    saved = api.act("register", "PUT", f"/faculty/occurrences/{occurrence['id']}/register", token, quiet=True,
                    json={"occurrence_id": occurrence["id"], "updates": updates})
    closed = api.act("close", "POST", f"/faculty/occurrences/{occurrence['id']}/stop", token, quiet=True)
    return bool(saved and closed)


def past_classes(ctx: Ctx) -> None:
    section("Attendance history")
    today = ist_today()
    first, last = history_start(today), today - timedelta(days=1)
    rng, profiles = random.Random(2026), _profiles()
    for employee_id, token in ctx.teacher_tokens.items():
        occurrences = _past_occurrences(ctx, token, first, last)
        open_ones = [o for o in occurrences if not o["is_attendance_locked"] and o["status"] != "CANCELLED"]
        done = sum(_take_register(ctx, token, o, rng, profiles) for o in open_ones)
        teacher = ctx.teachers[employee_id].email.split(".")[0].title()
        if open_ones:
            ctx.api.note(f"{teacher}: {done} of {len(open_ones)} past classes registered and closed")
        for _ in range(len(occurrences) - len(open_ones)):
            ctx.api.tally.skipped += 1
