from fastapi import APIRouter, Depends
from prisma.models import User

from app.api.dependencies import get_current_user, get_tenant_context
from app.schemas.setup_status import SetupStatusResponse
from app.services import setup_status_service

router = APIRouter()


@router.get("/setup-status", response_model=SetupStatusResponse)
async def get_setup_status(tenant_id: str = Depends(get_tenant_context)) -> SetupStatusResponse:
    """What the institution still needs before attendance can run, with a readiness score."""
    return await setup_status_service.get_setup_status(tenant_id)


@router.post("/setup/complete", response_model=SetupStatusResponse)
async def complete_setup(
    tenant_id: str = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
) -> SetupStatusResponse:
    """Marks onboarding finished. Returns 409 with the missing items if any required one is not done."""
    return await setup_status_service.complete_setup(tenant_id, current_user.email)
