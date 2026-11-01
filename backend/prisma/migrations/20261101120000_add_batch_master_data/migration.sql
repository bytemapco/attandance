-- ==============================================================================
-- Migration: 20261101120000_add_batch_master_data
-- Description:
--   1. Add batch master data per department (code such as CE-A-1).
--   2. Add nullable batch_id to students and student_groups.
--   Legacy string batches are intentionally left untouched; they are re-assigned
--   through the new UI/CSV and removed in a later migration.
-- ==============================================================================

CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "batches_tenant_id_department_id_section_number_key"
    ON "batches"("tenant_id", "department_id", "section", "number");
CREATE UNIQUE INDEX "batches_tenant_id_code_key" ON "batches"("tenant_id", "code");
CREATE INDEX "batches_tenant_id_department_id_idx" ON "batches"("tenant_id", "department_id");

ALTER TABLE "batches" ADD CONSTRAINT "batches_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "batches" ADD CONSTRAINT "batches_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "students" ADD COLUMN "batch_id" TEXT;
CREATE INDEX "students_batch_id_idx" ON "students"("batch_id");
ALTER TABLE "students" ADD CONSTRAINT "students_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_groups" ADD COLUMN "batch_id" TEXT;
CREATE UNIQUE INDEX "student_groups_batch_id_key" ON "student_groups"("batch_id");
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_batch_id_fkey"
    FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
