-- Schema hardening for v1.
--   1. Student and teacher identifiers are unique per tenant, not globally.
--   2. tenant_id is NOT NULL on every tenant-owned table. Only a SUPER_ADMIN user has no tenant.
--   3. A trigger refuses rows that link records from two different tenants.
--   4. Attendance history can no longer be deleted by deleting a student or a lesson.
--   5. Biometric consent is a table, not a Redis key.
--   6. Lock owner columns, and basic CHECKs on times.

-- 1. Backfill tenant_id where it can be derived, then fail loudly on anything left over.
UPDATE students s SET tenant_id = u.tenant_id FROM users u WHERE s.user_id = u.id AND s.tenant_id IS NULL;
UPDATE teachers t SET tenant_id = u.tenant_id FROM users u WHERE t.user_id = u.id AND t.tenant_id IS NULL;
UPDATE leave_requests l SET tenant_id = s.tenant_id FROM students s WHERE l.student_id = s.id AND l.tenant_id IS NULL;
UPDATE device_change_requests d SET tenant_id = s.tenant_id FROM students s WHERE d.student_id = s.id AND d.tenant_id IS NULL;
UPDATE student_biometrics b SET tenant_id = s.tenant_id FROM students s WHERE b.student_id = s.id AND b.tenant_id IS NULL;
UPDATE classes c SET tenant_id = t.tenant_id FROM teachers t WHERE c.teacher_id = t.id AND c.tenant_id IS NULL;
UPDATE license_requests r SET tenant_id = u.tenant_id FROM users u WHERE r.requested_by_id = u.id AND r.tenant_id IS NULL;

DO $$
DECLARE
    tbl text;
    orphans bigint;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'students', 'teachers', 'departments', 'designations', 'subjects', 'classrooms', 'classes',
        'leave_requests', 'device_change_requests', 'license_requests', 'student_biometrics'
    ] LOOP
        EXECUTE format('SELECT count(*) FROM %I WHERE tenant_id IS NULL', tbl) INTO orphans;
        IF orphans > 0 THEN
            RAISE EXCEPTION 'Cannot enforce tenant_id: % rows in % have no tenant. Assign or remove them first.', orphans, tbl;
        END IF;
    END LOOP;
END $$;

ALTER TABLE students ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE teachers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE departments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE designations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE subjects ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE classrooms ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE classes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE leave_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE device_change_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE license_requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE student_biometrics ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE users ADD CONSTRAINT users_tenant_required_check
    CHECK (tenant_id IS NOT NULL OR role = 'SUPER_ADMIN');

-- 2. Identifiers are unique inside a tenant.
DROP INDEX "students_enrollment_number_key";
CREATE UNIQUE INDEX "students_tenant_id_enrollment_number_key" ON students (tenant_id, enrollment_number);
DROP INDEX "teachers_employee_id_key";
CREATE UNIQUE INDEX "teachers_tenant_id_employee_id_key" ON teachers (tenant_id, employee_id);

-- 3. Tenant consistency. Every foreign key named in the trigger arguments must point at a row of
--    the same tenant as the row being written (and as the row's own tenant_id, when it has one).
--    Arguments come in pairs: the foreign key column, then the table it points at.
CREATE FUNCTION enforce_same_tenant() RETURNS trigger AS $$
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

CREATE TRIGGER students_same_tenant BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('department_id', 'departments', 'batch_id', 'batches', 'user_id', 'users');
CREATE TRIGGER teachers_same_tenant BEFORE INSERT OR UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('department_id', 'departments', 'designation_id', 'designations', 'user_id', 'users');
CREATE TRIGGER batches_same_tenant BEFORE INSERT OR UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('department_id', 'departments');
CREATE TRIGGER student_groups_same_tenant BEFORE INSERT OR UPDATE ON student_groups
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('department_id', 'departments', 'batch_id', 'batches');
CREATE TRIGGER class_members_same_tenant BEFORE INSERT OR UPDATE ON class_members
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('group_id', 'student_groups', 'student_id', 'students');
CREATE TRIGGER course_sections_same_tenant BEFORE INSERT OR UPDATE ON course_sections
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant(
        'subject_id', 'subjects', 'department_id', 'departments', 'default_room_id', 'classrooms', 'group_id', 'student_groups');
CREATE TRIGGER course_enrollments_same_tenant BEFORE INSERT OR UPDATE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('course_section_id', 'course_sections', 'student_id', 'students');
CREATE TRIGGER course_faculties_same_tenant BEFORE INSERT OR UPDATE ON course_faculties
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('course_section_id', 'course_sections', 'teacher_id', 'teachers');
CREATE TRIGGER timetable_rules_same_tenant BEFORE INSERT OR UPDATE ON timetable_rules
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant(
        'course_section_id', 'course_sections', 'classroom_id', 'classrooms', 'teacher_id', 'teachers');
CREATE TRIGGER class_occurrences_same_tenant BEFORE INSERT OR UPDATE ON class_occurrences
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant(
        'course_section_id', 'course_sections', 'classroom_id', 'classrooms',
        'faculty_id', 'teachers', 'substitute_faculty_id', 'teachers');
CREATE TRIGGER attendance_records_same_tenant BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('occurrence_id', 'class_occurrences', 'student_id', 'students');
CREATE TRIGGER leave_requests_same_tenant BEFORE INSERT OR UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('student_id', 'students');
CREATE TRIGGER device_change_requests_same_tenant BEFORE INSERT OR UPDATE ON device_change_requests
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('student_id', 'students');

-- 4. Attendance history survives deleting a student or a lesson. NO ACTION (not RESTRICT) still
--    lets a whole tenant be deleted, because the check runs after the cascade finishes.
ALTER TABLE attendance_records DROP CONSTRAINT attendance_records_student_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE attendance_records DROP CONSTRAINT attendance_records_occurrence_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_occurrence_id_fkey
    FOREIGN KEY (occurrence_id) REFERENCES class_occurrences (id) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE attendance_audit_logs DROP CONSTRAINT attendance_audit_logs_attendance_record_id_fkey;
ALTER TABLE attendance_audit_logs ADD CONSTRAINT attendance_audit_logs_attendance_record_id_fkey
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records (id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- 5. Biometric consent: one row per grant, never deleted. At most one active grant per student.
CREATE TABLE biometric_consents (
    id            TEXT        NOT NULL,
    tenant_id     TEXT        NOT NULL,
    student_id    TEXT        NOT NULL,
    policy_version TEXT       NOT NULL,
    recorded_by_id TEXT,
    ip_address    TEXT,
    user_agent    TEXT,
    granted_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at    TIMESTAMP(3),
    CONSTRAINT biometric_consents_pkey PRIMARY KEY (id),
    CONSTRAINT biometric_consents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT biometric_consents_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT biometric_consents_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT biometric_consents_revoked_after_granted_check CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);
CREATE INDEX biometric_consents_tenant_id_idx ON biometric_consents (tenant_id);
CREATE INDEX biometric_consents_student_id_granted_at_idx ON biometric_consents (student_id, granted_at);
CREATE UNIQUE INDEX biometric_consents_one_active_per_student ON biometric_consents (student_id) WHERE revoked_at IS NULL;
CREATE TRIGGER biometric_consents_same_tenant BEFORE INSERT OR UPDATE ON biometric_consents
    FOR EACH ROW EXECUTE FUNCTION enforce_same_tenant('student_id', 'students');

-- Carry over any consent that was only stored on the template row.
INSERT INTO biometric_consents (id, tenant_id, student_id, policy_version, granted_at)
SELECT gen_random_uuid()::text, tenant_id, student_id, 'legacy', min(created_at)
FROM student_biometrics WHERE consent_given GROUP BY tenant_id, student_id;
ALTER TABLE student_biometrics DROP COLUMN consent_given;

-- 6. Who locked a lesson and when, and basic sanity CHECKs.
--    Marking is already idempotent through the (occurrence_id, student_id) unique index.
ALTER TABLE class_occurrences ADD COLUMN locked_at TIMESTAMP(3), ADD COLUMN locked_by_id TEXT;
ALTER TABLE class_occurrences ADD CONSTRAINT class_occurrences_locked_by_id_fkey
    FOREIGN KEY (locked_by_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE timetable_rules ADD CONSTRAINT timetable_rules_day_check CHECK (day_of_week BETWEEN 1 AND 7);
ALTER TABLE timetable_rules ADD CONSTRAINT timetable_rules_time_check
    CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND start_time < end_time);
-- An unscheduled class started at 23:59 ends at 23:59, so an occurrence allows start = end.
ALTER TABLE class_occurrences ADD CONSTRAINT class_occurrences_time_check
    CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND start_time <= end_time);
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_dates_check CHECK (end_date >= start_date);
