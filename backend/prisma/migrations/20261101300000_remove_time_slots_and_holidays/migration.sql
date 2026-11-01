-- Remove the fixed time slot list and the holiday calendar.
-- A weekly rule and a class session now store their own start and end times.

-- 1. Weekly rules keep the times of the slot they used.
ALTER TABLE "timetable_rules" ADD COLUMN "start_time" TEXT, ADD COLUMN "end_time" TEXT;

UPDATE "timetable_rules" AS r
SET "start_time" = s."start_time", "end_time" = s."end_time"
FROM "time_slots" AS s
WHERE s."id" = r."time_slot_id";

ALTER TABLE "timetable_rules" ALTER COLUMN "start_time" SET NOT NULL, ALTER COLUMN "end_time" SET NOT NULL;
ALTER TABLE "timetable_rules" DROP COLUMN "time_slot_id";
CREATE UNIQUE INDEX "timetable_rules_course_section_id_day_of_week_start_time_key"
    ON "timetable_rules"("course_section_id", "day_of_week", "start_time");
CREATE INDEX "timetable_rules_tenant_id_day_of_week_start_time_idx"
    ON "timetable_rules"("tenant_id", "day_of_week", "start_time");

-- 2. Class sessions keep the times of the slot they used.
ALTER TABLE "class_occurrences" ADD COLUMN "start_time" TEXT, ADD COLUMN "end_time" TEXT;

UPDATE "class_occurrences" AS o
SET "start_time" = s."start_time", "end_time" = s."end_time"
FROM "time_slots" AS s
WHERE s."id" = o."time_slot_id";

ALTER TABLE "class_occurrences" ALTER COLUMN "start_time" SET NOT NULL, ALTER COLUMN "end_time" SET NOT NULL;
ALTER TABLE "class_occurrences" DROP COLUMN "time_slot_id";
CREATE UNIQUE INDEX "class_occurrences_course_section_id_date_start_time_key"
    ON "class_occurrences"("course_section_id", "date", "start_time");

-- 3. The slot list and the holiday calendar.
DROP TABLE "time_slots";
DROP TABLE "academic_calendar_events";
DROP TYPE "CalendarEventType";
