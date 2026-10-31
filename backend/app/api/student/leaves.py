import os
import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.api.student.helpers import (
    MAX_LEAVE_DOCUMENT_SIZE,
    VALID_LEAVE_DOCUMENT_TYPES,
    logger,
    resolve_student_name,
)
from app.db.client import db
from app.repositories.leave_repository import LeaveRepository
from app.schemas.leave import LeaveRequestListResponse, LeaveRequestResponse
from app.services.notification_service import notify_teacher_leave_submitted
from app.services.s3_service import s3_service

router = APIRouter()


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


@router.get("/leaves", response_model=LeaveRequestListResponse)
async def get_my_leaves(
    student: Student = Depends(get_current_student),
    leave_repo: LeaveRepository = Depends(),
) -> LeaveRequestListResponse:
    leaves = await leave_repo.get_by_student_id(student.id)
    leave_responses = [_make_leave_response(req, resolve_student_name(req.student)) for req in leaves]
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be after or equal to start date.")
    reason = reason.strip()
    if len(reason) < 5 or len(reason) > 500:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reason must be between 5 and 500 characters.")

    document_url = None
    if document and document.filename:
        if document.content_type not in VALID_LEAVE_DOCUMENT_TYPES:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported file type.")
        contents = await document.read()
        if len(contents) > MAX_LEAVE_DOCUMENT_SIZE:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File size exceeds 10 MB.")
        try:
            ext = os.path.splitext(document.filename)[1].lower() if document.filename else ".pdf"
            key = f"leaves/{uuid.uuid4()}{ext}"
            document_url = s3_service.upload_bytes(contents, key, content_type=document.content_type or "application/octet-stream")
        except Exception as exc:
            logger.error("Could not upload leave document: %s", exc)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save document.")

    leave = await leave_repo.create({
        "studentId": student.id,
        "startDate": datetime.combine(s_date, datetime.min.time()).replace(tzinfo=timezone.utc),
        "endDate": datetime.combine(e_date, datetime.max.time()).replace(tzinfo=timezone.utc),
        "reason": reason,
        "documentUrl": document_url,
        "status": "PENDING",
    })

    try:
        enrollments = await db.enrollment.find_many(where={"studentId": student.id}, include={"academicClass": {"include": {"teacher": True}}})
        notified_teachers = set()
        for enr in enrollments:
            if enr.academicClass and enr.academicClass.teacher and enr.academicClass.teacher.userId:
                t_user_id = enr.academicClass.teacher.userId
                if t_user_id not in notified_teachers:
                    notified_teachers.add(t_user_id)
                    await notify_teacher_leave_submitted(
                        teacher_user_id=t_user_id,
                        student_name=resolve_student_name(student),
                        class_name=enr.academicClass.name if enr.academicClass else None,
                        leave_id=leave.id,
                        start_date=start_date,
                        end_date=end_date,
                        reason=reason,
                    )
    except Exception as exc:
        logger.warning("Failed to notify teachers of leave: %s", exc)

    return _make_leave_response(leave, resolve_student_name(student), student.enrollmentNumber)
