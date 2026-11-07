-- Master data keeps only what the product uses: the department head, every description and the classroom
-- building are gone. Nothing reads them, and the imports and forms no longer take them.
-- Runs before `prisma db push`, which refuses to drop a column that still holds values.
ALTER TABLE "departments" DROP COLUMN IF EXISTS "head", DROP COLUMN IF EXISTS "description";
ALTER TABLE "designations" DROP COLUMN IF EXISTS "description";
ALTER TABLE "subjects" DROP COLUMN IF EXISTS "description";
ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "building";
