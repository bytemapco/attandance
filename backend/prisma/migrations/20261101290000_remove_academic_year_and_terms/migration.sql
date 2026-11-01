-- Remove the academic year, semester, and class-term system.
-- A class is a StudentGroup with a plain semester number. Its members and subjects belong to it directly.

-- 1. The class semester number: copy it from the class's latest term.
ALTER TABLE "student_groups" ADD COLUMN "semester" INTEGER NOT NULL DEFAULT 1;

UPDATE "student_groups" AS g
SET "semester" = latest."number"
FROM (
    SELECT DISTINCT ON (t."group_id") t."group_id", s."number"
    FROM "class_terms" AS t
    JOIN "semesters" AS s ON s."id" = t."semester_id"
    ORDER BY t."group_id", s."start_date" DESC, t."created_at" DESC
) AS latest
WHERE g."id" = latest."group_id";

-- 2. Members belong to the class. Keep one row per student, preferring the active one.
ALTER TABLE "class_members" ADD COLUMN "group_id" TEXT;

UPDATE "class_members" AS m
SET "group_id" = t."group_id"
FROM "class_terms" AS t
WHERE t."id" = m."class_term_id";

DELETE FROM "class_members" AS m
USING (
    SELECT "id", ROW_NUMBER() OVER (
        PARTITION BY "group_id", "student_id"
        ORDER BY ("status" = 'ACTIVE') DESC, "joined_at" DESC
    ) AS rank
    FROM "class_members"
) AS ranked
WHERE m."id" = ranked."id" AND ranked.rank > 1;

ALTER TABLE "class_members" ALTER COLUMN "group_id" SET NOT NULL;
ALTER TABLE "class_members" DROP COLUMN "class_term_id";
CREATE UNIQUE INDEX "class_members_group_id_student_id_key" ON "class_members"("group_id", "student_id");
ALTER TABLE "class_members"
    ADD CONSTRAINT "class_members_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Statuses that only promotion used. Closed rows become TRANSFERRED, graduated classes ARCHIVED.
UPDATE "class_members" SET "status" = 'TRANSFERRED' WHERE "status" IN ('DETAINED', 'PROMOTED');
UPDATE "student_groups" SET "status" = 'ARCHIVED' WHERE "status" = 'GRADUATED';

DROP INDEX "class_members_one_active_per_student";
ALTER TYPE "ClassMemberStatus" RENAME TO "ClassMemberStatus_old";
CREATE TYPE "ClassMemberStatus" AS ENUM ('ACTIVE', 'TRANSFERRED');
ALTER TABLE "class_members" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "class_members" ALTER COLUMN "status" TYPE "ClassMemberStatus" USING "status"::text::"ClassMemberStatus";
ALTER TABLE "class_members" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "ClassMemberStatus_old";
CREATE UNIQUE INDEX "class_members_one_active_per_student" ON "class_members"("student_id") WHERE "status" = 'ACTIVE';

ALTER TYPE "StudentGroupStatus" RENAME TO "StudentGroupStatus_old";
CREATE TYPE "StudentGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
ALTER TABLE "student_groups" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "student_groups" ALTER COLUMN "status" TYPE "StudentGroupStatus" USING "status"::text::"StudentGroupStatus";
ALTER TABLE "student_groups" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "StudentGroupStatus_old";

-- 4. Course sections belong to the class, not to a year. The new unique index fails if two sections now clash.
ALTER TABLE "course_sections" ADD COLUMN "group_id" TEXT;

UPDATE "course_sections" AS s
SET "group_id" = t."group_id"
FROM "class_terms" AS t
WHERE t."id" = s."class_term_id";

ALTER TABLE "course_sections" DROP COLUMN "class_term_id", DROP COLUMN "academic_year_id";
CREATE UNIQUE INDEX "course_sections_tenant_id_subject_id_name_batch_key"
    ON "course_sections"("tenant_id", "subject_id", "name", "batch");
CREATE INDEX "course_sections_tenant_id_idx" ON "course_sections"("tenant_id");
CREATE INDEX "course_sections_group_id_idx" ON "course_sections"("group_id");
ALTER TABLE "course_sections"
    ADD CONSTRAINT "course_sections_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "student_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Weekly rules of a class run until removed, so they no longer stop at a semester's end date.
ALTER TABLE "timetable_rules" ALTER COLUMN "effective_until" DROP NOT NULL;

UPDATE "timetable_rules" AS r
SET "effective_until" = NULL
FROM "course_sections" AS s
WHERE s."id" = r."course_section_id" AND s."group_id" IS NOT NULL;

-- 6. Holidays and overrides belong to the institution.
DELETE FROM "academic_calendar_events" AS a
USING "academic_calendar_events" AS b
WHERE a."tenant_id" = b."tenant_id" AND a."date" = b."date" AND a."event_type" = b."event_type" AND a."id" > b."id";

ALTER TABLE "academic_calendar_events" DROP COLUMN "academic_year_id";
CREATE UNIQUE INDEX "academic_calendar_events_tenant_id_date_event_type_key"
    ON "academic_calendar_events"("tenant_id", "date", "event_type");

-- 7. The legacy class table no longer points at a year.
ALTER TABLE "classes" DROP COLUMN "academic_year_id";

-- 8. The year, semester, and term tables.
DROP TABLE "class_terms";
DROP TABLE "semesters";
DROP TABLE "academic_years";
DROP TYPE "AcademicPeriodStatus";
