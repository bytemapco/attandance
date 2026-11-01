-- Geofences belong to a classroom (PRD 7.1). Course-section fences were never written by the app,
-- so no current data is lost. Admins set one fence per classroom again after this migration.

ALTER TABLE "geofences" DROP CONSTRAINT "geofences_course_section_id_fkey";
DROP INDEX "geofences_course_section_id_key";
ALTER TABLE "geofences" DROP COLUMN "course_section_id";

ALTER TABLE "geofences" ADD COLUMN "classroom_id" TEXT;
CREATE UNIQUE INDEX "geofences_classroom_id_key" ON "geofences"("classroom_id");
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_classroom_id_fkey"
  FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
