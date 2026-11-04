-- Retire the legacy attendance model (classes -> sessions -> attendance) and the unused student_biometrics
-- table. Everything now runs on course_sections -> class_occurrences -> attendance_records.
-- The face template lives on students.face_embedding; consent lives in biometric_consents.
--
-- Nothing is dropped while any of these tables still holds rows. Export or migrate that data first.

DO $$
DECLARE
    tbl text;
    leftover bigint;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['attendance', 'sessions', 'geofences', 'enrollments', 'classes', 'student_biometrics'] LOOP
        EXECUTE format('SELECT count(*) FROM %I', tbl) INTO leftover;
        IF leftover > 0 THEN
            RAISE EXCEPTION 'Refusing to drop %: it still has % rows. Migrate or export them first.', tbl, leftover;
        END IF;
    END LOOP;
END $$;

-- A student's explanation of a flagged mark, kept on the record the teacher reviews.
ALTER TABLE attendance_records ADD COLUMN student_note TEXT;

DROP TABLE attendance;
DROP TABLE sessions;
DROP TABLE geofences;
DROP TABLE enrollments;
DROP TABLE classes;
DROP TABLE student_biometrics;
