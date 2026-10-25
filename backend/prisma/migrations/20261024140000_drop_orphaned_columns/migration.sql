-- Drop completely orphaned columns from students table
ALTER TABLE "students" DROP COLUMN IF EXISTS "guardian_phone";
ALTER TABLE "students" DROP COLUMN IF EXISTS "guardian_email";

-- Drop redundant duplicate roll_no column from cohort_students table
ALTER TABLE "cohort_students" DROP COLUMN IF EXISTS "roll_no";
