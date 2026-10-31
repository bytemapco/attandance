import os
import uuid
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_incr_expire
from app.db.redis import safe_redis
from app.services.s3_service import s3_service

logger = get_logger("app.api.student.helpers")

MAX_IMAGE_SIZE = 5 * 1024 * 1024
VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_LEAVE_DOCUMENT_SIZE = 10 * 1024 * 1024
VALID_LEAVE_DOCUMENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def rate_limit_student(student_id: str, max_requests: int = 15, window_seconds: int = 60) -> None:
    if settings.ENVIRONMENT == "development":
        return
    r = safe_redis()
    if not r:
        return
    key = f"ratelimit:student:{student_id}"
    try:
        count = await atomic_incr_expire(r, key, window_seconds)
        if count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment before trying again.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Redis rate limiter unavailable for student %s: %s", student_id, exc)


def validate_image_bytes(contents: bytes) -> None:
    if len(contents) < 12:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type. Image is corrupted or too small.",
        )
    is_jpeg = contents.startswith(b"\xff\xd8\xff")
    is_png = contents.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = contents.startswith(b"RIFF") and contents[8:12] == b"WEBP"
    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type. Upload must be a valid JPEG, PNG, or WebP image.",
        )


def validate_image(image: UploadFile) -> None:
    if image.content_type not in VALID_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type. Upload must be a valid JPEG or PNG image.",
        )
    if image.size is not None and image.size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large. Uploaded image cannot exceed 5MB.",
        )


async def save_uploaded_image(upload_file: UploadFile, folder: str) -> tuple[str, bytes]:
    contents = await upload_file.read()
    validate_image_bytes(contents)
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large. Uploaded image cannot exceed 5MB.",
        )
    ext = os.path.splitext(upload_file.filename)[1].lower() if upload_file.filename else ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    key = f"{folder}/{uuid.uuid4()}{ext}"
    url = s3_service.upload_bytes(contents, key, content_type=upload_file.content_type or "image/jpeg")
    return url, contents


def resolve_student_name(student) -> str:
    if not student:
        return "Unknown"
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or "Unknown"
