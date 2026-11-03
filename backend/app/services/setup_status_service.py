"""Onboarding progress for a tenant: what must exist before attendance can run.

Completion is derived from real data (counts), never ticked by hand. The only stored value is the
`onboarding.completedAt` marker in `Tenant.settings`.
"""
import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from prisma import Json

from app.db.client import db
from app.schemas.setup_status import SetupCheck, SetupIncompleteDetail, SetupStatusResponse
from app.services.super_admin_service import SuperAdminService

MASTER_DATA = "/admin/master-data"

# (id, label, required, count key, where the admin fixes it, message while it is missing)
_CHECK_SPECS: list[tuple[str, str, bool, str, str, str]] = [
    ("campus", "Campus location", True, "campus", "/admin/settings",
     "No campus location is set, so every attendance mark is flagged for review."),
    ("departments", "Departments", True, "departments", f"{MASTER_DATA}/departments",
     "Add at least one department."),
    ("designations", "Teacher", True, "designations", f"{MASTER_DATA}/designations",
     "Add at least one teacher."),
    ("subjects", "Subjects", True, "subjects", f"{MASTER_DATA}/subjects",
     "Add at least one subject. A class cannot be taught without one."),
    ("classrooms", "Classrooms", True, "classrooms", f"{MASTER_DATA}/classrooms",
     "Add at least one classroom."),
    ("teachers", "Teachers", False, "teachers", "/admin/users/teachers", "Add teachers when you are ready."),
    ("students", "Students", False, "students", "/admin/users/students", "Add students when you are ready."),
    ("classes", "First class", False, "classes", "/admin/class-management",
     "Create a class and give it a subject and a weekly schedule."),
]


async def _counts(tenant_id: str) -> dict[str, int]:
    where = {"tenantId": tenant_id}
    queries = {
        "departments": db.department.count(where=where),
        "designations": db.designation.count(where=where),
        "subjects": db.subject.count(where=where),
        "classrooms": db.classroom.count(where=where),
        "teachers": db.teacher.count(where=where),
        "students": db.student.count(where=where),
        "classes": db.studentgroup.count(where=where),
    }
    values = await asyncio.gather(*queries.values())
    return dict(zip(queries.keys(), values))


def _settings_dict(raw) -> dict:
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            return {}
    return dict(raw) if isinstance(raw, dict) else {}


def _completed_at(settings: dict) -> Optional[datetime]:
    marker = (settings.get("onboarding") or {}).get("completedAt")
    return datetime.fromisoformat(marker) if marker else None


def build_checks(counts: dict[str, int], campus_set: bool) -> list[SetupCheck]:
    checks = []
    for check_id, label, required, key, href, message in _CHECK_SPECS:
        done = campus_set if key == "campus" else counts[key] > 0
        checks.append(
            SetupCheck(
                id=check_id,
                label=label,
                required=required,
                done=done,
                count=None if key == "campus" else counts[key],
                blocker_message=None if done else message,
                href=href,
            )
        )
    return checks


async def _license_remaining(tenant_id: str) -> Optional[int]:
    try:
        usage = await SuperAdminService.get_tenant_license_usage(tenant_id=tenant_id)
        return usage.get("remaining")
    except Exception:
        return None


async def get_setup_status(tenant_id: str) -> SetupStatusResponse:
    tenant = await db.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found.")
    config = await db.systemconfiguration.find_first(where={"tenantId": tenant_id})
    campus_set = bool(config and config.campusLatitude is not None and config.campusLongitude is not None)
    counts, remaining = await asyncio.gather(_counts(tenant_id), _license_remaining(tenant_id))
    checks = build_checks(counts, campus_set)
    required = [c for c in checks if c.required]
    done = sum(1 for c in required if c.done)
    completed_at = _completed_at(_settings_dict(tenant.settings))
    return SetupStatusResponse(
        tenant_name=tenant.name,
        tenant_type=str(getattr(tenant.type, "value", tenant.type)),
        checks=checks,
        required_done=done,
        required_total=len(required),
        score=round(100 * done / len(required)),
        ready_to_complete=done == len(required),
        completed=completed_at is not None,
        completed_at=completed_at,
        license_remaining=remaining,
    )


async def complete_setup(tenant_id: str, actor_email: str) -> SetupStatusResponse:
    """Marks onboarding finished. Refuses while any required item is missing."""
    current = await get_setup_status(tenant_id)
    missing = [c.id for c in current.checks if c.required and not c.done]
    if missing:
        detail = SetupIncompleteDetail(message="Finish the required setup items first.", missing=missing)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail.model_dump())
    if current.completed:
        return current
    tenant = await db.tenant.find_unique(where={"id": tenant_id})
    settings = _settings_dict(tenant.settings)
    settings["onboarding"] = {"completedAt": datetime.now(timezone.utc).isoformat(), "completedBy": actor_email}
    await db.tenant.update(where={"id": tenant_id}, data={"settings": Json(settings)})
    return await get_setup_status(tenant_id)
