from datetime import date
from fastapi import APIRouter, Depends, Query
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.schemas.student_timetable import StudentTimetableResponse
from app.services import student_timetable_service

router = APIRouter()


@router.get("/timetable", response_model=StudentTimetableResponse)
async def get_my_timetable(
    start: date = Query(..., alias="from", description="First day, YYYY-MM-DD"),
    end: date = Query(..., alias="to", description="Last day, YYYY-MM-DD (at most 14 days after the first)"),
    student: Student = Depends(get_current_student),
) -> StudentTimetableResponse:
    return await student_timetable_service.get_timetable(student, start, end)
