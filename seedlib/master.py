"""Institution setup done by the college admin: settings and master data."""
from typing import Any

from seedlib import data
from seedlib.bulk import bulk_import
from seedlib.client import section
from seedlib.context import Ctx


def configure(ctx: Ctx) -> None:
    api, token = ctx.api, ctx.admin_token
    section("Institution settings")
    api.read("/admin/setup-status", token)
    current = api.read("/admin/config", token)
    if current["campusLatitude"] == data.CAMPUS["campusLatitude"]:
        api.skip("attendance settings")
    else:
        api.act(
            "set campus location and attendance rules", "PATCH", "/admin/config", token,
            json={**data.CAMPUS, "minAttendancePct": 75.0, "verificationWindowMin": 20, "saturdayEnabled": False},
        )


def _ensure(ctx: Ctx, label: str, list_path: str, key: str, rows: list[dict[str, Any]], bulk_count: int, bulk_key: str) -> dict[str, str]:
    """Creates the rows that are missing (the first `bulk_count` in one import, the rest one by one); returns key -> id."""
    api, token = ctx.api, ctx.admin_token
    known = {item[key] for item in api.read(list_path, token)}
    missing = [row for row in rows if row[key] not in known]
    for _ in range(len(rows) - len(missing)):
        api.skip(label)
    bulk_rows = [row for row in missing if rows.index(row) < bulk_count]
    bulk_import(api, label, f"{list_path}/bulk", token, bulk_key, bulk_rows)
    for row in missing:
        if row not in bulk_rows:
            api.act(f"{label} {row[key]}", "POST", list_path, token, json=row)
    return {item[key]: item["id"] for item in api.read(list_path, token)}


def master_data(ctx: Ctx) -> None:
    section("Master data")
    departments = [{"name": n, "code": c, "head": h, "description": d} for n, c, h, d in data.DEPARTMENTS]
    ctx.departments = _ensure(ctx, "department", "/admin/departments", "code", departments, data.BULK_DEPARTMENTS, "departments")
    designations = [{"name": n, "code": c, "description": d} for n, c, d in data.DESIGNATIONS]
    ctx.designations = _ensure(ctx, "designation", "/admin/designations", "code", designations, 3, "designations")
    rooms = [{"name": n, "building": b} for n, b in data.CLASSROOMS]
    ctx.rooms = _ensure(ctx, "classroom", "/admin/classrooms", "name", rooms, data.BULK_CLASSROOMS, "classrooms")
    subjects = [
        {"name": n, "code": c, "department_id": ctx.departments[dept], "description": d}
        for n, c, dept, d in data.SUBJECTS
    ]
    ctx.subjects = _ensure(ctx, "subject", "/admin/subjects", "code", subjects, data.BULK_SUBJECTS, "subjects")


def batches(ctx: Ctx) -> None:
    api, token = ctx.api, ctx.admin_token
    section("Batches")
    existing = {b["code"]: b["id"] for b in api.read("/admin/batches", token)}
    for code, (dept, letter, _semester, _room, _students) in data.CLASSES.items():
        if code in existing:
            api.skip(f"batch {code}")
            continue
        created = api.act(
            f"batch {code}", "POST", f"/admin/departments/{ctx.departments[dept]}/batches", token, json={"section": letter}
        )
        if created:
            existing[created["code"]] = created["id"]
    ctx.batches = existing
    api.read(f"/admin/departments/{ctx.departments['CSE']}/batches", token)


def revisions_and_withdrawals(ctx: Ctx) -> None:
    """Edits and removals a registrar makes in the first weeks. Runs once, when the institution is new."""
    if not ctx.fresh:
        return
    api, token = ctx.api, ctx.admin_token
    section("Master data revisions")
    ce = ctx.departments["CE"]
    api.read(f"/admin/departments/{ce}", token)
    api.act(
        "new head for Civil Engineering", "PUT", f"/admin/departments/{ce}", token,
        json={"head": "Dr. Neelam Ghorpade (Acting)"},
    )
    api.act(
        "rename Seminar Hall building", "PUT", f"/admin/classrooms/{ctx.rooms['Seminar Hall']}", token,
        json={"building": "Central Library, Ground Floor"},
    )
    api.act(
        "refresh Surveying syllabus note", "PUT", f"/admin/subjects/{ctx.subjects['CE202']}", token,
        json={"description": "Levelling, theodolite work, total station and GPS-based surveys."},
    )
    api.act(
        "refresh HOD designation note", "PUT", f"/admin/designations/{ctx.designations['HOD']}", token,
        json={"description": "Leads a department, chairs its board of studies and signs attendance condonation."},
    )
    _withdraw_proposals(ctx)


def _withdraw_proposals(ctx: Ctx) -> None:
    """A department, its batch and a few records are proposed and then withdrawn before any student joins."""
    api, token = ctx.api, ctx.admin_token
    dept = api.act(
        "propose Mining Engineering", "POST", "/admin/departments", token,
        json={"name": "Mining Engineering", "code": "MIN", "head": "To be appointed"},
    )
    if dept:
        batch = api.act("batch for Mining Engineering", "POST", f"/admin/departments/{dept['id']}/batches", token, json={"section": "A"})
        if batch:
            api.act("archive that batch", "PATCH", f"/admin/batches/{batch['id']}", token, json={"status": "ARCHIVED"})
            api.act("delete that batch", "DELETE", f"/admin/batches/{batch['id']}", token)
        api.act("withdraw Mining Engineering", "DELETE", f"/admin/departments/{dept['id']}", token)
    room = api.act("book Workshop Annex", "POST", "/admin/classrooms", token, json={"name": "Workshop Annex", "building": "Mechanical Block"})
    if room:
        api.act("release Workshop Annex", "DELETE", f"/admin/classrooms/{room['id']}", token)
    subject = api.act("propose Mine Ventilation", "POST", "/admin/subjects", token, json={"name": "Mine Ventilation", "code": "MN401"})
    if subject:
        api.act("withdraw Mine Ventilation", "DELETE", f"/admin/subjects/{subject['id']}", token)
    designation = api.act(
        "propose Visiting Faculty", "POST", "/admin/designations", token, json={"name": "Visiting Faculty", "code": "VISIT"}
    )
    if designation:
        api.act("withdraw Visiting Faculty", "DELETE", f"/admin/designations/{designation['id']}", token)
