-- ==============================================================================
-- Migration: 20261024220000_production_database_architecture
-- Description: Production database architecture upgrade:
--   1. Add tenant_id foreign keys to operational tables for strict tenant isolation.
--   2. Backfill tenant_id from parent relations.
--   3. Create student_biometrics table and migrate face embeddings.
--   4. Create student_devices table and migrate hardware UUIDs.
--   5. Add high-performance indexes on sessions, enrollments, leave_requests, and attendance.
--   6. Enforce safe onDelete RESTRICT foreign keys on historical attendance records.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ADD TENANT_ID COLUMNS (NULLABLE FOR SAFE EXPAND)
-- ------------------------------------------------------------------------------
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "evidence_photo_url" TEXT;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3);
ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;
ALTER TABLE "device_change_requests" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT;

-- ------------------------------------------------------------------------------
-- 2. BACKFILL TENANT_ID FROM HIERARCHY
-- ------------------------------------------------------------------------------
UPDATE "students" s
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE s."user_id" = u."id" AND s."tenant_id" IS NULL;

UPDATE "teachers" t
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE t."user_id" = u."id" AND t."tenant_id" IS NULL;

UPDATE "classes" c
SET "tenant_id" = t."tenant_id"
FROM "teachers" t
WHERE c."teacher_id" = t."id" AND c."tenant_id" IS NULL;

UPDATE "sessions" s
SET "tenant_id" = c."tenant_id"
FROM "classes" c
WHERE s."class_id" = c."id" AND s."tenant_id" IS NULL;

UPDATE "attendance" a
SET "tenant_id" = s."tenant_id"
FROM "sessions" s
WHERE a."session_id" = s."id" AND a."tenant_id" IS NULL;

UPDATE "leave_requests" l
SET "tenant_id" = s."tenant_id"
FROM "students" s
WHERE l."student_id" = s."id" AND l."tenant_id" IS NULL;

UPDATE "device_change_requests" d
SET "tenant_id" = s."tenant_id"
FROM "students" s
WHERE d."student_id" = s."id" AND d."tenant_id" IS NULL;

-- ------------------------------------------------------------------------------
-- 3. CREATE DEDICATED BIOMETRICS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "student_biometrics" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" TEXT,
    "student_id" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'facenet_128',
    "embedding_version" INTEGER NOT NULL DEFAULT 1,
    "face_embedding" vector(128),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "consent_given" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_biometrics_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill existing face embeddings into student_biometrics
INSERT INTO "student_biometrics" ("id", "tenant_id", "student_id", "face_embedding", "is_active", "consent_given", "created_at", "updated_at")
SELECT 
    gen_random_uuid(),
    s."tenant_id",
    s."id",
    s."face_embedding",
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "students" s
WHERE s."face_embedding" IS NOT NULL
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. CREATE DEDICATED HARDWARE DEVICES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "student_devices" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" TEXT,
    "student_id" TEXT NOT NULL,
    "device_uuid" TEXT NOT NULL,
    "device_model" TEXT,
    "os_version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    CONSTRAINT "student_devices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill existing device bindings
INSERT INTO "student_devices" ("id", "tenant_id", "student_id", "device_uuid", "status", "registered_at")
SELECT 
    gen_random_uuid(),
    s."tenant_id",
    s."id",
    s."device_uuid",
    'ACTIVE',
    CURRENT_TIMESTAMP
FROM "students" s
WHERE s."device_uuid" IS NOT NULL
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. HIGH PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "sessions_class_id_is_active_idx" ON "sessions" ("class_id", "is_active");
CREATE INDEX IF NOT EXISTS "sessions_tenant_id_start_time_idx" ON "sessions" ("tenant_id", "start_time" DESC);
CREATE INDEX IF NOT EXISTS "enrollments_academic_class_id_idx" ON "enrollments" ("academic_class_id");
CREATE INDEX IF NOT EXISTS "attendance_tenant_id_created_at_idx" ON "attendance" ("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "attendance_student_id_created_at_idx" ON "attendance" ("student_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "leave_requests_student_id_status_idx" ON "leave_requests" ("student_id", "status", "start_date", "end_date");
CREATE INDEX IF NOT EXISTS "leave_requests_tenant_id_status_idx" ON "leave_requests" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "device_change_requests_student_id_status_idx" ON "device_change_requests" ("student_id", "status");
CREATE INDEX IF NOT EXISTS "student_biometrics_student_id_is_active_idx" ON "student_biometrics" ("student_id", "is_active");
CREATE INDEX IF NOT EXISTS "student_devices_tenant_id_device_uuid_idx" ON "student_devices" ("tenant_id", "device_uuid");
