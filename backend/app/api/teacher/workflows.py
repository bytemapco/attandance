from fastapi import APIRouter, Depends, HTTPException, status
from prisma.models import Teacher

from app.api.dependencies import get_current_teacher
from app.repositories.leave_repository import LeaveRepository
from app.schemas.common import MessageResponse
from app.schemas.leave import LeaveRequestApprove, LeaveRequestResponse
from app.schemas.teacher import DeviceChangeApprove, DeviceChangeResponse
from app.services.device_change_service import DeviceChangeService
from app.services.leave_service import LeaveService
from app.services.s3_service import s3_service

router = APIRouter()


def _make_leave_response(leave) -> LeaveRequestResponse:
    name = f"{leave.student.firstName or ''} {leave.student.lastName or ''}".strip()
    document_url = s3_service.generate_presigned_url(leave.documentUrl) if leave.documentUrl else None
    return LeaveRequestResponse(
        id=leave.id,
        student_id=leave.studentId,
        student_name=name or "Unknown",
        enrollment_number=leave.student.enrollmentNumber,
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


@router.get("/leaves/pending", response_model=list[LeaveRequestResponse])
async def get_pending_leaves(
    teacher: Teacher = Depends(get_current_teacher),
    leave_repo: LeaveRepository = Depends(),
) -> list[LeaveRequestResponse]:
    return [_make_leave_response(leave) for leave in await leave_repo.get_pending_for_teacher(teacher.id)]


@router.put("/leaves/{leave_id}/approve", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def approve_leave(
    leave_id: str,
    data: LeaveRequestApprove,
    teacher: Teacher = Depends(get_current_teacher),
    leave_service: LeaveService = Depends(),
) -> MessageResponse:
    result = await leave_service.approve_leave(
        leave_id=leave_id, teacher_id=teacher.id, status=data.status, approver_note=data.approver_note
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")
    return MessageResponse(status="success", message=f"Leave request {data.status.lower()} successfully.")


@router.get("/device-changes/pending", response_model=list[DeviceChangeResponse])
async def get_pending_device_changes(
    teacher: Teacher = Depends(get_current_teacher),
    device_change_service: DeviceChangeService = Depends(),
) -> list[DeviceChangeResponse]:
    return await device_change_service.get_pending_requests(teacher_id=teacher.id)


@router.put("/device-changes/{request_id}/approve", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def approve_device_change(
    request_id: str,
    data: DeviceChangeApprove,
    teacher: Teacher = Depends(get_current_teacher),
    device_change_service: DeviceChangeService = Depends(),
) -> MessageResponse:
    result = await device_change_service.approve_request(
        request_id=request_id, teacher_id=teacher.id, new_status=data.status
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Device change request not found or not pending."
        )
    return MessageResponse(status="success", message=f"Device change request {data.status.lower()} successfully.")
