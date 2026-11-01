-- College and university are one tenant type; convert every existing tenant.
CREATE TYPE "TenantType_new" AS ENUM ('COLLEGE');

ALTER TABLE "tenants" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "tenants"
  ALTER COLUMN "type" TYPE "TenantType_new"
  USING 'COLLEGE'::"TenantType_new";

DROP TYPE "TenantType";
ALTER TYPE "TenantType_new" RENAME TO "TenantType";
ALTER TABLE "tenants" ALTER COLUMN "type" SET DEFAULT 'COLLEGE'::"TenantType";
