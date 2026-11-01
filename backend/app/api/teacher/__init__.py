from fastapi import APIRouter

from app.api.teacher.workflows import router as workflows_router

router = APIRouter(prefix="/teacher", tags=["Teacher Features"])

router.include_router(workflows_router)

__all__ = ["router"]
