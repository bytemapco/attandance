-- The institution's location is one point for the whole campus, set by the tenant admin in Settings,
-- and applied to every classroom. It replaces the per-classroom fence added in 20261101230000.

ALTER TABLE "geofences" DROP CONSTRAINT "geofences_classroom_id_fkey";
DROP INDEX "geofences_classroom_id_key";
ALTER TABLE "geofences" DROP COLUMN "classroom_id";

ALTER TABLE "system_configurations" ADD COLUMN "campus_latitude" DOUBLE PRECISION;
ALTER TABLE "system_configurations" ADD COLUMN "campus_longitude" DOUBLE PRECISION;
