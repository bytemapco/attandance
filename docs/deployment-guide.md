# Server Deployment & Operations Guide

How SAHAJ runs on the `jarvis` host (Tailscale `100.101.187.9`, LAN `192.168.31.187`): systemd services behind a Cloudflare tunnel.

---

## 1. Layout

Everything for the app lives in `/home/jarvis/SharedDrive/bytemap/attendance/`:
```text
├── backend/
│   ├── .env          # written by CD from PRODUCTION_BACKEND_ENV (0600)
│   ├── venv/         # Python 3.11 virtualenv
│   ├── main.py       # FastAPI entrypoint
│   └── prisma/       # schema
└── frontend/
    ├── .env          # written by CD from PRODUCTION_FRONTEND_ENV (0600)
    └── server.js     # Next.js standalone server
```

## 2. Services

| Unit | Command | Port |
| :--- | :--- | :--- |
| `sahaj-backend` | `venv/bin/uvicorn main:app --host 0.0.0.0 --port 8011 --workers 1` | 8011 |
| `sahaj-frontend` | `node server.js` (Node 24 from nvm) | 3011 |

Unit files are in [deploy/systemd/](../deploy/systemd/). They live in `/etc/systemd/system/`, are enabled at boot, and restart on failure after 3 seconds.
`/etc/sudoers.d/sahaj-deploy` ([deploy/sudoers/sahaj-deploy](../deploy/sudoers/sahaj-deploy)) lets `jarvis` run only `systemctl restart sahaj-backend` and `systemctl restart sahaj-frontend` without a password, which is what CD uses.

Install or change a unit:
```bash
sudo cp deploy/systemd/sahaj-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sahaj-backend
```

## 3. Public hostnames

One Cloudflare tunnel (`jarvis`, config `/etc/cloudflared/config.yml`, service `cloudflared`) serves several apps. Sahaj uses:

| Hostname | Target |
| :--- | :--- |
| `sahaj.bytemap.in` | `http://127.0.0.1:3011` |
| `sahaj-backend.bytemap.in` | `http://127.0.0.1:8011` |

Other hostnames in the same file belong to other apps on this host. Leave them alone. After editing the file: `cloudflared tunnel ingress validate` then `sudo systemctl restart cloudflared`.
A new hostname also needs a DNS record: `cloudflared tunnel route dns jarvis <hostname>`.

The hostnames are set in three places: `cd.yml` (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`), the `FRONTEND_URL` line of the `PRODUCTION_BACKEND_ENV` secret (it is the CORS allow-list), and `scripts/cli/mobile-setup.mjs`.

## 4. Runbook

```bash
systemctl status sahaj-backend sahaj-frontend
journalctl -u sahaj-backend -n 50 --no-pager      # last 50 lines
journalctl -u sahaj-frontend -f                   # follow
sudo systemctl restart sahaj-backend              # or sahaj-frontend
curl -sS http://127.0.0.1:8011/health | jq .
```

## 5. Troubleshooting

- **Slow backend start.** TensorFlow and DeepFace load on boot, so `/health` can take up to a minute to answer. CD waits up to 2 minutes for it.
- **Database.** The backend's Postgres and S3 come from the `aakash` Docker stack on this host (`localhost:7001`). Do not stop or prune that stack. Redis is the host `redis-server`.
- **Schema changes.** CD runs `scripts/backfill_tenant_ids.py` and then `prisma db push` **without** `--accept-data-loss`. A change that would drop data stops the deploy. Run it by hand only after checking what is dropped:
  ```bash
  export PATH="/home/jarvis/SharedDrive/bytemap/attendance/backend/venv/bin:$PATH"
  cd /home/jarvis/SharedDrive/bytemap/attendance/backend
  prisma db push
  ```
- **Degraded cache.** If Redis is down the API still starts; the database, storage and AI checks stay up. `/health` shows each part.
