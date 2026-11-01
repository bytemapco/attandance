-- ==============================================================================
-- Migration: 20261101000000_drop_student_branch_require_department
-- Description:
--   1. Drop the redundant free-text "branch" column on students (duplicated
--      the department relation; was unused/NULL on every row).
--   2. Enforce department_id as a required relation (all existing rows already
--      have one) and restrict deleting a department that still has students.
-- ==============================================================================

ALTER TABLE "students" DROP COLUMN IF EXISTS "branch";

ALTER TABLE "students" ALTER COLUMN "department_id" SET NOT NULL;

ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_department_id_fkey";
ALTER TABLE "students"
  ADD CONSTRAINT "students_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
