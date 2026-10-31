"""E2E Test Flow: Faculty / Teacher operations and attendance lifecycle."""

from typing import Any, Dict
from .e2e_client import E2EClient


async def test_teacher_flow(client: E2EClient, context: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- [E2E] 3. TEACHER & ATTENDANCE SESSION FLOW ---")
    teacher_email = "rajesh.kulkarni@yopmail.com"
    teacher_pass = "Teacher@Secure123!"

    # 1. Login
    login_data = await client.login(teacher_email, teacher_pass)
    assert login_data["role"] == "TEACHER", f"Expected TEACHER, got {login_data['role']}"
    print(f"  ✓ Faculty member logged in: {teacher_email}")

    # 2. Verify /auth/me with teacher_profile
    me_res = await client.get("/auth/me")
    assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
    profile = me_res.json()
    assert profile["teacher_profile"] is not None
    assert profile["teacher_profile"]["employee_id"] == "EMP-CSE-001"
    print(f"  ✓ Faculty profile loaded: {profile['teacher_profile']['employee_id']} ({profile['teacher_profile']['department']})")

    # 3. Get My Classes
    classes_res = await client.get("/teacher/my-classes")
    assert classes_res.status_code == 200, f"Failed getting classes: {classes_res.text}"
    my_classes = classes_res.json()
    assert len(my_classes) >= 1, "Expected at least 1 class for this teacher"
    class_id = my_classes[0]["id"]
    print(f"  ✓ Faculty classes verified ({len(my_classes)} assigned classes)")

    # 4. Upsert & Verify Geofence
    geofence_payload = {
        "latitude": 19.0760,
        "longitude": 72.8777,
        "radius_meters": 100.0,
    }
    geo_res = await client.post(f"/teacher/classes/{class_id}/geofence", json=geofence_payload)
    assert geo_res.status_code == 200, f"Upsert geofence failed: {geo_res.text}"
    print(f"  ✓ Geofence boundary configured for class {class_id}")

    # 5. Fetch Class Attendance Analytics & Matrix
    stats_res = await client.get(f"/teacher/classes/{class_id}/stats")
    assert stats_res.status_code == 200, f"Class stats failed: {stats_res.text}"
    matrix_res = await client.get(f"/teacher/classes/{class_id}/matrix")
    assert matrix_res.status_code == 200, f"Class matrix failed: {matrix_res.text}"
    print("  ✓ Class attendance statistics & student matrix computed")

    # 6. Check existing sessions and close any currently active ones for idempotency
    existing_sessions_res = await client.get("/teacher/sessions/all")
    if existing_sessions_res.status_code == 200:
        for s in existing_sessions_res.json():
            if s.get("isActive") and s.get("academicClassId") == class_id:
                await client.post(f"/teacher/sessions/{s['id']}/stop")

    # Start Live Attendance Session
    session_payload = {
        "academic_class_id": class_id,
        "duration_minutes": 45,
    }
    start_res = await client.post("/teacher/sessions/start", json=session_payload)
    assert start_res.status_code in [200, 201], f"Failed starting session: {start_res.text}"
    session_data = start_res.json()
    session_id = session_data["id"]
    print(f"  ✓ Live attendance session initialized: {session_id}")

    # 7. Get Dynamic Session Smart Pass Token
    sp_res = await client.get(f"/teacher/sessions/{session_id}/smart-pass")
    assert sp_res.status_code == 200, f"Failed getting SmartPass: {sp_res.text}"
    qr_token = sp_res.json().get("qr_token", "")
    print(f"  ✓ Dynamic SmartPass token generated: {sp_res.json().get('pass_code')}")

    # 8. Check Attendance Roll
    roll_res = await client.get(f"/teacher/sessions/{session_id}/attendance")
    assert roll_res.status_code == 200, f"Failed getting roll: {roll_res.text}"
    students_roster = roll_res.json().get("attendance_roll", roll_res.json().get("roster", []))
    print(f"  ✓ Session attendance roll retrieved ({len(students_roster)} students on roster)")

    # 9. Conclude session cleanly
    await client.post(f"/teacher/sessions/{session_id}/stop")
    print("  ✓ Live attendance session cleanly closed")

    return {
        "class_id": class_id,
        "session_id": session_id,
        "qr_token": qr_token,
        "geofence": geofence_payload,
    }
