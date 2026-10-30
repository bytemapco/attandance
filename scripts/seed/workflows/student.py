import random
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from scripts.seed.client import ApiClient
from scripts.seed.assets import get_face_upload_tuple


async def login_student(client: ApiClient, email: str, password: str, device_uuid: str, tenant_id: str) -> Optional[str]:
    try:
        resp = await client.post(
            "/auth/login",
            json={"email": email, "password": password, "device_uuid": device_uuid},
        )
        token = resp["access_token"]
        client.set_auth(token=token, tenant_id=tenant_id)
        return token
    except Exception as exc:
        if "bound to another device" in str(exc).lower():
            alt_dev = f"device-bound-{email.split('@')[0].replace('.', '-')}"
            try:
                resp = await client.post(
                    "/auth/login",
                    json={"email": email, "password": password, "device_uuid": alt_dev},
                )
                token = resp["access_token"]
                client.set_auth(token=token, tenant_id=tenant_id)
                return token
            except Exception:
                return None
        return None


async def register_student_biometrics(client: ApiClient) -> bool:
    try:
        await client.post("/student/biometric/consent", json={"consent_given": True})
        file_tuple = get_face_upload_tuple("selfie.jpg")
        await client.post("/student/register-face", files={"image": file_tuple})
        return True
    except Exception as exc:
        print(f"      ⚠ Notice: biometric registration skipped ({exc})")
        return False


async def submit_attendance(
    client: ApiClient,
    session_id: str,
    base_lat: float,
    base_lon: float,
    is_outlier: bool = False,
) -> Optional[dict[str, Any]]:
    # In-bounds: offset by ~10-20 meters (approx 0.0001 deg). Outlier: offset by ~800 meters (0.008 deg)
    offset = 0.008 if is_outlier else random.uniform(-0.00015, 0.00015)
    lat = base_lat + offset
    lon = base_lon + offset
    file_tuple = get_face_upload_tuple("checkin.jpg")

    try:
        resp = await client.post(
            "/student/attendance/mark",
            data={
                "session_id": session_id,
                "latitude": str(lat),
                "longitude": str(lon),
                "accuracy": "12.0",
            },
            files={"image": file_tuple},
        )
        if resp.get("status") == "Flagged" and resp.get("id"):
            try:
                await client.post(
                    f"/student/attendance/{resp['id']}/note",
                    json={"note": "Weak GPS signal inside basement lab."},
                )
            except Exception:
                pass
        return resp
    except Exception as exc:
        return None


async def apply_for_leave(client: ApiClient, reason: str = "Medical leave due to viral fever.") -> None:
    now = datetime.now(timezone.utc)
    start_date = (now + timedelta(days=random.randint(1, 3))).strftime("%Y-%m-%d")
    end_date = (now + timedelta(days=random.randint(4, 7))).strftime("%Y-%m-%d")
    try:
        await client.post(
            "/student/leaves",
            data={"start_date": start_date, "end_date": end_date, "reason": reason},
        )
    except Exception as exc:
        pass


async def request_device_change(
    client: ApiClient,
    email: str,
    old_device_uuid: str,
    new_device_uuid: str,
    reason: str = "Purchased new handset device.",
) -> None:
    try:
        await client.post(
            "/auth/request-device-change",
            json={
                "email": email,
                "new_device_uuid": new_device_uuid,
                "reason": reason,
            },
        )
    except Exception as exc:
        pass
