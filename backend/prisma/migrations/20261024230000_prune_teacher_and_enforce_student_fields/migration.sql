-- ==============================================================================
-- Migration: 20261024230000_prune_teacher_and_enforce_student_fields
-- Description: 
--   1. Drop bloated resume fields from teachers table (qualification, specialization, experience_years, joining_date).
--   2. Enforce clean schema alignment.
-- ==============================================================================

ALTER TABLE "teachers" DROP COLUMN IF EXISTS "qualification";
ALTER TABLE "teachers" DROP COLUMN IF EXISTS "specialization";
ALTER TABLE "teachers" DROP COLUMN IF EXISTS "experience_years";
ALTER TABLE "teachers" DROP COLUMN IF EXISTS "joining_date";
