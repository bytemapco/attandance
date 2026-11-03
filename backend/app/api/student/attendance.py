from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.api.student.helpers import (
    rate_limit_student,
    save_uploaded_image,
    validate_image,
)
from app.db.client import db
from app.schemas.attendance import AttendanceAnalyzeResponse, AttendanceMarkResponse
from app.schemas.common import MessageResponse
from app.schemas.student import StudentAttendanceHistoryResponse, StudentAttendanceNoteRequest
from app.services import occurrence_face_review_service as face_review
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
    record = await db.attendancerecord.find_first(
        where={"id": attendance_id, "studentId": student.id, "tenantId": student.tenantId}
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found.")
    if record.status != "FLAGGED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Notes can only be added to flagged records.")
    await db.attendancerecord.update(where={"id": attendance_id}, data={"studentNote": data.note})
    return MessageResponse(status="success", message="Note submitted successfully.")
