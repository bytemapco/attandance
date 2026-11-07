import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from prisma.errors import UniqueViolationError
from prisma.models import AttendanceRecord, Student
from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repository import StudentRepository
from app.services.ai_orchestrator import AIOrchestrator
from app.services.gamification_service import GamificationService
from app.services.occurrence_window import window_is_open
from app.services.s3_service import s3_service
from app.services.system_config_service import SystemConfigService
from app.utils.geofencing import GPSCoordinate, calculate_haversine_distance, is_within_geofence

logger = get_logger("app.attendance.occurrence")

# Liveness 0.93 is the calibrated threshold shipped with liveness_mobilenetv2_final.keras (models/liveness_detection/liveness_inference_config.json).
FACE_MIN, LIVENESS_MIN, BACKGROUND_MIN = 0.60, 0.93, 0.50


def reject(code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=code, detail=detail)


def _discard_image(path: Optional[str]) -> None:
    if not path:
        return
    try:
        if os.path.exists(path):
            os.remove(path)
        else:
            s3_service.delete_file(path)
    except Exception as exc:
        logger.warning("Could not remove attendance image %s: %s", path, exc)


async def open_for_student(student: Student, occurrence_id: str):
    """Returns (occurrence, existing record). Raises unless the student is enrolled in the class."""
    occurrence = await db.classoccurrence.find_first(where={"id": occurrence_id, "tenantId": student.tenantId})
    if not occurrence:
        raise reject(status.HTTP_404_NOT_FOUND, "Class not found.")
    enrolled = await db.courseenrollment.find_first(
        where={"courseSectionId": occurrence.courseSectionId, "studentId": student.id, "endedAt": None, "status": "ACTIVE"}
    )
    if not enrolled:
        raise reject(status.HTTP_403_FORBIDDEN, "You are not enrolled in this class.")
    existing = await db.attendancerecord.find_unique(
        where={"occurrenceId_studentId": {"occurrenceId": occurrence_id, "studentId": student.id}}
    )
    return occurrence, existing


def already_marked(existing: Optional[AttendanceRecord]) -> bool:
    """A teacher-created ABSENT placeholder can still be upgraded by the student."""
    return bool(existing and existing.status != "ABSENT")


def require_open_window(occurrence) -> None:
    if not window_is_open(occurrence):
        raise reject(status.HTTP_409_CONFLICT, "Attendance is not open for this class.")


async def location_remarks(config, latitude: float, longitude: float, accuracy: float) -> list[str]:
    """Raises when outside the campus fence. Returns a remark (the record gets flagged) when the check could not run."""
    if not config.isGpsVerificationEnabled:
        return []
    if config.campusLatitude is None or config.campusLongitude is None:
        return ["No campus location is set for this institution; location not verified."]
    student_point = GPSCoordinate(latitude, longitude)
    centre = GPSCoordinate(config.campusLatitude, config.campusLongitude)
    radius = config.geofenceRadiusMeters
    if not is_within_geofence(student_point, centre, radius, accuracy):
        distance = calculate_haversine_distance(student_point, centre)
        raise reject(
            status.HTTP_400_BAD_REQUEST,
            f"You are outside the campus location by {distance - radius - accuracy:.0f} m.",
        )
    return []


def _score_problems(scores: dict) -> list[str]:
    """Each check that failed or could not run is a reason the record is flagged."""
    problems = []
    if scores["face"] < FACE_MIN:
        problems.append("Face match below threshold.")
    if scores["liveness"] is None:
        problems.append("Liveness check could not run.")
    elif scores["liveness"] < LIVENESS_MIN:
        problems.append("Liveness below threshold.")
    if scores["background_counted"]:
        if scores["background"] is None:
            problems.append("Background check could not run.")
        elif scores["background"] < BACKGROUND_MIN:
            problems.append("Background check failed.")
    return problems


async def _verify_face(config, student: Student, image_path: Optional[str]) -> tuple[dict, list[str]]:
    """Returns (scores, problems). A score is None when its check did not run, never a made-up value."""
    embedding = await StudentRepository().get_face_embedding(student.id)
    if not embedding:
        raise reject(status.HTTP_400_BAD_REQUEST, "Register your face before marking attendance.")
    if not image_path:
        raise reject(status.HTTP_400_BAD_REQUEST, "A selfie is required to mark attendance.")
    background_counted = bool(config.isAiBackgroundValidationEnabled)
    raw = await AIOrchestrator().analyze_attendance(image_path, embedding, check_background=background_counted)
    scores = {
        "face": raw["face_score"],
        "liveness": raw["liveness_score"],
        "background": raw["background_score"],
        "background_counted": background_counted,
    }
    if scores["face"] is None:
        return scores, ["AI verification unavailable."]
    return scores, _score_problems(scores)


async def evaluate_face(
    student: Student, occurrence, latitude: float, longitude: float, accuracy: float, image_path: Optional[str]
) -> tuple[dict, dict]:
    """Runs location and face checks. Returns (record data to save, raw scores)."""
    config = await SystemConfigService().get_config(student.tenantId)
    if not config.isFaceRecognitionEnabled:
        raise reject(
            status.HTTP_409_CONFLICT, "Face verification is off for your institution. Scan the teacher's QR code instead."
        )
    remarks = await location_remarks(config, latitude, longitude, accuracy)
    scores, problems = await _verify_face(config, student, image_path)
    remarks.extend(problems)
    flagged = bool(remarks)
    data = {
        "status": "FLAGGED" if flagged else "PRESENT",
        "method": "AI_BIOMETRIC",
        "faceScore": scores["face"],
        "livenessScore": scores["liveness"],
        "gpsLatitude": latitude,
        "gpsLongitude": longitude,
        "evidencePhotoUrl": image_path if flagged else None,
        "remarks": " ".join(remarks) or None,
    }
    return data, scores


async def save_record(student: Student, occurrence, existing, data: dict, reason: str) -> AttendanceRecord:
    data = {**data, "verifiedAt": datetime.now(timezone.utc)}
    try:
        record = (
            await db.attendancerecord.update(where={"id": existing.id}, data=data)
            if existing
            else await db.attendancerecord.create(
                data={**data, "tenantId": student.tenantId, "occurrenceId": occurrence.id, "studentId": student.id}
            )
        )
    except UniqueViolationError:
        return await db.attendancerecord.find_first(where={"occurrenceId": occurrence.id, "studentId": student.id})
    await db.attendanceauditlog.create(
        data={
            "attendanceRecordId": record.id,
            "previousStatus": existing.status if existing else "ABSENT",
            "newStatus": data["status"],
            "changedById": student.userId,
            "reason": reason,
        }
    )
    return record


async def finish_face_mark(student: Student, occurrence, existing, data: dict, image_path: Optional[str]) -> AttendanceRecord:
    record = await save_record(student, occurrence, existing, data, "Student face verification")
    flagged = data["status"] == "FLAGGED"
    if not flagged:
        _discard_image(image_path)
    try:
        await GamificationService().recalculate_student_streak(student.id)
    except Exception as exc:
        logger.warning("Streak update failed: %s", exc)
    return record
