"""Rotating QR code shown by the teacher; students scan it to mark attendance without biometrics."""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import status
from prisma.models import AttendanceRecord, Student
from app.core.security import create_access_token, decode_access_token
from app.services import occurrence_marking_service as marking
from app.services.system_config_service import SystemConfigService

QR_REFRESH_SECONDS = 5
QR_TTL = timedelta(seconds=QR_REFRESH_SECONDS * 2)  # one rotation of slack for a slow scan or network
TOKEN_TYPE = "occurrence_qr"


def issue_qr(occurrence) -> dict:
    """The subject is the occurrence, not a user, so the token can never authenticate an API call."""
    marking.require_open_window(occurrence)
    token = create_access_token(
        subject=occurrence.id,
        role="QR",
        expires_delta=QR_TTL,
        extra_data={"type": TOKEN_TYPE, "occurrence_id": occurrence.id, "nonce": uuid.uuid4().hex[:12]},
    )
    return {
        "qr_token": token,
        "expires_at": (datetime.now(timezone.utc) + QR_TTL).isoformat(),
        "refresh_interval_seconds": QR_REFRESH_SECONDS,
    }


async def mark_by_qr(
    student: Student, qr_token: str, latitude: float, longitude: float, accuracy: float
) -> tuple[AttendanceRecord, object, bool]:
    """Returns (record, occurrence, newly_marked). A repeat scan returns the original record."""
    payload = decode_access_token(qr_token)
    if not payload or payload.get("type") != TOKEN_TYPE or not payload.get("occurrence_id"):
        raise marking.reject(
            status.HTTP_400_BAD_REQUEST, "This QR code has expired. Scan the code on the teacher's screen again."
        )
    occurrence, existing = await marking.open_for_student(student, payload["occurrence_id"])
    if marking.already_marked(existing):
        return existing, occurrence, False
    marking.require_open_window(occurrence)
    config = await SystemConfigService().get_config(student.tenantId)
    remarks = await marking.location_remarks(config, latitude, longitude, accuracy)
    data = {
        "status": "FLAGGED" if remarks else "PRESENT",
        "method": "QR_CODE",
        "faceScore": None,
        "livenessScore": None,
        "gpsLatitude": latitude,
        "gpsLongitude": longitude,
        "remarks": " ".join(remarks) or None,
    }
    record = await marking.save_record(student, occurrence, existing, data, "Student scanned class QR code")
    return record, occurrence, True
