"""Tenant & Master Data API Workflows (Super Admin & Admin scopes)."""

from typing import Any, Dict, List
from app.core.logging_config import get_logger
from .client import APIClient

logger = get_logger("app.seeder.tenant")


async def provision_institutions(client: APIClient, institutions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Provision institutions via Super Admin API or load existing."""
    results = []
    # Fetch existing tenants to maintain idempotency
    existing_tenants_resp = await client.get("/super-admin/tenants?page=1&page_size=100")
    existing_by_slug = {t["slug"]: t for t in existing_tenants_resp.get("items", [])}

    for inst in institutions:
        slug = inst["slug"]
        if slug in existing_by_slug:
            existing = existing_by_slug[slug]
            logger.info("Institution '%s' (%s) already exists.", inst["name"], slug)
            results.append({**inst, "id": existing["id"]})
            continue

        payload = {
            "name": inst["name"],
            "slug": inst["slug"],
            "type": inst["type"],
            "domain": inst["domain"],
            "license_count": inst["license_count"],
            "admin_name": inst["admin_name"],
            "admin_email": inst["admin_email"],
            "admin_password": inst["admin_password"],
            "admins": [
                {
                    "name": inst["admin_name"],
                    "email": inst["admin_email"],
                    "role": inst.get("admin_role", "ADMIN"),
                }
            ],
            "config": {
                "isFaceRecognitionEnabled": True,
                "isGpsVerificationEnabled": True,
                "isAiBackgroundValidationEnabled": True,
                "geofenceRadiusMeters": 60,
            },
        }
        res = await client.post("/super-admin/tenants", json_data=payload)
        logger.info("Provisioned institution '%s' (ID: %s)", inst["name"], res["id"])
        results.append({**inst, "id": res["id"]})

    return results


async def seed_departments(client: APIClient, departments: List[Dict[str, Any]]) -> Dict[str, str]:
    """Seed academic departments via Admin API and return code->id map."""
    existing = await client.get("/admin/departments")
    dept_map = {d["code"]: d["id"] for d in existing}

    to_create = [d for d in departments if d["code"] not in dept_map]
    if to_create:
        payload = {"departments": to_create}
        await client.post("/admin/departments/bulk", json_data=payload)
        updated = await client.get("/admin/departments")
        dept_map = {d["code"]: d["id"] for d in updated}

    logger.info("Configured %d departments", len(dept_map))
    return dept_map


async def seed_designations(client: APIClient, designations: List[Dict[str, Any]]) -> Dict[str, str]:
    """Seed faculty designations via Admin API and return code->id map."""
    existing = await client.get("/admin/designations")
    desig_map = {d["code"]: d["id"] for d in existing}

    to_create = [d for d in designations if d["code"] not in desig_map]
    if to_create:
        payload = {"designations": to_create}
        await client.post("/admin/designations/bulk", json_data=payload)
        updated = await client.get("/admin/designations")
        desig_map = {d["code"]: d["id"] for d in updated}

    logger.info("Configured %d designations", len(desig_map))
    return desig_map


async def seed_classrooms(client: APIClient, classrooms: List[Dict[str, Any]]) -> Dict[str, str]:
    """Seed campus classrooms via Admin API and return name->id map."""
    existing = await client.get("/admin/classrooms")
    room_map = {r["name"]: r["id"] for r in existing}

    to_create = [r for r in classrooms if r["name"] not in room_map]
    if to_create:
        payload = {"classrooms": to_create}
        await client.post("/admin/classrooms/bulk", json_data=payload)
        updated = await client.get("/admin/classrooms")
        room_map = {r["name"]: r["id"] for r in updated}

    logger.info("Configured %d classrooms", len(room_map))
    return room_map


async def seed_subjects(
    client: APIClient, subjects: List[Dict[str, Any]], dept_map: Dict[str, str]
) -> Dict[str, str]:
    """Seed academic subjects via Admin API and return code->id map."""
    existing = await client.get("/admin/subjects")
    subject_map = {s["code"]: s["id"] for s in existing}

    to_create = []
    for s in subjects:
        if s["code"] not in subject_map:
            to_create.append(
                {
                    "name": s["name"],
                    "code": s["code"],
                    "department_id": dept_map.get(s["dept_code"]),
                }
            )

    if to_create:
        payload = {"subjects": to_create}
        await client.post("/admin/subjects/bulk", json_data=payload)
        updated = await client.get("/admin/subjects")
        subject_map = {s["code"]: s["id"] for s in updated}

    logger.info("Configured %d subjects", len(subject_map))
    return subject_map
