from typing import Any
from scripts.seed.client import ApiClient


async def login_teacher(client: ApiClient, email: str, password: str, tenant_id: str) -> str:
    resp = await client.post("/auth/login", json={"email": email, "password": password})
    token = resp["access_token"]
    client.set_auth(token=token, tenant_id=tenant_id)
    return token


async def configure_geofence(
    client: ApiClient,
    class_id: str,
    lat: float,
    lon: float,
    radius_meters: float = 100.0,
) -> dict[str, Any]:
    return await client.post(
        f"/teacher/classes/{class_id}/geofence",
        json={"latitude": lat, "longitude": lon, "radius_meters": radius_meters},
    )


async def start_class_session(client: ApiClient, class_id: str, duration_minutes: int = 60) -> str:
    try:
        resp = await client.post(
            "/teacher/sessions/start",
            json={"academic_class_id": class_id, "duration_minutes": duration_minutes},
        )
        return resp["id"]
    except Exception as exc:
        if "409" in str(exc):
            all_sessions = await client.get("/teacher/sessions/all")
            for s in all_sessions:
                if s.get("academicClassId") == class_id and s.get("isActive"):
                    return s["id"]
        raise exc


async def stop_class_session(client: ApiClient, session_id: str) -> None:
    try:
        await client.post(f"/teacher/sessions/{session_id}/stop")
    except Exception as exc:
        print(f"    ⚠ Notice: session stop ({exc})")


async def review_flagged_attendance(client: ApiClient) -> int:
    try:
        flagged_items = await client.get("/teacher/attendance/flagged")
        reviewed = 0
        for item in flagged_items[:5]:
            att_id = item["id"]
            await client.put(
                f"/teacher/attendance/{att_id}/review",
                json={"status": "Approved", "remarks": "Biometric reviewed by course instructor."},
            )
            reviewed += 1
        return reviewed
    except Exception as exc:
        print(f"    ⚠ Notice: review flagged error ({exc})")
        return 0


async def review_pending_leaves(client: ApiClient) -> int:
    try:
        pending_leaves = await client.get("/teacher/leaves/pending")
        approved_count = 0
        for idx, leave in enumerate(pending_leaves):
            leave_id = leave["id"]
            approve = idx % 3 != 0  # 2/3 approved, 1/3 rejected
            note = "Leave sanctioned per medical notice." if approve else "Insufficient documentation."
            await client.put(
                f"/teacher/leaves/{leave_id}/approve",
                json={"approve": approve, "approver_note": note},
            )
            approved_count += 1
        return approved_count
    except Exception as exc:
        print(f"    ⚠ Notice: review leaves error ({exc})")
        return 0


async def review_pending_device_changes(client: ApiClient) -> int:
    try:
        pending_devices = await client.get("/teacher/device-changes/pending")
        processed_count = 0
        for idx, req in enumerate(pending_devices):
            req_id = req["id"]
            approve = idx % 4 != 0  # 75% approved
            await client.put(
                f"/teacher/device-changes/{req_id}/approve",
                json={"approve": approve},
            )
            processed_count += 1
        return processed_count
    except Exception as exc:
        print(f"    ⚠ Notice: review device changes error ({exc})")
        return 0


async def manual_override_student(
    client: ApiClient,
    session_id: str,
    student_id: str,
    status: str = "Present",
) -> None:
    try:
        await client.post(
            f"/teacher/sessions/{session_id}/override",
            json={"student_id": student_id, "status": status, "remarks": "Teacher attendance manual roll-call."},
        )
    except Exception:
        pass
