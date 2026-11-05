from fastapi import APIRouter, Depends
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.schemas.student_analytics import StudentAnalyticsResponse
from app.services import student_analytics_service

router = APIRouter()


@router.get("/analytics", response_model=StudentAnalyticsResponse)
async def get_my_analytics(student: Student = Depends(get_current_student)) -> StudentAnalyticsResponse:
    return await student_analytics_service.get_analytics(student)
