"""Signs that marks may be shared or proxied. They are leads for a person to check, never proof."""
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field

from app.db.client import db
from app.services.agent.tools.common import ADMIN_ONLY, capped, table
from app.services.agent.types import Principal, Tool, ToolResult

REPEAT_DEVICE_REQUESTS = 2
TOP_FLAGGED = 10


class WatchArgs(BaseModel):
    days: int = Field(30, ge=7, le=90, description="Look back this many days.")


def _name(student) -> str:
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or student.enrollmentNumber


async def _students(tenant_id: str, ids: list[str]) -> dict:
    found = await db.student.find_many(where={"tenantId": tenant_id, "id": {"in": ids}})
    return {s.id: s for s in found}


async def _shared_phones(tenant_id: str) -> list[dict]:
    groups = await db.student.group_by(by=["deviceUuid"], count=True, where={"tenantId": tenant_id, "deviceUuid": {"not": None}})
    shared = [g["deviceUuid"] for g in groups if g["_count"]["_all"] > 1]
    if not shared:
        return []
    students = await db.student.find_many(where={"tenantId": tenant_id, "deviceUuid": {"in": shared}})
    return [{"phone": f"phone {index}", "students": [_name(s) for s in students if s.deviceUuid == device]}
            for index, device in enumerate(shared, start=1)]


async def _repeat_requests(tenant_id: str, since: datetime) -> list[dict]:
    groups = await db.devicechangerequest.group_by(by=["studentId"], count=True, where={"tenantId": tenant_id, "createdAt": {"gte": since}})
    repeat = {g["studentId"]: g["_count"]["_all"] for g in groups if g["_count"]["_all"] >= REPEAT_DEVICE_REQUESTS}
    people = await _students(tenant_id, list(repeat))
    return [{"student": _name(people[i]), "roll": people[i].enrollmentNumber, "requests": n} for i, n in repeat.items() if i in people]


async def _most_flagged(tenant_id: str, since: datetime) -> list[dict]:
    groups = await db.attendancerecord.group_by(
        by=["studentId"], count=True, where={"tenantId": tenant_id, "status": "FLAGGED", "verifiedAt": {"gte": since}}
    )
    top = sorted(groups, key=lambda g: -g["_count"]["_all"])[:TOP_FLAGGED]
    people = await _students(tenant_id, [g["studentId"] for g in top])
    return [{"student": _name(people[g["studentId"]]), "roll": people[g["studentId"]].enrollmentNumber, "flagged_marks": g["_count"]["_all"]}
            for g in top if g["studentId"] in people]


async def proxy_watch(principal: Principal, args: WatchArgs) -> ToolResult:
    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    phones = await _shared_phones(principal.tenant_id)
    repeats = await _repeat_requests(principal.tenant_id, since)
    flagged = await _most_flagged(principal.tenant_id, since)
    ui = []
    if phones:
        ui.append(table("One phone, several students", ["Phone", "Students"], [[p["phone"], ", ".join(p["students"])] for p in phones]))
    if repeats:
        ui.append(table(f"Repeated new-phone requests ({args.days} days)", ["Student", "Roll", "Requests"], [[r["student"], r["roll"], r["requests"]] for r in repeats]))
    if flagged:
        ui.append(table(f"Most flagged marks ({args.days} days)", ["Student", "Roll", "Flagged"], [[f["student"], f["roll"], f["flagged_marks"]] for f in flagged]))
    data = {"shared_phones": capped(phones), "repeated_device_requests": capped(repeats), "most_flagged": capped(flagged),
            "note": "These are leads for a person to check. They do not prove anyone marked for someone else."}
    return ToolResult(data, ui)


TOOLS = [
    Tool("proxy_watch", "Signs that attendance may be shared: several students on one phone, repeated new-phone requests, "
         "and students with the most flagged marks. Leads only, not proof.", WatchArgs, ADMIN_ONLY, proxy_watch),
]
