# Server Deployment & Operations Guide

This guide covers the host environment, PM2 process management, and day-to-day operations for the **Smart Attendance System** deployed on `jarvis` (`100.101.187.9`).

---

## 1. Host Architecture & Layout

All project artifacts are scoped strictly inside:
```text
/home/jarvis/SharedDrive/bytemap/attendance/
├── backend/
│   ├── .env                    # Sourced from PRODUCTION_BACKEND_ENV (0600)
│   ├── venv/                   # Python 3.11 dedicated virtualenv
│   ├── main.py                 # FastAPI application entrypoint
│   ├── app/                    # Application source code
│   ├── prisma/                 # Prisma schema and engines
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── .env                    # Sourced from PRODUCTION_FRONTEND_ENV (0600)
│   ├── server.js               # Next.js standalone server entrypoint
│   └── .next/                  # Pre-compiled static assets and standalone chunk
└── ecosystem.config.cjs        # PM2 process configuration
```

---

## 2. Process Configuration (`ecosystem.config.cjs`)

Services are managed natively via PM2:

| Service Name | Working Directory | Runtime / Command | Port | Auto-Restart |
| :--- | :--- | :--- | :--- | :--- |
| `smart-attendance-backend` | `.../backend` | `venv/bin/uvicorn main:app --host 0.0.0.0 --port 8011 --workers 1` | `8011` | Yes (delay: 3s) |
| `smart-attendance-frontend` | `.../frontend` | `node server.js` | `3011` | Yes (delay: 3s) |

---

## 3. Operations Runbook

### Checking Service Status
```bash
# View live status of PM2 processes
pm2 status
# Or shorthand
pm2 list
```

### Inspecting Application Logs
```bash
# Stream live logs for both services
pm2 logs

# View last 50 lines for backend only
pm2 logs smart-attendance-backend --lines 50 --nostream

# View last 50 lines for frontend only
pm2 logs smart-attendance-frontend --lines 50 --nostream
```

### Restarting / Reloading Services
```bash
# Reload services with updated environment variables
pm2 startOrReload ecosystem.config.cjs --update-env

# Restart a specific process
pm2 restart smart-attendance-backend
pm2 restart smart-attendance-frontend

# Save process list so it persists across host reboots
pm2 save
```

---

## 4. Troubleshooting Common Issues

### A. Backend Startup & AI Engine Cold Start
- **Behavior**: Cold-starts take ~15–20 seconds because TensorFlow and DeepFace initialize face detection weights on CPU upon first boot.
- **Handling**: The CD pipeline includes a 45-second retry window (`--retry 15 --retry-delay 3 --retry-connrefused`) before validating `/health`.

### B. Prisma Generator Path
- **Behavior**: `prisma-client-py` is installed in `backend/venv/bin/prisma-client-py`.
- **Handling**: When running manual migrations, ensure `backend/venv/bin` is in `$PATH`:
  ```bash
  export PATH="/home/jarvis/SharedDrive/bytemap/attendance/backend/venv/bin:$PATH"
  cd /home/jarvis/SharedDrive/bytemap/attendance/backend
  prisma db push --accept-data-loss
  ```

### C. Redis & Degraded Cache Mode
- **Behavior**: If Redis is unreachable or credentials are being rotated, the API boots in degraded mode. The database, S3 storage, and AI engine remain fully operational.
- **Verification**: Run `curl -sS http://127.0.0.1:8011/health | jq .` to verify service sub-component health.
