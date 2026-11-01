-- ==============================================================================
-- Migration: 20261101220000_academic_levels_master
-- Description:
--   1. Add the academic_levels master (the semesters an institution runs).
--   2. Seed Semester 1-8 for every existing institution, with 8 marked final.
--      The old range check capped existing data at 8, so nothing is left out.
--   3. Drop the hardcoded 1-8 range checks on students and semesters; the
--      application now validates against academic_levels instead.
-- ==============================================================================

BEGIN;

CREATE TABLE "academic_levels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "academic_levels_tenant_id_number_key" ON "academic_levels"("tenant_id", "number");
CREATE INDEX "academic_levels_tenant_id_idx" ON "academic_levels"("tenant_id");

ALTER TABLE "academic_levels" ADD CONSTRAINT "academic_levels_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "academic_levels" ("id", "tenant_id", "number", "name", "is_final")
SELECT gen_random_uuid()::text, t."id", n.number, 'Semester ' || n.number, n.number = 8
FROM "tenants" t
CROSS JOIN generate_series(1, 8) AS n(number);

ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_semester_range_chk";
ALTER TABLE "semesters" DROP CONSTRAINT IF EXISTS "semesters_number_range_chk";

COMMIT;
