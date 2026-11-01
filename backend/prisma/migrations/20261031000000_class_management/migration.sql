-- ==============================================================================
-- Migration: 20261031000000_class_management
-- Description: Class management (a class = department + batch + semester;
--   batch is the student's batch, e.g. CSE-A-1):
--   1. Enums for group status, class member status and enrollment source.
--   2. semesters, student_groups, class_terms, class_members (all tenant scoped).
--   3. course_sections link to class_terms.
--   4. course_enrollments gain source and ended_at.
--   5. departments.code unique per tenant (fails loudly on duplicates).
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE "StudentGroupStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ClassMemberStatus" AS ENUM ('ACTIVE', 'DETAINED', 'TRANSFERRED', 'PROMOTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EnrollmentSource" AS ENUM ('CLASS', 'BACKLOG', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS "semesters" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "academic_year_id" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "student_groups" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "department_id" TEXT NOT NULL,
  "batch" TEXT NOT NULL,
  "status" "StudentGroupStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "class_terms" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "semester_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_terms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "class_members" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "class_term_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "status" "ClassMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMP(3),
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_members_pkey" PRIMARY KEY ("id")
);

-- 3. LINK COURSE SECTIONS / ENROLLMENTS
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "class_term_id" TEXT;
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "source" "EnrollmentSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "ended_at" TIMESTAMP(3);

-- 4. DEPARTMENT CODE UNIQUE PER TENANT (stop if existing data would violate it)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "departments" GROUP BY "tenant_id", "code" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate department codes exist within a tenant; resolve them before migrating';
  END IF;
END $$;

-- 5. INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS "departments_tenant_id_code_key" ON "departments"("tenant_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "semesters_tenant_id_academic_year_id_number_key" ON "semesters"("tenant_id", "academic_year_id", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "student_groups_tenant_id_department_id_batch_key" ON "student_groups"("tenant_id", "department_id", "batch");
CREATE INDEX IF NOT EXISTS "student_groups_tenant_id_status_idx" ON "student_groups"("tenant_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "class_terms_group_id_semester_id_key" ON "class_terms"("group_id", "semester_id");
CREATE INDEX IF NOT EXISTS "class_terms_tenant_id_semester_id_idx" ON "class_terms"("tenant_id", "semester_id");
CREATE UNIQUE INDEX IF NOT EXISTS "class_members_class_term_id_student_id_key" ON "class_members"("class_term_id", "student_id");
CREATE INDEX IF NOT EXISTS "class_members_tenant_id_student_id_status_idx" ON "class_members"("tenant_id", "student_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "class_members_one_active_per_student" ON "class_members"("student_id") WHERE "status" = 'ACTIVE';
CREATE INDEX IF NOT EXISTS "course_sections_class_term_id_idx" ON "course_sections"("class_term_id");

-- 6. FOREIGN KEYS (guarded so the migration can be re-run)
DO $$ BEGIN
  ALTER TABLE "semesters" ADD CONSTRAINT "semesters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  ALTER TABLE "class_terms" ADD CONSTRAINT "class_terms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "class_terms" ADD CONSTRAINT "class_terms_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "class_terms" ADD CONSTRAINT "class_terms_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  ALTER TABLE "class_members" ADD CONSTRAINT "class_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_term_id_fkey" FOREIGN KEY ("class_term_id") REFERENCES "class_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "class_members" ADD CONSTRAINT "class_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_class_term_id_fkey" FOREIGN KEY ("class_term_id") REFERENCES "class_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
