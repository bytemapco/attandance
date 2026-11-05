from fastapi import APIRouter

from app.api.student.attendance import router as attendance_router
from app.api.student.profile import router as profile_router
from app.api.student.leaves import router as leaves_router
from app.api.student.gamification import router as gamification_router
from app.api.student.subjects import router as subjects_router
from app.api.student.timetable import router as timetable_router
from app.api.student.history import router as history_router

router = APIRouter(prefix="/student", tags=["Student Features"])

router.include_router(attendance_router)
router.include_router(profile_router)
router.include_router(leaves_router)
router.include_router(gamification_router)
router.include_router(subjects_router)
router.include_router(timetable_router)
router.include_router(history_router)

__all__ = ["router"]
