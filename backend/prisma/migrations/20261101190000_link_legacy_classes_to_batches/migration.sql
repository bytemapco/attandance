-- ==============================================================================
-- Migration: 20261101190000_link_legacy_classes_to_batches
-- Description:
--   Legacy year-named classes (batch "2023"/"2024") become department+division+
--   batch classes: 2023 -> CSE-A-1, 2024 -> CSE-A-2. Linked members get the same
--   batch_id so the class roster stays valid.
-- ==============================================================================

BEGIN;

UPDATE "student_groups" g
SET "batch_id" = b."id", "batch" = b."code"
FROM "batches" b
WHERE g."batch_id" IS NULL
  AND b."tenant_id" = g."tenant_id"
  AND b."department_id" = g."department_id"
  AND b."code" = CASE g."batch" WHEN '2023' THEN 'CSE-A-1' WHEN '2024' THEN 'CSE-A-2' END;

UPDATE "students" s
SET "batch_id" = g."batch_id", "batch" = g."batch"
FROM "class_members" m
JOIN "class_terms" ct ON ct."id" = m."class_term_id"
JOIN "student_groups" g ON g."id" = ct."group_id"
WHERE s."id" = m."student_id"
  AND m."status" = 'ACTIVE'
  AND s."batch_id" IS NULL
  AND g."batch_id" IS NOT NULL
  AND s."department_id" = g."department_id";

UPDATE "course_sections" cs
SET "name" = g."batch"
FROM "class_terms" ct
JOIN "student_groups" g ON g."id" = ct."group_id"
WHERE cs."class_term_id" = ct."id" AND g."batch_id" IS NOT NULL AND cs."name" <> g."batch";

COMMIT;
