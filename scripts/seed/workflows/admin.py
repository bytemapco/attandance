from typing import Any
from scripts.seed.client import ApiClient
from scripts.seed.data_generator import generate_person
from scripts.seed.workflows.admin_master import setup_master_data


async def login_tenant_admin(client: ApiClient, email: str, password: str, tenant_id: str) -> str:
    resp = await client.post("/auth/login", json={"email": email, "password": password})
    token = resp["access_token"]
    client.set_auth(token=token, tenant_id=tenant_id)
    return token


async def provision_faculty_and_students(
    client: ApiClient,
    tenant_slug: str,
    master: dict[str, Any],
    teachers_count: int,
    students_count: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    print(f"    [Admin] Provisioning {teachers_count} teachers and {students_count} students...")
    dept_ids = list(master["depts"].values())
    desig_ids = list(master["desigs"].values())

    teachers_payload = []
    for i in range(1, teachers_count + 1):
        person = generate_person("FAC", i, tenant_slug)
        emp_id = f"EMP{tenant_slug[:3].upper()}{i:03d}"
        teachers_payload.append({
            "email": person["email"],
            "employee_id": emp_id,
            "first_name": person["first_name"],
            "last_name": person["last_name"],
            "name_initials": f"{person['first_name'][0]}{person['last_name'][0]}".lower(),
            "department_id": dept_ids[i % len(dept_ids)],
            "designation_id": desig_ids[i % len(desig_ids)],
            "phone": person["phone"],
            "password": "Teacher@123456",
        })

    existing_teachers_resp = await client.get("/admin/users/teachers?page_size=100")
    existing_teacher_emails = {t["email"]: t for t in existing_teachers_resp.get("items", [])}
    new_teachers = [t for t in teachers_payload if t["email"] not in existing_teacher_emails]
    if new_teachers:
        await client.post("/admin/users/teachers/bulk", json={"teachers": new_teachers, "send_invite": False})

    teacher_records = await client.get(f"/admin/users/teachers?page_size={max(100, teachers_count)}")
    created_teachers = [
        {
            "id": t["id"],
            "email": t["email"],
            "first_name": t["first_name"],
            "last_name": t["last_name"],
            "password": "Teacher@123456",
        }
        for t in teacher_records.get("items", [])
    ]

    students_payload = []
    branches = ["CE", "IT", "AIDS", "EXTC"]
    for i in range(1, students_count + 1):
        person = generate_person("STU", i, tenant_slug)
        enrollment = f"ENR{tenant_slug[:3].upper()}{i:04d}"
        semester = (i % 8) + 1
        students_payload.append({
            "email": person["email"],
            "enrollment_number": enrollment,
            "first_name": person["first_name"],
            "last_name": person["last_name"],
            "department_id": dept_ids[i % len(dept_ids)],
            "gender": person["gender"],
            "branch": branches[i % len(branches)],
            "semester": semester,
            "batch": "2023-2027" if semester > 4 else "2024-2028",
            "phone": person["phone"],
            "password": "Student@123456",
        })

    existing_students_resp = await client.get("/admin/users/students?page_size=200")
    existing_student_emails = {s["email"]: s for s in existing_students_resp.get("items", [])}
    new_students = [s for s in students_payload if s["email"] not in existing_student_emails]
    if new_students:
        await client.post("/admin/users/students/bulk", json={"students": new_students, "send_invite": False})

    student_records = await client.get(f"/admin/users/students?page_size={max(200, students_count)}")
    created_students = [
        {
            "id": s["id"],
            "email": s["email"],
            "enrollment_number": s["enrollment_number"],
            "first_name": s["first_name"],
            "last_name": s["last_name"],
            "semester": s.get("semester", 1),
            "password": "Student@123456",
        }
        for s in student_records.get("items", [])
    ]

    return created_teachers, created_students


async def setup_classes_and_enrollments(
    client: ApiClient,
    classes_count: int,
    teachers: list[dict[str, Any]],
    students: list[dict[str, Any]],
    master: dict[str, Any],
) -> list[dict[str, Any]]:
    print(f"    [Admin] Creating {classes_count} academic classes and enrolling cohorts...")
    subject_codes = list(master["subjects"].keys())
    room_names = list(master["rooms"].keys())
    classes_payload = []

    for idx in range(classes_count):
        sub_code = subject_codes[idx % len(subject_codes)]
        teacher = teachers[idx % len(teachers)]
        room_name = room_names[idx % len(room_names)]
        sem = (idx % 8) + 1
        classes_payload.append({
            "name": f"{sub_code}-Division-{chr(65 + idx % 3)}",
            "subject_code": sub_code,
            "teacher_email": teacher["email"],
            "classroom_name": room_name,
            "semester": sem,
            "batch": "2023-2027" if sem > 4 else "2024-2028",
        })

    existing_classes = await client.get("/admin/classes?page_size=100")
    existing_names = {c["name"] for c in existing_classes.get("items", [])}
    new_classes = [c for c in classes_payload if c["name"] not in existing_names]
    if new_classes:
        await client.post("/admin/classes/bulk", json={"classes": new_classes})
        existing_classes = await client.get("/admin/classes?page_size=100")

    created_classes = existing_classes.get("items", [])
    for cls in created_classes:
        class_id = cls["id"]
        class_sem = cls.get("semester") or 1
        enrolled_candidates = [s["id"] for s in students if s.get("id") and s.get("semester") == class_sem]
        if not enrolled_candidates:
            enrolled_candidates = [s["id"] for s in students[:20] if s.get("id")]
        if enrolled_candidates:
            try:
                await client.post(f"/admin/classes/{class_id}/enroll", json={"student_ids": enrolled_candidates[:25]})
            except Exception:
                pass

    return created_classes
