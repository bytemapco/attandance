-- Existing biometric rows do not prove that explicit, versioned consent was collected.
ALTER TABLE "student_biometrics"
    ALTER COLUMN "consent_given" SET DEFAULT false;

UPDATE "student_biometrics"
SET "consent_given" = false
WHERE "consent_given" = true;
