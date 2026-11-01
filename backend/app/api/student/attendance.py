from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.api.student.helpers import (
    rate_limit_student,
    save_uploaded_image,
    validate_image,
)
from app.db.client import db
from app.schemas.attendance import (
    AttendanceAnalyzeResponse,
    AttendanceAsyncEnqueueResponse,
    AttendanceJobStatusResponse,
    AttendanceMarkResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.student import StudentAttendanceHistoryResponse, StudentAttendanceNoteRequest
from app.services.attendance.attendance_queue_service import AttendanceQueueService
from app.services import occurrence_face_review_service as face_review
from app.services.attendance_service import AttendanceSubmission
from app.services.s3_service import s3_service
from app.services.student_service import StudentService

router = APIRouter()


async def _analyze(
    student: Student, session_id: str, latitude: float, longitude: float, accuracy: float, image: UploadFile | None
) -> dict:
    """`session_id` is the class occurrence the teacher opened for attendance."""
    await rate_limit_student(student.id, max_requests=10, window_seconds=60)
    image_url = None
    if image:
        validate_image(image)
        image_url, _ = await save_uploaded_image(image, "attendance")
    try:
        return await face_review.analyze_occurrence(student, session_id, latitude, longitude, accuracy, image_url)
    except Exception:
        if image_url:
            s3_service.delete_file(image_url)
        raise


async def _confirm(student: Student, review_token: str) -> AttendanceMarkResponse:
    record, result = await face_review.confirm_occurrence(student, review_token)
    return AttendanceMarkResponse(
        id=record.id,
        student_id=record.studentId,
        session_id=record.occurrenceId,
        status=result["predicted_status"],
        face_score=result["face_score"],
        liveness_score=result["liveness_score"],
        background_score=result["background_score"],
        final_ai_score=result["final_ai_score"],
        gps_latitude=record.gpsLatitude,
        gps_longitude=record.gpsLongitude,
        created_at=record.verifiedAt,
    )


@router.post("/attendance/mark", response_model=AttendanceMarkResponse)
async def mark_attendance(
    session_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    image: UploadFile | None = File(None),
    student: Student = Depends(get_current_student),
) -> AttendanceMarkResponse:
    analysis = await _analyze(student, session_id, latitude, longitude, accuracy, image)
    return await _confirm(student, analysis["review_token"])


@router.post("/attendance/analyze", response_model=AttendanceAnalyzeResponse)
async def analyze_attendance(
    session_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    image: UploadFile | None = File(None),
    student: Student = Depends(get_current_student),
) -> AttendanceAnalyzeResponse:
    return AttendanceAnalyzeResponse(**await _analyze(student, session_id, latitude, longitude, accuracy, image))


@router.post("/attendance/confirm", response_model=AttendanceMarkResponse)
async def confirm_attendance(
    review_token: str = Form(...),
    student: Student = Depends(get_current_student),
) -> AttendanceMarkResponse:
    return await _confirm(student, review_token)


@router.post("/attendance/async-mark", response_model=AttendanceAsyncEnqueueResponse, status_code=status.HTTP_202_ACCEPTED)
async def async_mark_attendance(
    session_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    image: UploadFile | None = File(None),
    student: Student = Depends(get_current_student),
    queue_service: AttendanceQueueService = Depends(),
) -> AttendanceAsyncEnqueueResponse:
    await rate_limit_student(student.id, max_requests=15, window_seconds=60)
    image_url = None
    if image:
        validate_image(image)
        image_url, _ = await save_uploaded_image(image, "attendance")

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


@router.get("/my-attendance", response_model=StudentAttendanceHistoryResponse)
async def get_my_attendance(
    student: Student = Depends(get_current_student),
    student_service: StudentService = Depends(),
) -> StudentAttendanceHistoryResponse:
    return await student_service.get_student_attendance_history(student.userId)


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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Notes can only be added to flagged records.")
    await db.attendance.update(where={"id": attendance_id}, data={"studentNote": data.note})
    return MessageResponse(status="success", message="Note submitted successfully.")
