from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_tenant_context
from app.schemas.academic_level import AcademicLevelCreate, AcademicLevelResponse, AcademicLevelUpdate
from app.schemas.common import MessageResponse
from app.services import academic_level_service

router = APIRouter()


@router.get("/academic-levels", response_model=list[AcademicLevelResponse])
async def list_academic_levels(tenant_id: str = Depends(get_tenant_context)) -> list[AcademicLevelResponse]:
    return await academic_level_service.list_levels(tenant_id)


@router.post("/academic-levels", response_model=AcademicLevelResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_level(
    data: AcademicLevelCreate, tenant_id: str = Depends(get_tenant_context)
) -> AcademicLevelResponse:
    return await academic_level_service.create_level(tenant_id, data.number, data.name, data.is_final)


@router.put("/academic-levels/{level_id}", response_model=AcademicLevelResponse)
async def update_academic_level(
    level_id: str, data: AcademicLevelUpdate, tenant_id: str = Depends(get_tenant_context)
) -> AcademicLevelResponse:
    return await academic_level_service.update_level(tenant_id, level_id, data.name, data.is_final)


@router.delete("/academic-levels/{level_id}", response_model=MessageResponse)
async def delete_academic_level(level_id: str, tenant_id: str = Depends(get_tenant_context)) -> MessageResponse:
    await academic_level_service.delete_level(tenant_id, level_id)
    return MessageResponse(message="Semester deleted.")
