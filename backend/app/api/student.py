import os
import uuid
from datetime import datetime, timezone, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.core.logging_config import get_logger
from app.core.security import create_access_token
from app.db.client import db
from app.repositories.leave_repository import LeaveRepository

from app.schemas.attendance import (
    AttendanceMarkResponse,
    AttendanceAnalyzeResponse,
    AttendanceAsyncEnqueueResponse,
    AttendanceJobStatusResponse,
)
from app.schemas.student import (
    StudentAttendanceHistoryResponse,
    StudentClassResponse,
    FcmTokenRequest,
    StudentAttendanceNoteRequest,
    SmartPassResponse,
    StudentSmartPassScanRequest,
    StudentSmartPassScanResponse,
    StudentStatsResponse,
    LeaderboardResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.leave import LeaveRequestResponse, LeaveRequestListResponse
from app.services.attendance_service import AttendanceService, AttendanceSubmission
from app.services.attendance.attendance_queue_service import AttendanceQueueService
from app.services.biometric_consent_service import BiometricConsentService
from app.services.student_service import StudentService
from app.services.gamification_service import GamificationService

logger = get_logger("app.api.student")

router = APIRouter(prefix="/student", tags=["Student Features"])

from app.services.s3_service import s3_service

from app.core.config import settings
from app.db.redis import get_redis

_MAX_IMAGE_SIZE = 5 * 1024 * 1024
_VALID_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"}

_MAX_LEAVE_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10 MB
_VALID_LEAVE_DOCUMENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def _rate_limit_student(student_id: str, max_requests: int = 15, window_seconds: int = 60) -> None:
    if settings.ENVIRONMENT == "development":
        return
    key = f"ratelimit:student:{student_id}"
    try:
        r = get_redis()
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, window_seconds)
        if count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment before trying again.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Redis rate limiter unavailable for student %s: %s", student_id, exc)


def _validate_image_bytes(contents: bytes) -> None:
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


async def _save_uploaded_image(upload_file: UploadFile, folder: str) -> tuple[str, bytes]:
    contents = await upload_file.read()
    _validate_image_bytes(contents)
    if len(contents) > _MAX_IMAGE_SIZE:
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


def _validate_image(image: UploadFile) -> None:
    if image.content_type not in _VALID_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type. Upload must be a valid JPEG or PNG image.",
        )
    if image.size is not None and image.size > _MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large. Uploaded image cannot exceed 5MB.",
        )


def _make_leave_response(leave, student_name: str, enrollment_number: str = None) -> LeaveRequestResponse:
    document_url = s3_service.generate_presigned_url(leave.documentUrl) if leave.documentUrl else None
    return LeaveRequestResponse(
        id=leave.id,
        student_id=leave.studentId,
        student_name=student_name or "Unknown",
        enrollment_number=enrollment_number or (leave.student.enrollmentNumber if leave.student else "N/A"),
        start_date=leave.startDate,
        end_date=leave.endDate,
        reason=leave.reason,
        document_url=document_url,
        status=leave.status,
        approved_by=leave.approvedBy,
        approver_note=leave.approverNote,
        created_at=leave.createdAt,
        updated_at=leave.updatedAt,
    )


def _student_name(student: Student) -> str:
    if not student:
        return "Unknown"
    return f"{student.firstName or ''} {student.lastName or ''}".strip()


@router.post("/attendance/mark", response_model=AttendanceMarkResponse)
async def mark_attendance(
    session_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    image: UploadFile | None = File(None),
    student: Student = Depends(get_current_student),
    attendance_service: AttendanceService = Depends(),
) -> AttendanceMarkResponse:
    await _rate_limit_student(student.id, max_requests=10, window_seconds=60)
    image_url = None
    if image:
        _validate_image(image)
        image_url, _ = await _save_uploaded_image(image, "attendance")
    submission = AttendanceSubmission(
        student_id=student.id,
        session_id=session_id,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        image_path=image_url,
    )
    try:
        attendance = await attendance_service.mark_attendance(submission)
        return AttendanceMarkResponse.model_validate(attendance)
    except ValueError as err:
        if image_url:
            s3_service.delete_file(image_url)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/attendance/analyze", response_model=AttendanceAnalyzeResponse)
async def analyze_attendance(
    session_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    image: UploadFile | None = File(None),
    student: Student = Depends(get_current_student),
    attendance_service: AttendanceService = Depends(),
) -> AttendanceAnalyzeResponse:
    """Run AI scoring and validation without saving the attendance record.

    Returns scores and a short-lived review_token (5 min) that the student
    can use to confirm submission via POST /attendance/confirm.
    """
    await _rate_limit_student(student.id, max_requests=10, window_seconds=60)
    image_url = None
    if image:
        _validate_image(image)
        image_url, _ = await _save_uploaded_image(image, "attendance")
    submission = AttendanceSubmission(
        student_id=student.id,
        session_id=session_id,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        image_path=image_url,
    )
    try:
        result = await attendance_service.analyze_attendance(submission)
        return AttendanceAnalyzeResponse(**result)
    except ValueError as err:
        if image_url:
            s3_service.delete_file(image_url)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/attendance/confirm", response_model=AttendanceMarkResponse)
async def confirm_attendance(
    review_token: str = Form(...),
    student: Student = Depends(get_current_student),
    attendance_service: AttendanceService = Depends(),
) -> AttendanceMarkResponse:
    """Confirm a previously analyzed attendance submission.

    Accepts the review_token returned by POST /attendance/analyze and saves
    the attendance record without re-running AI inference.
    """
    try:
        attendance = await attendance_service.confirm_attendance(student.id, review_token)
        return AttendanceMarkResponse.model_validate(attendance)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post(
    "/attendance/async-mark", response_model=AttendanceAsyncEnqueueResponse, status_code=status.HTTP_202_ACCEPTED
)
async def async_mark_attendance(
    session_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    image: UploadFile | None = File(None),
    student: Student = Depends(get_current_student),
    queue_service: AttendanceQueueService = Depends(),
) -> AttendanceAsyncEnqueueResponse:
    await _rate_limit_student(student.id, max_requests=15, window_seconds=60)
    image_url = None
    if image:
        _validate_image(image)
        image_url, _ = await _save_uploaded_image(image, "attendance")

    submission = AttendanceSubmission(
        student_id=student.id,
        session_id=session_id,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        image_path=image_url,
    )
    job_id = await queue_service.enqueue_submission(submission)
    return AttendanceAsyncEnqueueResponse(job_id=job_id)


@router.get("/attendance/jobs/{job_id}", response_model=AttendanceJobStatusResponse)
async def get_attendance_job_status(
    job_id: str,
    student: Student = Depends(get_current_student),
    queue_service: AttendanceQueueService = Depends(),
) -> AttendanceJobStatusResponse:
    job = await queue_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance job not found")
    if job.get("student_id") != student.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this job")
    return AttendanceJobStatusResponse(**job)


@router.post("/biometric/consent", response_model=MessageResponse)
async def submit_biometric_consent(
    policy_version: str = Form("2026.1-BIPA"),
    student: Student = Depends(get_current_student),
) -> MessageResponse:
    service = BiometricConsentService()
    await service.record_consent(student.id, policy_version=policy_version)
    return MessageResponse(status="success", message="Biometric consent successfully recorded.")


@router.get("/biometric/consent-status")
async def get_biometric_consent_status(
    student: Student = Depends(get_current_student),
) -> dict:
    service = BiometricConsentService()
    return await service.get_consent_status(student.id)


@router.post("/register-face", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def register_face(
    image: UploadFile = File(...),
    student: Student = Depends(get_current_student),
    attendance_service: AttendanceService = Depends(),
) -> MessageResponse:
    await _rate_limit_student(student.id, max_requests=5, window_seconds=60)
    _validate_image(image)
    image_url, image_bytes = await _save_uploaded_image(image, "registration")
    try:
        consent_service = BiometricConsentService()
        if not await consent_service.has_consent(student.id):
            s3_service.delete_file(image_url)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Biometric consent is required prior to registering facial biometrics.",
            )
        success = await attendance_service.register_face(student.id, image_bytes)
        if not success:
            s3_service.delete_file(image_url)
            raise ValueError("Could not extract a valid face from the image.")
        return MessageResponse(status="success", message="Face embedding registered successfully.")
    except HTTPException:
        raise
    except ValueError as err:
        s3_service.delete_file(image_url)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception:
        s3_service.delete_file(image_url)
        raise


@router.get("/my-attendance", response_model=StudentAttendanceHistoryResponse)
async def get_my_attendance(
    student: Student = Depends(get_current_student),
    student_service: StudentService = Depends(),
) -> StudentAttendanceHistoryResponse:
    return await student_service.get_student_attendance_history(student.userId)


@router.get("/classes", response_model=list[StudentClassResponse])
async def get_my_classes(
    student: Student = Depends(get_current_student),
    student_service: StudentService = Depends(),
) -> list[StudentClassResponse]:
    return await student_service.get_student_classes(student.userId)


@router.post("/fcm-token", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def register_fcm_token(
    data: FcmTokenRequest,
    student: Student = Depends(get_current_student),
) -> MessageResponse:
    await db.student.update(where={"id": student.id}, data={"fcmToken": data.token})
    return MessageResponse(status="success", message="FCM token registered.")


@router.post("/attendance/{attendance_id}/note", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def submit_flagged_note(
    attendance_id: str,
    data: StudentAttendanceNoteRequest,
    student: Student = Depends(get_current_student),
) -> MessageResponse:
    record = await db.attendance.find_unique(where={"id": attendance_id})
    if not record or record.studentId != student.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found.")
    if record.status != "Flagged":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Notes can only be added to flagged records."
        )
    await db.attendance.update(where={"id": attendance_id}, data={"studentNote": data.note})
    return MessageResponse(status="success", message="Note submitted successfully.")


@router.get("/leaves", response_model=LeaveRequestListResponse)
async def get_my_leaves(
    student: Student = Depends(get_current_student),
    leave_repo: LeaveRepository = Depends(),
) -> LeaveRequestListResponse:
    leaves = await leave_repo.get_by_student_id(student.id)
    leave_responses = [_make_leave_response(req, _student_name(req.student)) for req in leaves]
    return LeaveRequestListResponse(
        leaves=leave_responses,
        total=len(leave_responses),
        pending=sum(1 for req in leaves if req.status == "PENDING"),
        approved=sum(1 for req in leaves if req.status == "APPROVED"),
        rejected=sum(1 for req in leaves if req.status == "REJECTED"),
    )


@router.post("/leaves", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    start_date: str = Form(...),
    end_date: str = Form(...),
    reason: str = Form(...),
    document: UploadFile = File(None),
    student: Student = Depends(get_current_student),
    leave_repo: LeaveRepository = Depends(),
) -> LeaveRequestResponse:
    try:
        s_date = date.fromisoformat(start_date)
        e_date = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD.")
    if e_date < s_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after or equal to start date."
        )
    reason = reason.strip()
    if len(reason) < 5 or len(reason) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Reason must be between 5 and 500 characters."
        )

    document_url = None
    if document and document.filename:
        # Validate file type
        if document.content_type not in _VALID_LEAVE_DOCUMENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type. Allowed types: PDF, JPG, PNG, DOC, DOCX.",
            )
        contents = await document.read()
        if len(contents) > _MAX_LEAVE_DOCUMENT_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size too large. Maximum size is 10 MB.",
            )
        try:
            ext = os.path.splitext(document.filename)[1].lower() if document.filename else ".pdf"
            key = f"leaves/{uuid.uuid4()}{ext}"
            document_url = s3_service.upload_bytes(
                contents, key, content_type=document.content_type or "application/octet-stream"
            )
        except Exception as exc:
            logger.error("Could not upload leave document to S3: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save leave document."
            )

    leave = await leave_repo.create(
        {
            "studentId": student.id,
            "startDate": datetime.combine(s_date, datetime.min.time()).replace(tzinfo=timezone.utc),
            "endDate": datetime.combine(e_date, datetime.max.time()).replace(tzinfo=timezone.utc),
            "reason": reason,
            "documentUrl": document_url,
            "status": "PENDING",
        }
    )

    try:
        from app.db.client import db
        from app.services.notification_service import notify_teacher_leave_submitted

        enrollments = await db.enrollment.find_many(
            where={"studentId": student.id}, include={"academicClass": {"include": {"teacher": True}}}
        )
        notified_teachers = set()
        for enr in enrollments:
            if enr.academicClass and enr.academicClass.teacher and enr.academicClass.teacher.userId:
                t_user_id = enr.academicClass.teacher.userId
                if t_user_id not in notified_teachers:
                    notified_teachers.add(t_user_id)
                    await notify_teacher_leave_submitted(
                        teacher_user_id=t_user_id,
                        student_name=_student_name(student),
                        class_name=enr.academicClass.name if enr.academicClass else None,
                        leave_id=leave.id,
                        start_date=start_date,
                        end_date=end_date,
                        reason=reason,
                    )
    except Exception as exc:
        logger.warning("Failed to send leave notification to teachers: %s", exc)

    return _make_leave_response(leave, _student_name(student), student.enrollmentNumber)


@router.get("/smart-pass", response_model=SmartPassResponse)
async def get_smart_pass(student: Student = Depends(get_current_student)) -> SmartPassResponse:
    qr_token = create_access_token(
        subject=student.userId,
        role="STUDENT",
        expires_delta=timedelta(seconds=30),
        extra_data={"student_id": student.id, "enrollment_number": student.enrollmentNumber, "type": "smart_pass"},
    )
    return SmartPassResponse(
        qr_token=qr_token,
        expires_at=(datetime.now(timezone.utc) + timedelta(seconds=30)).isoformat(),
        student_name=_student_name(student),
        enrollment_number=student.enrollmentNumber,
    )


@router.post("/smart-pass/scan", response_model=StudentSmartPassScanResponse, status_code=status.HTTP_200_OK)
async def scan_smart_pass(
    data: StudentSmartPassScanRequest,
    student: Student = Depends(get_current_student),
    student_service: StudentService = Depends(),
) -> StudentSmartPassScanResponse:
    await _rate_limit_student(student.id, max_requests=15, window_seconds=60)
    return await student_service.verify_teacher_smart_pass_and_mark(
        student=student,
        qr_token=data.qr_token,
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy,
        device_uuid=data.device_uuid,
    )


@router.get("/stats", response_model=StudentStatsResponse)
async def get_my_stats(student: Student = Depends(get_current_student)) -> StudentStatsResponse:
    stats = await GamificationService().get_student_stats(student.id)
    return StudentStatsResponse.model_validate(stats)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(student: Student = Depends(get_current_student)) -> LeaderboardResponse:
    board = await GamificationService().get_leaderboard(student.id)
    return LeaderboardResponse.model_validate(board)
