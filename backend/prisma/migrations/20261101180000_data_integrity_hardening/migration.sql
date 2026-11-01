-- ==============================================================================
-- Migration: 20261101180000_data_integrity_hardening
-- Description:
--   1. Merge duplicate designations, then enforce unique (tenant_id, code) on
--      designations and subjects.
--   2. Gender becomes an enum (M/F/O); unknown legacy values are set to NULL.
--   3. course_enrollments.status becomes an enum.
--   4. CHECK constraints for semester range, ISO weekday and date ordering.
--   5. Missing tenant foreign keys on leave/device/biometric/session tables.
-- ==============================================================================

BEGIN;

-- 1. Designations: repoint teachers to the oldest row per (tenant, code), drop the rest.
UPDATE "teachers" t
SET "designation_id" = k."keep_id"
FROM (
    SELECT d."id" AS "dup_id",
           FIRST_VALUE(d."id") OVER (PARTITION BY d."tenant_id", d."code" ORDER BY d."created_at", d."id") AS "keep_id"
    FROM "designations" d
) k
WHERE t."designation_id" = k."dup_id" AND k."dup_id" <> k."keep_id";

DELETE FROM "designations" d
USING "designations" keep
WHERE d."tenant_id" IS NOT DISTINCT FROM keep."tenant_id"
  AND d."code" = keep."code"
  AND (keep."created_at", keep."id") < (d."created_at", d."id");

CREATE UNIQUE INDEX IF NOT EXISTS "designations_tenant_id_code_key" ON "designations"("tenant_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_tenant_id_code_key" ON "subjects"("tenant_id", "code");

-- 2. Gender enum.
DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('M', 'F', 'O');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "students" ALTER COLUMN "gender" TYPE "Gender" USING (
    CASE UPPER(LEFT("gender", 1))
        WHEN 'M' THEN 'M'
        WHEN 'F' THEN 'F'
        WHEN 'O' THEN 'O'
    END
)::"Gender";

-- 3. Enrollment status enum.
DO $$ BEGIN
    CREATE TYPE "CourseEnrollmentStatus" AS ENUM ('ACTIVE', 'DROPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "course_enrollments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "course_enrollments" ALTER COLUMN "status" TYPE "CourseEnrollmentStatus"
    USING "status"::"CourseEnrollmentStatus";
ALTER TABLE "course_enrollments" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- 4. CHECK constraints (not expressible in schema.prisma).
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_semester_range_chk";
ALTER TABLE "students" ADD CONSTRAINT "students_semester_range_chk"
    CHECK ("semester" IS NULL OR "semester" BETWEEN 1 AND 8);

ALTER TABLE "semesters" DROP CONSTRAINT IF EXISTS "semesters_number_range_chk";
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_number_range_chk" CHECK ("number" BETWEEN 1 AND 8);
ALTER TABLE "semesters" DROP CONSTRAINT IF EXISTS "semesters_dates_chk";
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_dates_chk" CHECK ("end_date" >= "start_date");

ALTER TABLE "academic_years" DROP CONSTRAINT IF EXISTS "academic_years_dates_chk";
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_dates_chk" CHECK ("end_date" >= "start_date");

ALTER TABLE "timetable_rules" DROP CONSTRAINT IF EXISTS "timetable_rules_dow_chk";
ALTER TABLE "timetable_rules" ADD CONSTRAINT "timetable_rules_dow_chk" CHECK ("day_of_week" BETWEEN 1 AND 7);
ALTER TABLE "timetable_rules" DROP CONSTRAINT IF EXISTS "timetable_rules_dates_chk";
ALTER TABLE "timetable_rules" ADD CONSTRAINT "timetable_rules_dates_chk" CHECK ("effective_until" >= "effective_from");

ALTER TABLE "timetable_entries" DROP CONSTRAINT IF EXISTS "timetable_entries_dow_chk";
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_dow_chk" CHECK ("day_of_week" BETWEEN 1 AND 7);

-- 5. Tenant foreign keys (tables hold no orphan tenant ids).
ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "leave_requests_tenant_id_fkey";
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "device_change_requests" DROP CONSTRAINT IF EXISTS "device_change_requests_tenant_id_fkey";
ALTER TABLE "device_change_requests" ADD CONSTRAINT "device_change_requests_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_biometrics" DROP CONSTRAINT IF EXISTS "student_biometrics_tenant_id_fkey";
ALTER TABLE "student_biometrics" ADD CONSTRAINT "student_biometrics_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_devices" DROP CONSTRAINT IF EXISTS "student_devices_tenant_id_fkey";
ALTER TABLE "student_devices" ADD CONSTRAINT "student_devices_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_tenant_id_fkey";
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
