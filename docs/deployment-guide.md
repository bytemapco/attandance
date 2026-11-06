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

The API is public at `https://sahaj-backend.bytemap.in` through a Cloudflare Tunnel to port 8011.

---

## 3. Runbook

```bash
pm2 status                                          # process status
pm2 logs sahaj-backend --lines 50 --nostream        # recent logs
pm2 startOrReload ecosystem.config.cjs --update-env # reload with new env
pm2 save                                            # keep the list across reboots
```

## 4. Troubleshooting

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
