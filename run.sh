#!/usr/bin/env bash
# ./run.sh          starts the backend if needed and seeds it; writes one login per role to credentials.txt.
# ./run.sh --reset  only wipes the local database (and stops the backend); it does not seed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
PY="$BACKEND/.venv/bin/python"
URL="http://127.0.0.1:8000"
LOG="$BACKEND/server.log"

RESET=false
case "${1:-}" in
  "") ;;
  --reset) RESET=true ;;
  *) echo "usage: ./run.sh [--reset]" >&2; exit 2 ;;
esac

env_value() {
  "$PY" - "$1" <<'EOF'
import sys
from dotenv import dotenv_values
print(dotenv_values("backend/.env").get(sys.argv[1], ""))
EOF
}

healthy() { curl -fs "$URL/health" >/dev/null 2>&1; }

cd "$ROOT"

if $RESET; then
  pkill -f "[u]vicorn main:app" || true
  DB_NAME="$(env_value DATABASE_URL | "$PY" -c 'import sys; from urllib.parse import urlparse; print(urlparse(sys.stdin.read().strip()).path.lstrip("/"))')"
  (cd "$BACKEND" && "$PY" scripts/reset_database.py --force-destructive-wipe --confirm-target-db="$DB_NAME")
  "$PY" - "$(env_value REDIS_URL)" <<'EOF'
import sys
import redis
client = redis.Redis.from_url(sys.argv[1])
for key in client.scan_iter("tenant:resolved:*"):
    client.delete(key)
EOF
  rm -f credentials.txt
  echo "Database wiped. Run ./run.sh to seed it again."
  exit 0
fi

if ! healthy; then
  (cd "$BACKEND" && nohup "$PY" -m uvicorn main:app --host 127.0.0.1 --port 8000 >"$LOG" 2>&1 &)
  for _ in $(seq 1 60); do healthy && break; sleep 1; done
  healthy || { echo "Backend did not start; see $LOG" >&2; exit 1; }
fi

(cd "$BACKEND" && SUPERADMIN_PASSWORD="${SUPERADMIN_PASSWORD:-SuperAdmin@123456}" "$PY" scripts/create_super_admin.py)
"$PY" seed.py --base-url "$URL"
(cd "$BACKEND" && "$PY" scripts/backdate_enrollments.py)
echo "Logins are in $ROOT/credentials.txt"
