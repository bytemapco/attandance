-- Attendance rules apply to the whole institution, not to each academic year.

ALTER TABLE "system_configurations"
    ADD COLUMN "min_attendance_pct" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    ADD COLUMN "verification_window_min" INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN "saturday_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Keep each institution's rules from its most recent academic year.
UPDATE "system_configurations" AS sc
SET "min_attendance_pct" = latest."min_attendance_pct",
    "verification_window_min" = latest."verification_window_min",
    "saturday_enabled" = latest."saturday_enabled"
FROM (
    SELECT DISTINCT ON ("tenant_id") "tenant_id", "min_attendance_pct", "verification_window_min", "saturday_enabled"
    FROM "academic_years"
    ORDER BY "tenant_id", "start_date" DESC
) AS latest
WHERE sc."tenant_id" = latest."tenant_id";

-- Institutions that have years but no configuration row yet get one.
INSERT INTO "system_configurations" ("id", "tenant_id", "updated_at", "min_attendance_pct", "verification_window_min", "saturday_enabled")
SELECT gen_random_uuid()::text, latest."tenant_id", NOW(), latest."min_attendance_pct", latest."verification_window_min", latest."saturday_enabled"
FROM (
    SELECT DISTINCT ON ("tenant_id") "tenant_id", "min_attendance_pct", "verification_window_min", "saturday_enabled"
    FROM "academic_years"
    ORDER BY "tenant_id", "start_date" DESC
) AS latest
WHERE NOT EXISTS (
    SELECT 1 FROM "system_configurations" AS sc WHERE sc."tenant_id" = latest."tenant_id"
);

ALTER TABLE "academic_years"
    DROP COLUMN "min_attendance_pct",
    DROP COLUMN "verification_window_min",
    DROP COLUMN "saturday_enabled";
