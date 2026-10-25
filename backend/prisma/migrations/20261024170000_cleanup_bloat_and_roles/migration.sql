-- ==============================================================================
-- Migration: 20261024170000_cleanup_bloat_and_roles
-- Description: Drop dead cohort_students.batch_id and prune unused Role enum values
-- ==============================================================================

-- 1. Drop dead foreign key constraint and column on cohort_students
ALTER TABLE "cohort_students" DROP CONSTRAINT IF EXISTS "cohort_students_batch_id_fkey";
ALTER TABLE "cohort_students" DROP COLUMN IF EXISTS "batch_id";

-- 2. Safely recreate PostgreSQL enum Role with only active roles
DO $$
BEGIN
    -- Create new pruned Role enum type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
        CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN');
    END IF;

    -- Update users table role column
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"Role_new";

    -- Update notifications table role column
    ALTER TABLE "notifications" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");

    -- Drop old enum and rename new enum
    DROP TYPE IF EXISTS "Role";
    ALTER TYPE "Role_new" RENAME TO "Role";
END $$;
