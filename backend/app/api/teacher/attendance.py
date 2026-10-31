from fastapi import APIRouter, Depends, HTTPException, status
from prisma.models import Teacher

from app.api.dependencies import get_current_teacher
from app.db.client import db
from app.repositories.attendance_repository import AttendanceRepository
from app.schemas.attendance import AttendanceReview, FlaggedAttendanceResponse
from app.schemas.common import BulkActionCountResponse, MessageResponse
from app.schemas.teacher import (
    AbsentStudentItem,
    AttendanceManualOverride,
    BulkMarkRequest,
    SessionAttendanceResponse,
    SmartPassVerifyRequest,
    SmartPassVerifyResponse,
)
from app.services.attendance_service import AttendanceService
from app.services.teacher_service import TeacherService

router = APIRouter()


@router.get("/attendance/flagged", response_model=list[FlaggedAttendanceResponse])
async def get_flagged_attendance(
    teacher: Teacher = Depends(get_current_teacher),
    attendance_repo: AttendanceRepository = Depends(),
) -> list[FlaggedAttendanceResponse]:
    classes = await db.academicclass.find_many(where={"teacherId": teacher.id})
    my_class_ids = [c.id for c in classes]
    records = await db.attendance.find_many(
        where={"status": "Flagged", "session": {"is": {"academicClassId": {"in": my_class_ids}}}},
        include={
            "student": {"include": {"user": True}},
            "session": {"include": {"academicClass": {"include": {"subject": True}}}},
        },
    )
    return [
        FlaggedAttendanceResponse(
            id=r.id,
            enrollment_number=r.student.enrollmentNumber if r.student else "N/A",
            student_name=f"{r.student.firstName or ''} {r.student.lastName or ''}".strip() if r.student else "Unknown Student",
            class_name=ac.subject.name if (ac := r.session.academicClass if r.session else None) and ac.subject else (ac.name if ac else "N/A"),
            subject=ac.subject.name if ac and ac.subject else (ac.name if ac else "N/A"),
            face_score=r.faceScore,
            liveness_score=r.livenessScore,
            background_score=r.backgroundScore,
            final_ai_score=r.finalAiScore,
            gps_latitude=r.gpsLatitude,
            gps_longitude=r.gpsLongitude,
            created_at=r.createdAt,
            student_note=r.studentNote,
        )
        for r in records
    ]


@router.get("/attendance/{id}", response_model=FlaggedAttendanceResponse)
async def get_attendance_by_id(
    id: str,
    teacher: Teacher = Depends(get_current_teacher),
    attendance_repo: AttendanceRepository = Depends(),
):
    r = await attendance_repo.get_by_id(id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    ac = r.session.academicClass if r.session else None
    if ac and ac.teacherId != teacher.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this class attendance record")
    return FlaggedAttendanceResponse(
        id=r.id,
        enrollment_number=r.student.enrollmentNumber if r.student else "N/A",
        student_name=f"{r.student.firstName or ''} {r.student.lastName or ''}".strip() if r.student else "Unknown Student",
        class_name=ac.name if ac else "N/A",
        subject=ac.subject.name if ac and ac.subject else (ac.name if ac else "N/A"),
        face_score=r.faceScore,
        liveness_score=r.livenessScore,
        background_score=r.backgroundScore,
        final_ai_score=r.finalAiScore,
        gps_latitude=r.gpsLatitude,
        gps_longitude=r.gpsLongitude,
        created_at=r.createdAt,
        student_note=r.studentNote,
    )


@router.put("/attendance/{id}/review", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def review_flagged_attendance(
    id: str,
    review: AttendanceReview,
    teacher: Teacher = Depends(get_current_teacher),
    attendance_service: AttendanceService = Depends(),
) -> MessageResponse:
    if not await attendance_service.review_attendance(attendance_id=id, status=review.status, remarks=review.remarks, teacher_id=teacher.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance record not found, is not currently flagged, or review failed.")
    return MessageResponse(status="success", message=f"Attendance record has been {review.status}.")


@router.get("/sessions/{session_id}/attendance", response_model=SessionAttendanceResponse)
async def get_session_attendance(
    session_id: str,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> SessionAttendanceResponse:
    return await teacher_service.get_session_attendance_roll(user_id=teacher.userId, session_id=session_id)


@router.post("/sessions/{session_id}/override", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def manual_override_attendance(
    session_id: str,
    data: AttendanceManualOverride,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> MessageResponse:
    if not await teacher_service.manual_override_attendance(user_id=teacher.userId, session_id=session_id, student_id=data.student_id, status_val=data.status):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to apply attendance manual override.")
    return MessageResponse(status="success", message=f"Attendance overridden to {data.status}.")


@router.get("/sessions/{session_id}/absent-students", response_model=list[AbsentStudentItem])
async def get_absent_students(
    session_id: str,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> list[AbsentStudentItem]:
    return await teacher_service.get_absent_students(session_id=session_id, user_id=teacher.userId)


@router.post("/sessions/{session_id}/mark-bulk", response_model=BulkActionCountResponse, status_code=status.HTTP_200_OK)
async def bulk_mark_attendance(
    session_id: str,
    data: BulkMarkRequest,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> BulkActionCountResponse:
    count = await teacher_service.bulk_mark_attendance(session_id=session_id, user_id=teacher.userId, request=data)
    return BulkActionCountResponse(status="success", count=count)


@router.post("/smart-pass/verify", response_model=SmartPassVerifyResponse, status_code=status.HTTP_200_OK)
async def verify_smart_pass(
    data: SmartPassVerifyRequest,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> SmartPassVerifyResponse:
    return await teacher_service.verify_smart_pass(user_id=teacher.userId, session_id=data.session_id, qr_token=data.qr_token)
