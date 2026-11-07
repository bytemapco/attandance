-- Announcements move. Until now an announcement was a notification with no user, shared by everyone of its role,
-- so one person reading it read it for all. Each becomes an announcement. It is marked read for the people it
-- reaches, because it is history, not news. The one-row-per-person copies the platform broadcast made keep their
-- user and stay as personal notifications.
-- Runs after `prisma db push`, which builds the announcements tables. It only touches the notifications it moves,
-- so an announcement sent since then is never marked read.
CREATE TEMP TABLE moved_notifications ON COMMIT DROP AS
SELECT "id" FROM "notifications" WHERE "user_id" IS NULL;

INSERT INTO "announcements" ("id", "tenant_id", "audience", "title", "message", "type", "category", "link", "publish_at", "pushed_at", "created_at")
SELECT n."id", n."tenant_id",
       (CASE n."role"::text WHEN 'STUDENT' THEN 'STUDENT' WHEN 'TEACHER' THEN 'TEACHER'
                            WHEN 'ADMIN' THEN 'ADMIN' WHEN 'TENANT_ADMIN' THEN 'ADMIN' ELSE 'ALL' END)::"AnnouncementAudience",
       n."title", n."message", n."type", n."category", n."link", n."created_at", n."created_at", n."created_at"
FROM "notifications" n
WHERE n."id" IN (SELECT "id" FROM moved_notifications)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "announcement_reads" ("announcement_id", "user_id")
SELECT a."id", u."id" FROM "announcements" a
JOIN "users" u ON (a."tenant_id" IS NULL OR u."tenant_id" = a."tenant_id")
 AND (a."audience" = 'ALL'
      OR (a."audience" = 'STUDENT' AND u."role" = 'STUDENT')
      OR (a."audience" = 'TEACHER' AND u."role" = 'TEACHER')
      OR (a."audience" = 'ADMIN' AND u."role" IN ('ADMIN', 'TENANT_ADMIN')))
WHERE a."id" IN (SELECT "id" FROM moved_notifications)
ON CONFLICT DO NOTHING;

UPDATE "announcements" a
SET "audience_count" = (SELECT count(*) FROM "announcement_reads" r WHERE r."announcement_id" = a."id")
WHERE a."id" IN (SELECT "id" FROM moved_notifications);

DELETE FROM "notifications" WHERE "id" IN (SELECT "id" FROM moved_notifications);
