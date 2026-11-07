-- Master data keeps only what the product uses: the department head, every description and the classroom
-- building are gone. Nothing reads them, and the imports and forms no longer take them.
ALTER TABLE "departments" DROP COLUMN "head", DROP COLUMN "description";
ALTER TABLE "designations" DROP COLUMN "description";
ALTER TABLE "subjects" DROP COLUMN "description";
ALTER TABLE "classrooms" DROP COLUMN "building";
