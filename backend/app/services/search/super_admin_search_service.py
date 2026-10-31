from typing import List
from app.db.client import db
from app.schemas.search import GlobalSearchResponse, SearchResultItem


class SuperAdminSearchService:
    @classmethod
    async def search(cls, user_id: str, query: str) -> GlobalSearchResponse:
        results: List[SearchResultItem] = []

        actions = [
            SearchResultItem(
                id="super-act-provision",
                title="Provision Institution",
                subtitle="Onboard a new campus or college",
                category="action",
                href="/super-admin/tenants/provision",
                icon_type="building",
                badge="Create",
            ),
            SearchResultItem(
                id="super-act-tenants",
                title="Manage Institutions",
                subtitle="View campus directories and configurations",
                category="action",
                href="/super-admin/tenants",
                icon_type="building",
                badge="Manage",
            ),
            SearchResultItem(
                id="super-act-licenses",
                title="License Requests",
                subtitle="Review pending seat expansions",
                category="action",
                href="/super-admin/licenses",
                icon_type="key",
                badge="Licenses",
            ),
            SearchResultItem(
                id="super-act-system",
                title="System Status",
                subtitle="Database health, cache, and service telemetry",
                category="action",
                href="/super-admin/system",
                icon_type="activity",
                badge="System",
            ),
            SearchResultItem(
                id="super-act-audit",
                title="Audit Trail",
                subtitle="Platform security events and authentication logs",
                category="action",
                href="/super-admin/audit",
                icon_type="scroll-text",
                badge="Security",
            ),
            SearchResultItem(
                id="super-act-broadcasts",
                title="Platform Announcements",
                subtitle="Broadcast system-wide notices",
                category="action",
                href="/super-admin/broadcasts",
                icon_type="radio",
                badge="Broadcast",
            ),
        ]

        if not query:
            return GlobalSearchResponse(query=query, total_results=len(actions), results=actions)

        q_lower = query.lower()
        for act in actions:
            if q_lower in act.title.lower() or (act.subtitle and q_lower in act.subtitle.lower()):
                results.append(act)

        tenants = await db.tenant.find_many(
            where={
                "OR": [
                    {"name": {"contains": query, "mode": "insensitive"}},
                    {"slug": {"contains": query, "mode": "insensitive"}},
                    {"code": {"contains": query, "mode": "insensitive"}},
                ]
            },
            take=10,
        )
        for t in tenants:
            t_type = t.type.capitalize() if hasattr(t, "type") and t.type else "Campus"
            t_code = f"Code: {t.code}" if getattr(t, "code", None) else f"Slug: {t.slug}"
            results.append(
                SearchResultItem(
                    id=f"tenant-{t.id}",
                    title=t.name,
                    subtitle=f"{t_type} • {t_code}",
                    category="tenant",
                    href=f"/super-admin/tenants/{t.id}",
                    icon_type="building",
                    badge="Institution",
                )
            )

        return GlobalSearchResponse(query=query, total_results=len(results), results=results)
