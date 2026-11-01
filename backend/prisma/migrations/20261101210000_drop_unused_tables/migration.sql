-- ==============================================================================
-- Migration: 20261101210000_drop_unused_tables
-- Description:
--   Drops tables from the old cohort/offering timetable design. Nothing in the
--   application reads or writes them, and the new model
--   (CourseSection -> TimetableRule -> ClassOccurrence) replaces them.
--   Also drops sessions.timetable_entry_id and the unused RequestStatus enum.
--   Safe only where these tables are empty; the guard below aborts otherwise.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    t text;
    n bigint;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'teacher_substitutions', 'timetable_entries', 'course_offerings', 'cohort_batches',
        'cohort_students', 'academic_cohorts', 'student_devices'
    ] LOOP
        IF to_regclass(t) IS NOT NULL THEN
            EXECUTE format('SELECT count(*) FROM %I', t) INTO n;
            IF n > 0 THEN
                RAISE EXCEPTION 'Refusing to drop %: it still holds % rows', t, n;
            END IF;
        END IF;
    END LOOP;
END $$;

ALTER TABLE "sessions" DROP COLUMN IF EXISTS "timetable_entry_id";

DROP TABLE IF EXISTS "teacher_substitutions";
DROP TABLE IF EXISTS "timetable_entries";
DROP TABLE IF EXISTS "course_offerings";
DROP TABLE IF EXISTS "cohort_batches";
DROP TABLE IF EXISTS "cohort_students";
DROP TABLE IF EXISTS "academic_cohorts";
DROP TABLE IF EXISTS "student_devices";

DROP TYPE IF EXISTS "RequestStatus";

COMMIT;
