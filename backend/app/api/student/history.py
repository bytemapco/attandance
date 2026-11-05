from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.schemas.student_history import HistoryStatus, StudentHistoryResponse
from app.services import student_history_service

router = APIRouter()


@router.get("/attendance/history", response_model=StudentHistoryResponse)
async def get_my_history(
    start: Optional[date] = Query(None, alias="from", description="First class date, YYYY-MM-DD"),
    end: Optional[date] = Query(None, alias="to", description="Last class date, YYYY-MM-DD"),
    course_section_id: Optional[str] = Query(None, description="Only this subject's classes"),
    status: Optional[HistoryStatus] = Query(None, description="Only classes with this outcome"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    student: Student = Depends(get_current_student),
) -> StudentHistoryResponse:
    return await student_history_service.get_history(student, start, end, course_section_id, status, limit, offset)
