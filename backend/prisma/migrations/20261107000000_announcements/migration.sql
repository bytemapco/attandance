-- Announcements: stored once, with who has read them kept apart.
-- Reference copy: `prisma db push` builds the tables from schema.prisma. The data move at the end is run by hand.

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

-- Data move. Until now an announcement was a notification with no user, shared by everyone of its role, so one
-- person reading it read it for all. Each becomes an announcement. It is marked read for the people it reaches,
-- because it is history, not news. The one-row-per-person copies the platform broadcast made keep their user and
-- stay as personal notifications.
INSERT INTO "announcements" ("id", "tenant_id", "audience", "title", "message", "type", "category", "link", "publish_at", "pushed_at", "created_at")
SELECT "id", "tenant_id",
       (CASE "role"::text WHEN 'STUDENT' THEN 'STUDENT' WHEN 'TEACHER' THEN 'TEACHER'
                          WHEN 'ADMIN' THEN 'ADMIN' WHEN 'TENANT_ADMIN' THEN 'ADMIN' ELSE 'ALL' END)::"AnnouncementAudience",
       "title", "message", "type", "category", "link", "created_at", "created_at", "created_at"
FROM "notifications" WHERE "user_id" IS NULL;

INSERT INTO "announcement_reads" ("announcement_id", "user_id")
SELECT a."id", u."id" FROM "announcements" a
JOIN "users" u ON (a."tenant_id" IS NULL OR u."tenant_id" = a."tenant_id")
 AND (a."audience" = 'ALL'
      OR (a."audience" = 'STUDENT' AND u."role" = 'STUDENT')
      OR (a."audience" = 'TEACHER' AND u."role" = 'TEACHER')
      OR (a."audience" = 'ADMIN' AND u."role" IN ('ADMIN', 'TENANT_ADMIN')))
ON CONFLICT DO NOTHING;

UPDATE "announcements" a SET "audience_count" = (SELECT count(*) FROM "announcement_reads" r WHERE r."announcement_id" = a."id");

DELETE FROM "notifications" WHERE "user_id" IS NULL;
