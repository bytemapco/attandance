"""Seed platform foundation entities (config, superadmin, tenant, admin, audit)."""

from datetime import datetime, timezone
import json
from app.core.security import hash_password
from scripts.seed_academic import seed_academic_structure


async def clean_database(db):
    table_rows = await db.query_raw("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    """)
    for row in table_rows:
        table_name = row["table_name"]
        if not table_name.startswith("_"):
            try:
                await db.execute_raw(f'TRUNCATE TABLE "{table_name}" CASCADE;')
            except Exception:
                pass


async def seed_entities(db):
    await clean_database(db)

    await db.systemconfiguration.create(
        data={
            "isFaceRecognitionEnabled": True,
            "isGpsVerificationEnabled": True,
            "isAiBackgroundValidationEnabled": True,
            "geofenceRadiusMeters": 50,
        }
    )

    super_admin_email = "superadmin@yopmail.com"
    super_admin_pass = "SuperAdmin@123"
    super_admin = await db.user.create(
        data={
            "email": super_admin_email,
            "hashedPassword": hash_password(super_admin_pass),
            "role": "SUPER_ADMIN",
            "isActive": True,
        }
    )

    tenant = await db.tenant.create(
        data={
            "slug": "apex-institute",
            "name": "Apex Institute of Technology",
            "type": "COLLEGE",
            "status": "ACTIVE",
            "domain": "apex.yopmail.com",
            "licenseCount": 500,
        }
    )

    admin_email = "admin.apex@yopmail.com"
    admin_pass = "Admin@Apex123"
    await db.user.create(
        data={
            "email": admin_email,
            "hashedPassword": hash_password(admin_pass),
            "role": "TENANT_ADMIN",
            "tenantId": tenant.id,
            "isActive": True,
        }
    )

    academic_creds = await seed_academic_structure(db, tenant.id)

    now = datetime.now(timezone.utc)
    await db.auditlog.create(
        data={
            "actor": super_admin_email,
            "actorId": super_admin.id,
            "tenantId": tenant.id,
            "eventType": "GLOBAL_BROADCAST",
            "severity": "INFO",
            "target": "ALL",
            "description": "System operational and ready for use.",
            "ipAddress": "127.0.0.1",
            "metadata": json.dumps({
                "title": "Welcome to Smart Attendance",
                "category": "system",
                "type": "info",
                "delivered_count": 1,
            }),
            "timestamp": now,
        }
    )

    return {
        "super_admin": (super_admin_email, super_admin_pass),
        "tenant_admin": (admin_email, admin_pass),
        "teacher": academic_creds["teacher"],
        "student": academic_creds["student"],
        "now": now,
    }
