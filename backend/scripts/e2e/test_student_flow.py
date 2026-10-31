"""E2E Test Flow: Student profile, attendance, leaves, and gamification."""

from datetime import date, timedelta
from typing import Any, Dict
from .e2e_client import E2EClient


async def test_student_flow(client: E2EClient, context: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- [E2E] 4. STUDENT USER FLOW ---")
    student_email = "aarav.sharma@yopmail.com"
    student_pass = "Student@Secure123!"
    device_uuid = "dev-hw-uuid-oneplus12r-in-99"

    # 1. Login with hardware device uuid
    login_payload = {
        "email": student_email,
        "password": student_pass,
        "device_uuid": device_uuid,
    }
    res = await client.client.post("/auth/login", json=login_payload)
    assert res.status_code == 200, f"Student login failed: {res.text}"
    token_data = res.json()
    assert token_data["role"] == "STUDENT", f"Expected STUDENT, got {token_data['role']}"
    client.set_auth(token_data["access_token"], token_data.get("tenant_id"))
    print(f"  ✓ Student logged in: {student_email}")

    # 2. Verify /auth/me
    me_res = await client.get("/auth/me")
    assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
    me_data = me_res.json()
    assert me_data["student_profile"] is not None
    assert me_data["student_profile"]["enrollment_number"] == "2024BCSE001"
    print(f"  ✓ Student profile verified: {me_data['student_profile']['enrollment_number']} ({me_data['student_profile']['branch']})")

    # 3. Check Enrolled Classes & SmartPass
    classes_res = await client.get("/student/classes")
    assert classes_res.status_code == 200, f"Classes failed: {classes_res.text}"
    print(f"  ✓ Student enrolled classes retrieved ({len(classes_res.json())} classes)")

    smart_pass_res = await client.get("/student/smart-pass")
    assert smart_pass_res.status_code == 200, f"SmartPass failed: {smart_pass_res.text}"
    print(f"  ✓ Student SmartPass active: Code {smart_pass_res.json().get('pass_code', 'N/A')}")

    # 4. Submit Academic Leave Request (Form data)
    today = date.today()
    leave_data = {
        "start_date": (today + timedelta(days=10)).isoformat(),
        "end_date": (today + timedelta(days=12)).isoformat(),
        "reason": "Attending International ACM ICPC Regional Contest.",
    }
    leave_res = await client.client.post(
        "/student/leaves",
        data=leave_data,
        headers={"Authorization": f"Bearer {client.token}", "X-Tenant-ID": client.tenant_id or ""},
    )
    assert leave_res.status_code in [200, 201], f"Leave submission failed: {leave_res.text}"
    created_leave = leave_res.json()
    print(f"  ✓ Student leave request created: ID {created_leave.get('id', 'N/A')}")

    # 5. Gamification: Leaderboard & Stats
    leaderboard_res = await client.get("/student/leaderboard")
    assert leaderboard_res.status_code == 200, f"Leaderboard failed: {leaderboard_res.text}"
    stats_res = await client.get("/student/stats")
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    print("  ✓ Gamification metrics & attendance score loaded")

    # 6. Student Attendance History
    history_res = await client.get("/student/my-attendance")
    assert history_res.status_code == 200, f"Attendance history failed: {history_res.text}"
    print("  ✓ Student personal attendance timeline verified")

    return {"leave_id": created_leave.get("id")}
