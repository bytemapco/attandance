-- Remove classroom capacity and class max_students columns
ALTER TABLE "classrooms" DROP COLUMN "capacity";

ALTER TABLE "classes" DROP COLUMN "max_students";
