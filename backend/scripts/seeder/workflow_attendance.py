"""Attendance Sessions, Geofences, Leaves, and Device Change Workflows."""

from datetime import date, timedelta
from typing import List
from app.core.logging_config import get_logger
from .client import APIClient
from .workflow_auth import login_user

logger = get_logger("app.seeder.attendance")


async def setup_geofence_and_session(
    client: APIClient,
    teacher_email: str,
    teacher_pass: str,
    class_id: str,
    student_ids: List[str],
) -> str:
    """Teacher logs in, pins GPS geofence, runs a session, and bulk marks attendance."""
    teacher_token = await login_user(client, teacher_email, teacher_pass)
    client.set_token(teacher_token)

    # 1. Configure Geofence (Powai, IIT Bombay campus coordinates)
    geofence_data = {
        "latitude": 19.1334,
        "longitude": 72.9133,
        "radius_meters": 60,
    }
    await client.post(f"/teacher/classes/{class_id}/geofence", json_data=geofence_data)
    logger.info("Configured GPS geofence for class %s", class_id)

    # 2. Start Live Attendance Session
    session_data = {
        "academic_class_id": class_id,
        "duration_minutes": 60,
    }
    sess_res = await client.post("/teacher/sessions/start", json_data=session_data)
    session_id = sess_res["id"]
    logger.info("Opened attendance session %s for class %s", session_id, class_id)

    # 3. Mark Realistic Attendance (80% Present, 20% Absent)
    records = []
    for idx, sid in enumerate(student_ids):
        status = "Absent" if idx == 0 else "Present"
        records.append({"student_id": sid, "status": status})

    if records:
        bulk_data = {"records": records}
        await client.post(f"/teacher/sessions/{session_id}/mark-bulk", json_data=bulk_data)
        logger.info("Bulk-marked %d attendance records in session %s", len(records), session_id)

    # 4. Close Session
    await client.post(f"/teacher/sessions/{session_id}/stop")
    logger.info("Closed attendance session %s", session_id)

    return session_id


async def seed_leave_request_workflow(
    client: APIClient,
    student_email: str,
    student_pass: str,
    teacher_email: str,
    teacher_pass: str,
) -> None:
    """Student submits an academic leave request, and teacher reviews & approves it."""
    # 1. Student submits leave
    student_token = await login_user(client, student_email, student_pass)
    client.set_token(student_token)

    today = date.today()
    leave_data = {
        "start_date": (today + timedelta(days=5)).isoformat(),
        "end_date": (today + timedelta(days=7)).isoformat(),
        "reason": "Representing institute at Smart India Hackathon Grand Finale in New Delhi.",
    }
    created_leave = await client.post("/student/leaves", data=leave_data)
    leave_id = created_leave["id"]
    logger.info("Student %s submitted leave request %s", student_email, leave_id)

    # 2. Teacher approves leave
    teacher_token = await login_user(client, teacher_email, teacher_pass)
    client.set_token(teacher_token)

    approve_data = {
        "status": "APPROVED",
        "approver_note": "Granted academic leave. All the best for the hackathon!",
    }
    await client.put(f"/teacher/leaves/{leave_id}/approve", json_data=approve_data)
    logger.info("Teacher %s approved leave request %s", teacher_email, leave_id)


async def seed_device_change_workflow(
    client: APIClient,
    student_email: str,
    student_pass: str,
    teacher_email: str,
    teacher_pass: str,
) -> None:
    """Student files device change request, and teacher approves it."""
    # 1. Unauthenticated / Student submit device change request
    client.set_token(None)
    change_data = {
        "email": student_email,
        "password": student_pass,
        "new_device_uuid": "dev-hw-uuid-oneplus12r-in-99",
        "reason": "Upgraded smartphone to OnePlus 12R for academic coursework.",
    }
    await client.post("/auth/request-device-change", json_data=change_data)
    logger.info("Requested hardware device change for student %s", student_email)

    # 2. Teacher retrieves pending device change and approves
    teacher_token = await login_user(client, teacher_email, teacher_pass)
    client.set_token(teacher_token)

    pending_list = await client.get("/teacher/device-changes/pending")
    target_req = next(
        (
            r
            for r in pending_list
            if r.get("new_device_uuid") == change_data["new_device_uuid"]
            or r.get("enrollment_number") == "2024BCSE001"
        ),
        None,
    )

    if target_req:
        req_id = target_req["id"]
        approve_data = {"status": "APPROVED"}
        await client.put(f"/teacher/device-changes/{req_id}/approve", json_data=approve_data)
        logger.info("Teacher %s approved device change request %s", teacher_email, req_id)
