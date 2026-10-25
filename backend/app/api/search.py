from fastapi import APIRouter, Depends, Query
from prisma.models import User

from app.api.dependencies import get_current_user
from app.schemas.search import GlobalSearchResponse
from app.services.search_service import GlobalSearchService

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("", response_model=GlobalSearchResponse)
async def global_search(
    q: str = Query("", description="Search query string"),
    user: User = Depends(get_current_user),
    search_service: GlobalSearchService = Depends(),
) -> GlobalSearchResponse:
    return await search_service.search(user=user, query=q)
