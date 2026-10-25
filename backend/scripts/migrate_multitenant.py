import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Ensure backend root is in sys.path
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from prisma import Prisma, Json

DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_TENANT_SLUG = "default-institution"
DEFAULT_TENANT_NAME = "Default Demo Institution"


async def run_migration():
    print("[MIGRATION] Starting multi-tenant database migration...")
    db = Prisma()
    await db.connect()

    try:
        # 1. Create or ensure default tenant exists
        existing_tenant = await db.tenant.find_unique(where={"slug": DEFAULT_TENANT_SLUG})
        if not existing_tenant:
            print(f"[MIGRATION] Creating default tenant: {DEFAULT_TENANT_NAME} ({DEFAULT_TENANT_SLUG})")
            default_tenant = await db.tenant.create(
                data={
                    "id": DEFAULT_TENANT_ID,
                    "slug": DEFAULT_TENANT_SLUG,
                    "name": DEFAULT_TENANT_NAME,
                    "type": "COLLEGE",
                    "status": "ACTIVE",
                    "licenseCount": 1000,
                    "config": Json(
                        {
                            "isFaceRecognitionEnabled": True,
                            "isGpsVerificationEnabled": True,
                            "isAiBackgroundValidationEnabled": True,
                            "geofenceRadiusMeters": 50,
                        }
                    ),
                }
            )
            print(f"[MIGRATION] Created default tenant with ID: {default_tenant.id}")
        else:
            print(f"[MIGRATION] Default tenant already exists with ID: {existing_tenant.id}")
            default_tenant = existing_tenant

        tenant_id = default_tenant.id

        # 2. Backfill existing records without tenant_id
        tables_to_backfill = [
            "users",
            "departments",
            "subjects",
            "classrooms",
            "designations",
            "classes",
            "audit_logs",
            "system_configurations",
        ]

        for table in tables_to_backfill:
            query = f"UPDATE {table} SET tenant_id = $1 WHERE tenant_id IS NULL;"
            count = await db.execute_raw(query, tenant_id)
            print(f"[MIGRATION] Backfilled {count} rows in table '{table}' with tenant_id: {tenant_id}")

        print("[MIGRATION] Multi-tenant migration completed successfully!")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(run_migration())
