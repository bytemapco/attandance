from fastapi import APIRouter, Depends

from app.api.admin.academic_years import router as academic_years_router
from app.api.admin.classes import router as classes_router
from app.api.admin.classrooms import router as classrooms_router
from app.api.admin.departments import router as departments_router
from app.api.admin.designations import router as designations_router
from app.api.admin.licenses import router as licenses_router
from app.api.admin.students import router as students_router
from app.api.admin.subjects import router as subjects_router
from app.api.admin.system import router as system_router
from app.api.admin.teachers import router as teachers_router
from app.api.dependencies import RoleChecker

admin_protection = Depends(RoleChecker(allowed_roles=["ADMIN"]))
router = APIRouter(prefix="/admin", tags=["Admin System Operations"], dependencies=[admin_protection])

router.include_router(academic_years_router)
router.include_router(students_router)
router.include_router(teachers_router)
router.include_router(classes_router)
router.include_router(departments_router)
router.include_router(subjects_router)
router.include_router(classrooms_router)
router.include_router(designations_router)
router.include_router(licenses_router)
router.include_router(system_router)

__all__ = ["router"]
