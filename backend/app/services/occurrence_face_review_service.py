"""Two-step face attendance: analyze shows the student the result, confirm saves it."""
import json
import uuid
from datetime import timedelta
from typing import Optional
from fastapi import status
from prisma.models import AttendanceRecord, Student
from app.core.security import create_access_token, decode_access_token
from app.db.redis import safe_redis
from app.services import occurrence_marking_service as marking

REVIEW_TTL = timedelta(minutes=5)
TOKEN_TYPE = "occurrence_review"
_INVALID = "This verification has expired. Please take the selfie again."


def _key(review_id: str) -> str:
    return f"occurrence_review:{review_id}"


def _redis():
    redis = safe_redis()
    if not redis:
        raise marking.reject(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Face verification is busy. Try again or scan the teacher's QR code."
        )
    return redis


def _result(scores: dict, record_status: str) -> dict:
    checks = [scores["face"], scores["liveness"], scores["background"] if scores["background_counted"] else None]
    ran = [value for value in checks if value is not None]
    return {
        "face_score": scores["face"],
        "liveness_score": scores["liveness"],
        "background_score": scores["background"],
        "final_ai_score": round(sum(ran) / len(ran), 4) if ran else None,
        "predicted_status": "Flagged" if record_status == "FLAGGED" else "Present",
    }


async def analyze_occurrence(
    student: Student, occurrence_id: str, latitude: float, longitude: float, accuracy: float, image_path: Optional[str]
) -> dict:
    occurrence, existing = await marking.open_for_student(student, occurrence_id)
    if marking.already_marked(existing):
        raise marking.reject(status.HTTP_409_CONFLICT, "You have already marked attendance for this class.")
    marking.require_open_window(occurrence)
    data, scores = await marking.evaluate_face(student, occurrence, latitude, longitude, accuracy, image_path)
    if scores["face"] is None:
        raise marking.reject(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Face verification is unavailable right now. Scan the teacher's QR code instead.",
        )
    result = _result(scores, data["status"])
    review_id = str(uuid.uuid4())
    pending = {"occurrence_id": occurrence_id, "data": data, "image_path": image_path, "result": result}
    await _redis().setex(_key(review_id), int(REVIEW_TTL.total_seconds()), json.dumps(pending))
    token = create_access_token(
        subject=student.id,
        role="STUDENT",
        expires_delta=REVIEW_TTL,
        extra_data={"type": TOKEN_TYPE, "review_id": review_id},
    )
    return {**result, "review_token": token}


async def confirm_occurrence(student: Student, review_token: str) -> tuple[AttendanceRecord, dict]:
    """Saves the analysed result once. Returns (record, the scores shown at analyze)."""
    payload = decode_access_token(review_token)
    if not payload or payload.get("type") != TOKEN_TYPE or payload.get("sub") != student.id:
        raise marking.reject(status.HTTP_400_BAD_REQUEST, _INVALID)
    redis = _redis()
    key = _key(payload.get("review_id", ""))
    cached = await redis.get(key)
    if not cached:
        raise marking.reject(status.HTTP_400_BAD_REQUEST, _INVALID)
    await redis.delete(key)
    pending = json.loads(cached)
    occurrence, existing = await marking.open_for_student(student, pending["occurrence_id"])
    if marking.already_marked(existing):
        return existing, pending["result"]
    marking.require_open_window(occurrence)
    record = await marking.finish_face_mark(student, occurrence, existing, pending["data"], pending["image_path"])
    return record, pending["result"]
