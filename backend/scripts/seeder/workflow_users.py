"""Faculty, Student, Academic Class, and Enrollment Workflows."""

from typing import Any, Dict, List
from app.core.logging_config import get_logger
from .client import APIClient

logger = get_logger("app.seeder.users")


async def seed_teachers(
    client: APIClient,
    teachers: List[Dict[str, Any]],
    dept_map: Dict[str, str],
    desig_map: Dict[str, str],
) -> Dict[str, Dict[str, Any]]:
    """Ingest Faculty profiles via Admin Bulk Import API and return map."""
    resp = await client.get("/admin/users/teachers?page=1&page_size=100")
    existing_by_email = {t["email"]: t for t in resp.get("items", [])}

    items_to_create = []
    for t in teachers:
        if t["email"] not in existing_by_email:
            items_to_create.append(
                {
                    "email": t["email"],
                    "employee_id": t["employee_id"],
                    "first_name": t["first_name"],
                    "last_name": t["last_name"],
                    "name_initials": t.get("name_initials"),
                    "department_id": dept_map.get(t["department_code"]),
                    "designation_id": desig_map.get(t["designation_code"]),
                    "phone": t.get("phone"),
                    "password": t["password"],
                }
            )

    if items_to_create:
        payload = {"teachers": items_to_create, "send_invite": False}
        await client.post("/admin/users/teachers/bulk", json_data=payload)
        resp = await client.get("/admin/users/teachers?page=1&page_size=100")
        existing_by_email = {t["email"]: t for t in resp.get("items", [])}

    logger.info("Configured %d teachers", len(existing_by_email))
    return existing_by_email


async def seed_students(
    client: APIClient,
    students: List[Dict[str, Any]],
    dept_map: Dict[str, str],
) -> Dict[str, Dict[str, Any]]:
    """Ingest Student profiles via Admin Bulk Import API and return map."""
    resp = await client.get("/admin/users/students?page=1&page_size=100")
    existing_by_email = {s["email"]: s for t in [resp.get("items", [])] for s in t}

    items_to_create = []
    for s in students:
        if s["email"] not in existing_by_email:
            items_to_create.append(
                {
                    "email": s["email"],
                    "enrollment_number": s["enrollment_number"],
                    "first_name": s["first_name"],
                    "last_name": s["last_name"],
                    "department_id": dept_map.get(s["department_code"]),
                    "branch": s.get("branch", "CSE"),
                    "gender": s.get("gender", "Male"),
                    "semester": s.get("semester", 4),
                    "batch": s.get("batch", "2022-2026"),
                    "phone": s.get("phone"),
                    "password": s["password"],
                }
            )

    if items_to_create:
        payload = {"students": items_to_create, "send_invite": False}
        await client.post("/admin/users/students/bulk", json_data=payload)
        resp = await client.get("/admin/users/students?page=1&page_size=100")
        existing_by_email = {s["email"]: s for t in [resp.get("items", [])] for s in t}

    logger.info("Configured %d students", len(existing_by_email))
    return existing_by_email


async def seed_classes(
    client: APIClient,
    teacher_map: Dict[str, Dict[str, Any]],
    subject_map: Dict[str, str],
    room_map: Dict[str, str],
) -> Dict[str, Dict[str, Any]]:
    """Create Academic Classes via Admin API and return name->class map."""
    resp = await client.get("/admin/classes?page=1&page_size=50")
    existing_by_name = {c["name"]: c for c in resp.get("items", [])}

    target_classes = [
        {
            "name": "CS201-DivA (Data Structures)",
            "subject_id": subject_map.get("CS201"),
            "teacher_id": teacher_map.get("rajesh.kulkarni@yopmail.com", {}).get("id"),
            "classroom_id": room_map.get("Aryabhata Lecture Theatre 101"),
            "semester": 4,
            "batch": "2022-2026",
        },
        {
            "name": "CS202-DivA (DBMS)",
            "subject_id": subject_map.get("CS202"),
            "teacher_id": teacher_map.get("sunita.deshmukh@yopmail.com", {}).get("id"),
            "classroom_id": room_map.get("Turing Computing Lab 301"),
            "semester": 4,
            "batch": "2022-2026",
        },
        {
            "name": "AI301-DivA (Machine Learning)",
            "subject_id": subject_map.get("AI301"),
            "teacher_id": teacher_map.get("anand.verma@yopmail.com", {}).get("id"),
            "classroom_id": room_map.get("Kalam Advanced AI Lab 405"),
            "semester": 4,
            "batch": "2022-2026",
        },
        {
            "name": "IT302-DivA (Networks)",
            "subject_id": subject_map.get("IT302"),
            "teacher_id": teacher_map.get("priya.nambiar@yopmail.com", {}).get("id"),
            "classroom_id": room_map.get("CV Raman Seminar Hall 202"),
            "semester": 4,
            "batch": "2022-2026",
        },
    ]

    for item in target_classes:
        if item["name"] not in existing_by_name and item["subject_id"] and item["teacher_id"]:
            res = await client.post("/admin/classes", json_data=item)
            existing_by_name[item["name"]] = res

    logger.info("Configured %d academic classes", len(existing_by_name))
    return existing_by_name


async def enroll_students_in_classes(
    client: APIClient,
    class_map: Dict[str, Dict[str, Any]],
    student_map: Dict[str, Dict[str, Any]],
) -> None:
    """Enroll students into appropriate academic classes based on their branches."""
    cse_ids = [
        s["id"] for email, s in student_map.items() if s.get("branch") == "CSE" or "BCSE" in s.get("enrollment_number", "")
    ]
    aids_ids = [
        s["id"] for email, s in student_map.items() if s.get("branch") == "AIDS" or "BAID" in s.get("enrollment_number", "")
    ]
    it_ids = [
        s["id"] for email, s in student_map.items() if s.get("branch") == "IT" or "BIT" in s.get("enrollment_number", "")
    ]

    enrollment_plans = [
        ("CS201-DivA (Data Structures)", cse_ids),
        ("CS202-DivA (DBMS)", cse_ids),
        ("AI301-DivA (Machine Learning)", aids_ids),
        ("IT302-DivA (Networks)", it_ids),
    ]

    for class_name, student_ids in enrollment_plans:
        c = class_map.get(class_name)
        if c and student_ids:
            class_id = c["id"]
            await client.post(f"/admin/classes/{class_id}/enroll", json_data={"student_ids": student_ids})
            logger.info("Enrolled %d students into '%s'", len(student_ids), class_name)
