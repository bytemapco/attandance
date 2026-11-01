from fastapi import APIRouter, Depends
from app.api.dependencies import get_tenant_context
from app.schemas.batch import BatchCreate, BatchResponse, BatchStatusUpdate
from app.schemas.common import MessageResponse
from app.services import batch_service

router = APIRouter()


@router.get("/batches", response_model=list[BatchResponse])
async def list_batches(department_id: str | None = None, tenant_id: str = Depends(get_tenant_context)):
    return await batch_service.list_all_batches(tenant_id, department_id)


@router.get("/departments/{id}/batches", response_model=list[BatchResponse])
async def list_department_batches(id: str, tenant_id: str = Depends(get_tenant_context)):
    return await batch_service.list_batches(tenant_id, id)


@router.post("/departments/{id}/batches", response_model=BatchResponse, status_code=201)
async def create_department_batch(id: str, data: BatchCreate, tenant_id: str = Depends(get_tenant_context)):
    return await batch_service.create_batch(tenant_id, id, data)


@router.patch("/batches/{id}", response_model=BatchResponse)
async def update_batch_status(id: str, data: BatchStatusUpdate, tenant_id: str = Depends(get_tenant_context)):
    return await batch_service.set_batch_status(tenant_id, id, data.status)


@router.delete("/batches/{id}", response_model=MessageResponse)
async def delete_batch(id: str, tenant_id: str = Depends(get_tenant_context)):
    await batch_service.delete_batch(tenant_id, id)
    return MessageResponse(status="success", message="Batch deleted successfully")
