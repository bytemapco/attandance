# Server Deployment & Operations Guide

The server `jarvis` (`100.101.187.9`) runs the **API** only. The web app is on Vercel; see [devops-ci-cd.md](devops-ci-cd.md).

---

## 1. Layout

```text
/home/jarvis/SharedDrive/bytemap/attendance/
├── backend/
│   ├── .env                    # From PRODUCTION_BACKEND_ENV (0600)
│   ├── venv/                   # Python 3.11 virtualenv
│   ├── main.py                 # FastAPI entrypoint
│   ├── app/  prisma/  scripts/
│   └── requirements.txt
└── ecosystem.config.cjs        # PM2 configuration
```

## 2. Process

| Service | Command | Port |
| :--- | :--- | :--- |
| `sahaj-backend` | `venv/bin/uvicorn main:app --host 0.0.0.0 --port 8011 --workers 1` | `8011` |
| `sahaj-worker` | `venv/bin/arq app.worker.WorkerSettings` | none |

`sahaj-worker` sends the e-mails the API queues in Redis (invitations and device-change notices), retrying a failed send up to 4 times with a growing delay. If it is stopped, requests still succeed and the mail waits in the queue until it starts again. Check the queue with `redis-cli zcard arq:queue`.

The API is public at `https://sahaj-backend.bytemap.in` through a Cloudflare Tunnel to port 8011.

---

## 3. Database and Redis

Both are ordinary services of the host. Nothing here depends on any other project's stack (Aakash, Floci or Docker).

| | Where | Notes |
| :--- | :--- | :--- |
| PostgreSQL 16 | the host's own `postgresql` service, database `sahaj`, role `sahaj` | pgvector 0.6.0 (`CREATE EXTENSION vector`). The host server also holds other projects' databases, so `sahaj` has its own role and database |
| Access rules | first rules in `/etc/postgresql/16/main/pg_hba.conf`, marked `sahaj-database-scope` | The `sahaj` database accepts only the `sahaj` role from `127.0.0.1` and `::1`; every other address is rejected. Other databases on the server are unaffected |
| Redis | the host's own `redis-server`, `127.0.0.1:6379` | Holds rate limits, token revocation, caches and the e-mail queue. Saves to disk on a schedule; `maxmemory-policy noeviction`, so queued jobs are never evicted |
| Connection | `DATABASE_URL` in the `PRODUCTION_BACKEND_ENV` secret | `postgresql://sahaj:<password>@127.0.0.1:5432/sahaj` |

**Back up** (writes a compressed copy you can restore from):
```bash
pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f ~/sahaj-backups/sahaj-$(date +%Y%m%d-%H%M%S).dump
```

**Restore** into an empty database (needs the superuser, because it creates the pgvector extension first):
```bash
sudo -u postgres createdb -O sahaj sahaj_restore
sudo -u postgres psql -d sahaj_restore -c "CREATE EXTENSION vector"
pg_restore -l backup.dump | grep -vE "EXTENSION - vector|COMMENT - EXTENSION vector" > restore.list
sudo -u postgres pg_restore -d sahaj_restore -L restore.list --no-owner --role=sahaj --exit-on-error backup.dump
```

**Moving the database** (the steps used to leave Floci): stop the API, take a backup, restore into the new database, compare every table's row count and a checksum of its rows, change `DATABASE_URL` in the secret and on the server, start the API, and keep the old database untouched until the new one has run for a while.

## 4. Runbook

```bash
pm2 status                                          # process status
pm2 logs sahaj-backend --lines 50 --nostream        # recent API logs
pm2 logs sahaj-worker --lines 50 --nostream         # recent e-mail worker logs
pm2 startOrReload ecosystem.config.cjs --update-env # reload with new env
pm2 save                                            # keep the list across reboots
```

## 5. Troubleshooting

### Cold start
Starting takes 15 to 20 s while TensorFlow and DeepFace load. The deploy waits up to 45 s before checking `/health`.

### Prisma path
`prisma-client-py` is in `backend/venv/bin`. For manual schema work:
```bash
export PATH="/home/jarvis/SharedDrive/bytemap/attendance/backend/venv/bin:$PATH"
cd /home/jarvis/SharedDrive/bytemap/attendance/backend
prisma db push
```
`db push` refuses changes that would delete data. Do not add `--accept-data-loss` without a backup.

### Redis
If Redis is unreachable the API starts in degraded mode and the database and storage keep working. `curl -sS http://127.0.0.1:8011/health` shows each part.
