-- Announcements: stored once, with who has read them kept apart.
-- Reference copy: `prisma db push` builds the tables from schema.prisma. The data move is
-- prisma/sql_changes/after_push/20261107000000_move_announcements.sql, which the deploy runs once.

CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STUDENT', 'TEACHER', 'ADMIN');

CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "sender_id" TEXT,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'system',
    "link" TEXT,
    "publish_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pushed_at" TIMESTAMP(3),
    "audience_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcement_reads" (
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed_at" TIMESTAMP(3),
    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("announcement_id", "user_id")
);

CREATE INDEX "announcements_tenant_id_publish_at_idx" ON "announcements"("tenant_id", "publish_at");
CREATE INDEX "announcements_pushed_at_publish_at_idx" ON "announcements"("pushed_at", "publish_at");
CREATE INDEX "announcement_reads_user_id_idx" ON "announcement_reads"("user_id");

ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
