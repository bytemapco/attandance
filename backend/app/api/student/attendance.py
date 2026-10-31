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
from app.services.attendance_service import AttendanceService, AttendanceSubmission
from app.services.s3_service import s3_service
from app.services.student_service import StudentService

router = APIRouter()


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
    await rate_limit_student(student.id, max_requests=10, window_seconds=60)
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
    await rate_limit_student(student.id, max_requests=10, window_seconds=60)
    image_url = None
    image_bytes = None
    if image:
        validate_image(image)
        image_url, image_bytes = await save_uploaded_image(image, "attendance")
    submission = AttendanceSubmission(
        student_id=student.id,
        session_id=session_id,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        image_path=image_url,
        image_bytes=image_bytes,
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
    try:
        attendance = await attendance_service.confirm_attendance(student.id, review_token)
        return AttendanceMarkResponse.model_validate(attendance)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


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
