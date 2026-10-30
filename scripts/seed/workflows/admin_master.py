from typing import Any
from scripts.seed.client import ApiClient
from scripts.seed.data_generator import (
    DEPARTMENTS,
    DESIGNATIONS,
    SUBJECTS,
    CLASSROOMS,
)


async def setup_master_data(client: ApiClient, tenant_id: str) -> dict[str, Any]:
    print("    [Admin] Ingesting master academic setup (Departments, Designations, Subjects, Classrooms)...")
    existing_depts = await client.get("/admin/departments")
    dept_map = {d["code"]: d["id"] for d in existing_depts}
    missing_depts = [d for d in DEPARTMENTS if d["code"] not in dept_map]
    if missing_depts:
        await client.post("/admin/departments/bulk", json={"departments": missing_depts})
        existing_depts = await client.get("/admin/departments")
        dept_map = {d["code"]: d["id"] for d in existing_depts}

    existing_desigs = await client.get("/admin/designations")
    desig_map = {d["code"]: d["id"] for d in existing_desigs}
    missing_desigs = [d for d in DESIGNATIONS if d["code"] not in desig_map]
    if missing_desigs:
        await client.post("/admin/designations/bulk", json={"designations": missing_desigs})
        existing_desigs = await client.get("/admin/designations")
        desig_map = {d["code"]: d["id"] for d in existing_desigs}

    existing_subjects = await client.get("/admin/subjects")
    subject_map = {s["code"]: s["id"] for s in existing_subjects}
    missing_subjects = []
    for s in SUBJECTS:
        if s["code"] not in subject_map:
            missing_subjects.append({
                "name": s["name"],
                "code": s["code"],
                "department_id": dept_map.get(s["dept_code"], list(dept_map.values())[0]),
            })
    if missing_subjects:
        await client.post("/admin/subjects/bulk", json={"subjects": missing_subjects})
        existing_subjects = await client.get("/admin/subjects")
        subject_map = {s["code"]: s["id"] for s in existing_subjects}

    existing_rooms = await client.get("/admin/classrooms")
    room_map = {r["name"]: r["id"] for r in existing_rooms}
    missing_rooms = [r for r in CLASSROOMS if r["name"] not in room_map]
    if missing_rooms:
        await client.post("/admin/classrooms/bulk", json={"classrooms": missing_rooms})
        existing_rooms = await client.get("/admin/classrooms")
        room_map = {r["name"]: r["id"] for r in existing_rooms}

    return {"depts": dept_map, "desigs": desig_map, "subjects": subject_map, "rooms": room_map}
