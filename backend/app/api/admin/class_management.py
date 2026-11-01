from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.dependencies import get_tenant_context
from app.schemas.class_management import (
    ClassCreate,
    ClassDetail,
    ClassMemberMove,
    ClassMemberRemove,
    ClassMembersAdd,
    ClassSectionCreate,
    ClassSectionUpdate,
    ClassUpdate,
    SectionScheduleCreate,
    ClassSummary,
)
from app.services.class_management import (
    class_member_service,
    class_schedule_service,
    class_section_service,
    class_service,
)

router = APIRouter(prefix="/class-management", tags=["Class Management"])


@router.get("/classes", response_model=List[ClassSummary])
async def list_classes(
    department_id: Optional[str] = Query(None),
    semester_number: Optional[int] = Query(None, ge=1, le=12),
    search: Optional[str] = Query(None, max_length=50),
    tenant_id: str = Depends(get_tenant_context),
):
    return await class_service.list_classes(tenant_id, department_id, semester_number, search)


@router.post("/classes", response_model=ClassDetail, status_code=status.HTTP_201_CREATED)
async def create_class(data: ClassCreate, tenant_id: str = Depends(get_tenant_context)):
    return await class_service.create_class(tenant_id, data)


@router.get("/classes/{class_id}", response_model=ClassDetail)
async def get_class(class_id: str, tenant_id: str = Depends(get_tenant_context)):
    return await class_service.get_class(tenant_id, class_id)


@router.patch("/classes/{class_id}", response_model=ClassDetail)
async def update_class(class_id: str, data: ClassUpdate, tenant_id: str = Depends(get_tenant_context)):
    return await class_service.update_class(tenant_id, class_id, data)


@router.post("/classes/{class_id}/members", response_model=ClassDetail)
async def add_members(class_id: str, data: ClassMembersAdd, tenant_id: str = Depends(get_tenant_context)):
    return await class_member_service.add_members(tenant_id, class_id, data.student_ids)


@router.post("/classes/{class_id}/members/{student_id}/move", response_model=ClassDetail)
async def move_member(
    class_id: str, student_id: str, data: ClassMemberMove, tenant_id: str = Depends(get_tenant_context)
):
    return await class_member_service.move_member(tenant_id, class_id, student_id, data)


@router.post("/classes/{class_id}/members/{student_id}/remove", response_model=ClassDetail)
async def remove_member(
    class_id: str, student_id: str, data: ClassMemberRemove, tenant_id: str = Depends(get_tenant_context)
):
    return await class_member_service.remove_member(tenant_id, class_id, student_id, data)


@router.post("/classes/{class_id}/sections", response_model=ClassDetail, status_code=status.HTTP_201_CREATED)
async def create_section(class_id: str, data: ClassSectionCreate, tenant_id: str = Depends(get_tenant_context)):
    return await class_section_service.create_section(tenant_id, class_id, data)


@router.put("/classes/{class_id}/sections/{section_id}", response_model=ClassDetail)
async def update_section(
    class_id: str, section_id: str, data: ClassSectionUpdate, tenant_id: str = Depends(get_tenant_context)
):
    return await class_section_service.update_section(tenant_id, class_id, section_id, data)


@router.delete("/classes/{class_id}/sections/{section_id}", response_model=ClassDetail)
async def delete_section(class_id: str, section_id: str, tenant_id: str = Depends(get_tenant_context)):
    return await class_section_service.delete_section(tenant_id, class_id, section_id)


@router.post(
    "/classes/{class_id}/sections/{section_id}/schedule", response_model=ClassDetail, status_code=status.HTTP_201_CREATED
)
async def add_schedule_slot(
    class_id: str, section_id: str, data: SectionScheduleCreate, tenant_id: str = Depends(get_tenant_context)
):
    return await class_schedule_service.add_slot(tenant_id, class_id, section_id, data)


@router.delete("/classes/{class_id}/sections/{section_id}/schedule/{rule_id}", response_model=ClassDetail)
async def remove_schedule_slot(
    class_id: str, section_id: str, rule_id: str, tenant_id: str = Depends(get_tenant_context)
):
    return await class_schedule_service.remove_slot(tenant_id, class_id, section_id, rule_id)
