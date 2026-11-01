-- Custom domains are no longer supported for tenant routing.
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "domain";
