from fastapi import APIRouter

from app.api.teacher.sessions import router as sessions_router
from app.api.teacher.attendance import router as attendance_router
from app.api.teacher.classes import router as classes_router
from app.api.teacher.workflows import router as workflows_router

router = APIRouter(prefix="/teacher", tags=["Teacher Features"])

router.include_router(sessions_router)
router.include_router(attendance_router)
router.include_router(classes_router)
router.include_router(workflows_router)

__all__ = ["router"]
