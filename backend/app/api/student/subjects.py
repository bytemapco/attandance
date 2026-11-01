from typing import List
from fastapi import APIRouter, Depends
from prisma.models import Student

from app.api.dependencies import get_current_student
from app.schemas.student_occurrence import LiveClassResponse, StudentSubjectResponse
from app.services import student_subjects_service

router = APIRouter()


@router.get("/subjects", response_model=List[StudentSubjectResponse])
async def get_my_subjects(student: Student = Depends(get_current_student)) -> List[StudentSubjectResponse]:
    return await student_subjects_service.list_subjects(student)


@router.get("/live-classes", response_model=List[LiveClassResponse])
async def get_live_classes(student: Student = Depends(get_current_student)) -> List[LiveClassResponse]:
    return await student_subjects_service.list_live_classes(student)
