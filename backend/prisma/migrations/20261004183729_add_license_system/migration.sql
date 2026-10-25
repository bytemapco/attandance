-- CreateEnum
CREATE TYPE "LicenseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add license_count, migrate existing data from max_allowed_students
ALTER TABLE "tenants" ADD COLUMN "license_count" INTEGER NOT NULL DEFAULT 0;

-- Data migration: preserve existing limits for existing tenants
UPDATE "tenants" SET "license_count" = "max_allowed_students";

-- AlterTable: drop the legacy column
ALTER TABLE "tenants" DROP COLUMN "max_allowed_students";

-- CreateTable
CREATE TABLE "license_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedCount" INTEGER NOT NULL,
    "status" "LicenseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "license_requests" ADD CONSTRAINT "license_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_requests" ADD CONSTRAINT "license_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_requests" ADD CONSTRAINT "license_requests_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
