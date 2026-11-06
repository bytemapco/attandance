-- Database protections that schema.prisma cannot express, so `prisma db push` never creates them.
-- Source: migrations 20261101180000, 20261101290000 and 20261102000000_schema_hardening.
--
-- The integration tests (backend/tests/integration) build their database with `prisma db push` and then run this
-- file, so the tests see the same protections as a database built by the migrations. It can be run twice safely.
-- Keep it in step with the "SQL only" note in CLAUDE.md when a protection is added or removed.

-- 1. Only a SUPER_ADMIN user may have no tenant.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_required_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_tenant_required_check
            CHECK (tenant_id IS NOT NULL OR role = 'SUPER_ADMIN') NOT VALID;
    END IF;
END $$;

-- 2. A row may only link records of its own tenant. Arguments come in pairs: the foreign key column,
--    then the table it points at.
CREATE OR REPLACE FUNCTION enforce_same_tenant() RETURNS trigger AS $$
DECLARE
    new_row jsonb := to_jsonb(NEW);
    seen text[] := ARRAY[]::text[];
    parent_tenant text;
    parent_id text;
    i int := 0;
BEGIN
    IF new_row ? 'tenant_id' AND new_row->>'tenant_id' IS NOT NULL THEN
        seen := seen || (new_row->>'tenant_id');
    END IF;

    WHILE i < TG_NARGS LOOP
        parent_id := new_row->>TG_ARGV[i];
        IF parent_id IS NOT NULL THEN
            EXECUTE format('SELECT tenant_id FROM %I WHERE id = $1', TG_ARGV[i + 1])
                INTO parent_tenant USING parent_id;
            IF parent_tenant IS NOT NULL THEN
                seen := seen || parent_tenant;
            END IF;
        END IF;
        i := i + 2;
    END LOOP;

    IF (SELECT count(DISTINCT t) FROM unnest(seen) AS t) > 1 THEN
        RAISE EXCEPTION 'Cross-tenant link refused on %.', TG_TABLE_NAME USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    spec record;
BEGIN
    FOR spec IN SELECT * FROM (VALUES
        ('students', ARRAY['department_id', 'departments', 'batch_id', 'batches', 'user_id', 'users']),
        ('teachers', ARRAY['department_id', 'departments', 'designation_id', 'designations', 'user_id', 'users']),
        ('batches', ARRAY['department_id', 'departments']),
        ('student_groups', ARRAY['department_id', 'departments', 'batch_id', 'batches']),
        ('class_members', ARRAY['group_id', 'student_groups', 'student_id', 'students']),
        ('course_sections', ARRAY['subject_id', 'subjects', 'department_id', 'departments',
                                   'default_room_id', 'classrooms', 'group_id', 'student_groups']),
        ('course_enrollments', ARRAY['course_section_id', 'course_sections', 'student_id', 'students']),
        ('course_faculties', ARRAY['course_section_id', 'course_sections', 'teacher_id', 'teachers']),
        ('timetable_rules', ARRAY['course_section_id', 'course_sections', 'classroom_id', 'classrooms',
                                   'teacher_id', 'teachers']),
        ('class_occurrences', ARRAY['course_section_id', 'course_sections', 'classroom_id', 'classrooms',
                                     'faculty_id', 'teachers', 'substitute_faculty_id', 'teachers']),
        ('attendance_records', ARRAY['occurrence_id', 'class_occurrences', 'student_id', 'students']),
        ('leave_requests', ARRAY['student_id', 'students']),
        ('device_change_requests', ARRAY['student_id', 'students']),
        ('biometric_consents', ARRAY['student_id', 'students'])
    ) AS t(tbl, args)
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', spec.tbl || '_same_tenant', spec.tbl);
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant(%s)',
            spec.tbl || '_same_tenant',
            spec.tbl,
            (SELECT string_agg(quote_literal(a), ', ') FROM unnest(spec.args) AS a)
        );
    END LOOP;
END $$;

-- 3. One active grant per student, one active class per student.
CREATE UNIQUE INDEX IF NOT EXISTS biometric_consents_one_active_per_student
    ON biometric_consents (student_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS class_members_one_active_per_student
    ON class_members (student_id) WHERE status = 'ACTIVE';

-- 4. CHECK constraints.
DO $$
DECLARE
    spec record;
BEGIN
    FOR spec IN SELECT * FROM (VALUES
        ('biometric_consents', 'biometric_consents_revoked_after_granted_check',
         'revoked_at IS NULL OR revoked_at >= granted_at'),
        ('timetable_rules', 'timetable_rules_day_check', 'day_of_week BETWEEN 1 AND 7'),
        ('timetable_rules', 'timetable_rules_dates_chk', 'effective_until >= effective_from'),
        ('timetable_rules', 'timetable_rules_time_check',
         'start_time ~ ''^([01][0-9]|2[0-3]):[0-5][0-9]$'' AND end_time ~ ''^([01][0-9]|2[0-3]):[0-5][0-9]$'' AND start_time < end_time'),
        ('class_occurrences', 'class_occurrences_time_check',
         'start_time ~ ''^([01][0-9]|2[0-3]):[0-5][0-9]$'' AND end_time ~ ''^([01][0-9]|2[0-3]):[0-5][0-9]$'' AND start_time <= end_time'),
        ('leave_requests', 'leave_requests_dates_check', 'end_date >= start_date'),
        ('students', 'students_semester_range_chk', 'semester IS NULL OR semester BETWEEN 1 AND 8')
    ) AS t(tbl, name, expr)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = spec.name) THEN
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', spec.tbl, spec.name, spec.expr);
        END IF;
    END LOOP;
END $$;
