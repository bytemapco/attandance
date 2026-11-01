from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, status
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.api.student.helpers import rate_limit_student, resolve_student_name
from app.core.security import create_access_token
from app.schemas.student import (
    LeaderboardResponse,
    SmartPassResponse,
    StudentSmartPassScanRequest,
    StudentSmartPassScanResponse,
    StudentStatsResponse,
)
from app.db.client import db
from app.services import occurrence_qr_service
from app.services.gamification_service import GamificationService

router = APIRouter()


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
        student_name=resolve_student_name(student),
        enrollment_number=student.enrollmentNumber,
    )


@router.post("/smart-pass/scan", response_model=StudentSmartPassScanResponse, status_code=status.HTTP_200_OK)
async def scan_smart_pass(
    data: StudentSmartPassScanRequest,
    student: Student = Depends(get_current_student),
) -> StudentSmartPassScanResponse:
    """The student scans the rotating QR on the teacher's screen. The device is bound at login."""
    await rate_limit_student(student.id, max_requests=15, window_seconds=60)
    record, occurrence, newly_marked = await occurrence_qr_service.mark_by_qr(
        student, data.qr_token, data.latitude, data.longitude, data.accuracy
    )
    section = await db.coursesection.find_unique(where={"id": occurrence.courseSectionId}, include={"subject": True})
    flagged = record.status == "FLAGGED"
    return StudentSmartPassScanResponse(
        status="success" if newly_marked else "already_marked",
        session_id=occurrence.id,
        class_name=section.name,
        subject=section.subject.name,
        attendance_status="Flagged" if flagged else "Present",
        student_name=resolve_student_name(student),
        enrollment_number=student.enrollmentNumber,
        marked_at=record.verifiedAt.isoformat(),
        message="Marked, but your teacher will review it." if flagged else "Attendance marked.",
    )


@router.get("/stats", response_model=StudentStatsResponse)
async def get_my_stats(student: Student = Depends(get_current_student)) -> StudentStatsResponse:
    stats = await GamificationService().get_student_stats(student.id)
    return StudentStatsResponse.model_validate(stats)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(student: Student = Depends(get_current_student)) -> LeaderboardResponse:
    board = await GamificationService().get_leaderboard(student.id)
    return LeaderboardResponse.model_validate(board)
