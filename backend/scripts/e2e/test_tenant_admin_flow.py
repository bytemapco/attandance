"""E2E Test Flow: Institutional / Tenant Admin operations."""

from typing import Any, Dict
from .e2e_client import E2EClient


async def test_tenant_admin_flow(client: E2EClient, tenant_info: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- [E2E] 2. INSTITUTIONAL ADMIN FLOW ---")
    admin_email = "aravind.admin.iitb@yopmail.com"
    admin_pass = "Admin@IITB2026!"

    # 1. Login
    login_data = await client.login(admin_email, admin_pass)
    assert login_data["role"] == "ADMIN", f"Role must be ADMIN, got {login_data['role']}"
    print(f"  ✓ Institutional Admin logged in: {admin_email}")

    # 2. Verify /auth/me
    me_res = await client.get("/auth/me")
    assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
    assert me_res.json()["role"] == "ADMIN"
    print("  ✓ /auth/me verified for Institutional Admin")

    # 3. Master Data Inspection
    depts_res = await client.get("/admin/departments")
    assert depts_res.status_code == 200, f"Depts failed: {depts_res.text}"
    depts = depts_res.json()
    assert len(depts) >= 1, "Expected departments to exist"

    desigs_res = await client.get("/admin/designations")
    assert desigs_res.status_code == 200, f"Designations failed: {desigs_res.text}"

    rooms_res = await client.get("/admin/classrooms")
    assert rooms_res.status_code == 200, f"Rooms failed: {rooms_res.text}"

    subjects_res = await client.get("/admin/subjects")
    assert subjects_res.status_code == 200, f"Subjects failed: {subjects_res.text}"
    print(f"  ✓ Master data verified: {len(depts)} depts, {len(rooms_res.json())} rooms, {len(subjects_res.json())} subjects")

    # 4. Teachers & Students Lists
    teachers_res = await client.get("/admin/users/teachers")
    assert teachers_res.status_code == 200, f"Teachers failed: {teachers_res.text}"
    teachers_data = teachers_res.json()
    teachers = teachers_data.get("items", teachers_data) if isinstance(teachers_data, dict) else teachers_data
    assert len(teachers) >= 1, "Expected teachers to exist"

    students_res = await client.get("/admin/users/students")
    assert students_res.status_code == 200, f"Students failed: {students_res.text}"
    students_data = students_res.json()
    students = students_data.get("items", students_data) if isinstance(students_data, dict) else students_data
    assert len(students) >= 1, "Expected students to exist"
    print(f"  ✓ User directories verified: {len(teachers)} teachers, {len(students)} students")

    # 5. Academic Classes
    classes_res = await client.get("/admin/classes")
    assert classes_res.status_code == 200, f"Classes failed: {classes_res.text}"
    classes_data = classes_res.json()
    classes = classes_data.get("items", classes_data) if isinstance(classes_data, dict) else classes_data
    assert len(classes) >= 1, "Expected academic classes to exist"
    primary_class_id = classes[0]["id"]
    print(f"  ✓ Academic classes verified: {len(classes)} classes found (Sample: {classes[0]['name']})")

    # 6. Admin System Stats
    stats_res = await client.get("/admin/stats")
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    print("  ✓ Admin system telemetry & metrics accessible")

    return {
        "class_id": primary_class_id,
        "teacher_id": teachers[0]["id"],
        "student_id": students[0]["id"],
    }
