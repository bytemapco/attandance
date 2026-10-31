from fastapi import APIRouter, Depends, HTTPException, status
from prisma.models import Teacher

from app.api.dependencies import get_current_teacher
from app.schemas.common import MessageResponse
from app.schemas.teacher import SessionResponse, SessionStart, SessionWithClassResponse, TeacherSmartPassResponse
from app.services.session_service import SessionService
from app.services.teacher_service import TeacherService

router = APIRouter()


@router.post("/sessions/start", response_model=SessionResponse)
async def start_session(
    data: SessionStart,
    teacher: Teacher = Depends(get_current_teacher),
    session_service: SessionService = Depends(),
) -> SessionResponse:
    try:
        session = await session_service.start_session(data, teacher.id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(err))

    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Could not open session. Class not found or unauthorized."
        )
    return session


@router.post("/sessions/{id}/stop", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def stop_session(
    id: str,
    teacher: Teacher = Depends(get_current_teacher),
    session_service: SessionService = Depends(),
) -> MessageResponse:
    if not await session_service.stop_session(id, teacher.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Session not found, already stopped, or unauthorized."
        )
    return MessageResponse(status="success", message="Session closed successfully.")


@router.get("/sessions/all", response_model=list[SessionWithClassResponse])
async def get_teacher_sessions(
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> list[SessionWithClassResponse]:
    return await teacher_service.get_teacher_sessions(user_id=teacher.userId)


@router.get("/sessions/{id}/smart-pass", response_model=TeacherSmartPassResponse, status_code=status.HTTP_200_OK)
async def get_session_smart_pass(
    id: str,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> TeacherSmartPassResponse:
    return await teacher_service.generate_session_smart_pass(user_id=teacher.userId, session_id=id)
