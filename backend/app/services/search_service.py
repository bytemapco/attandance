from typing import Optional
from prisma.models import User
from app.schemas.search import GlobalSearchResponse
from app.services.search.admin_search_service import AdminSearchService
from app.services.search.super_admin_search_service import SuperAdminSearchService
from app.services.search.teacher_search_service import TeacherSearchService


class GlobalSearchService:
    async def search(self, user: User, query: str) -> GlobalSearchResponse:
        clean_query = query.strip()
        tenant_id = getattr(user, "tenantId", None)
        if user.role in ("ADMIN", "TENANT_ADMIN"):
            return await self.search_for_admin(user.id, clean_query, tenant_id=tenant_id)
        elif user.role == "TEACHER":
            return await self.search_for_teacher(user.id, clean_query)
        elif user.role == "SUPER_ADMIN":
            return await self.search_for_super_admin(user.id, clean_query)
        else:
            return GlobalSearchResponse(query=clean_query, total_results=0, results=[])

    async def search_for_teacher(self, user_id: str, query: str) -> GlobalSearchResponse:
        return await TeacherSearchService.search(user_id=user_id, query=query)

    async def search_for_admin(
        self, user_id: str, query: str, tenant_id: Optional[str] = None
    ) -> GlobalSearchResponse:
        return await AdminSearchService.search(user_id=user_id, query=query, tenant_id=tenant_id)

    async def search_for_super_admin(self, user_id: str, query: str) -> GlobalSearchResponse:
        return await SuperAdminSearchService.search(user_id=user_id, query=query)
