#!/usr/bin/env bash
# SAHAJ demo-data tool, run from your machine.
#
#   ./run.sh            pick a target, see its status, then choose an action
#   ./run.sh local      go straight to your local backend
#   ./run.sh server     go straight to the server
#
# Actions: status, seed (creates the super admin, then fictional college data), and reset (local only).
# The server's database cannot be wiped from here: scripts/reset_database.py refuses production on purpose.
# One password is used for every demo account, the super admin included. Override it with SAHAJ_PASSWORD.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
PY="$BACKEND/.venv/bin/python"
PASSWORD="${SAHAJ_PASSWORD:-Sahaj@2026}"
DEMO_SLUG="vidyasagar-pune"

LOCAL_URL="http://127.0.0.1:8000"
SERVER_URL="${SAHAJ_SERVER_URL:-https://sahaj-backend.bytemap.in}"
SERVER_SSH="${SAHAJ_SERVER_SSH:-jarvis@192.168.31.187}"
SERVER_BACKEND="/home/jarvis/SharedDrive/bytemap/attendance/backend"

if [ -t 1 ]; then BOLD=$'\e[1m'; DIM=$'\e[2m'; RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; OFF=$'\e[0m'
else BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; OFF=""; fi

TARGET="" URL=""

say() { printf '%s\n' "$*"; }
rule() { printf '%s\n' "${DIM}──────────────────────────────────────────────────────${OFF}"; }
die() { printf '%s\n' "${RED}$*${OFF}" >&2; exit 1; }

choose_target() {
  case "${1:-}" in
    local) TARGET=local; URL="$LOCAL_URL"; return ;;
    server) TARGET=server; URL="$SERVER_URL"; return ;;
    "") ;;
    *) die "usage: ./run.sh [local|server]" ;;
  esac
  say "${BOLD}Where do you want to work?${OFF}"
  say "  1) local   $LOCAL_URL"
  say "  2) server  $SERVER_URL  (via $SERVER_SSH)"
  read -r -p "> " pick
  case "$pick" in
    1) TARGET=local; URL="$LOCAL_URL" ;;
    2) TARGET=server; URL="$SERVER_URL" ;;
    *) die "Choose 1 or 2." ;;
  esac
}

health_json() { curl -fsS -m 15 "$URL/health" 2>/dev/null || true; }

# Prints the target and what it reports about itself, so you know where you are before choosing an action.
show_target() {
  local json
  json="$(health_json)"
  rule
  say "${BOLD}Target${OFF}   $TARGET   ${DIM}$URL${OFF}"
  if [ -z "$json" ]; then
    say "${BOLD}Status${OFF}   ${RED}not reachable${OFF}$([ "$TARGET" = local ] && echo "  ${DIM}(seeding will start it)${OFF}")"
  else
    say "${BOLD}Status${OFF}   $("$PY" - "$json" <<'EOF'
import json, sys
d = json.loads(sys.argv[1])
s = d.get("services", {})
part = lambda k: s.get(k, {}).get("status", "?")
print(f"{d.get('status')}   env={d.get('environment')}   db={part('database')}   redis={part('redis')}")
EOF
)"
  fi
  say "${BOLD}Login${OFF}    superadmin@attendance.system / $PASSWORD"
  rule
}

# Runs a backend/scripts file on the target's own database: here for local, over ssh for the server.
backend_script() {
  local script="$1"; shift
  if [ "$TARGET" = local ]; then
    (cd "$BACKEND" && SUPERADMIN_PASSWORD="$PASSWORD" "$PY" "scripts/$script" "$@")
  else
    ssh "$SERVER_SSH" "cd $SERVER_BACKEND && SUPERADMIN_PASSWORD=$(printf %q "$PASSWORD") venv/bin/python scripts/$script $*"
  fi
}

start_local_backend() {
  curl -fs "$URL/health" >/dev/null 2>&1 && return
  say "Starting the local backend..."
  (cd "$BACKEND" && nohup "$PY" -m uvicorn main:app --host 127.0.0.1 --port 8000 >"$BACKEND/server.log" 2>&1 &)
  for _ in $(seq 1 60); do curl -fs "$URL/health" >/dev/null 2>&1 && return; sleep 1; done
  die "The backend did not start; see $BACKEND/server.log"
}

confirm() {
  local answer
  read -r -p "$1 Type '$2' to continue: " answer
  [ "$answer" = "$2" ]
}

seed() {
  local flags=()
  if [ "$TARGET" = server ]; then
    say "${YELLOW}This adds demo people and attendance to the SERVER database.${OFF}"
    confirm "" "seed server" || { say "Cancelled."; return; }
    flags+=(--allow-production)
  else
    start_local_backend
  fi
  backend_script create_super_admin.py
  "$PY" "$ROOT/seed.py" --base-url "$URL" --password "$PASSWORD" --super-password "$PASSWORD" "${flags[@]}"
  backend_script backdate_enrollments.py "$DEMO_SLUG"
  say "${GREEN}Done.${OFF} One login per role is in $ROOT/credentials.txt"
}

env_value() {
  "$PY" - "$1" <<'EOF'
import sys
from dotenv import dotenv_values
print(dotenv_values("backend/.env").get(sys.argv[1], ""))
EOF
}

reset_local() {
  say "${YELLOW}This erases the local database.${OFF}"
  confirm "" "reset local" || { say "Cancelled."; return; }
  local db_name
  pkill -f "[u]vicorn main:app" || true
  db_name="$(env_value DATABASE_URL | "$PY" -c 'import sys; from urllib.parse import urlparse; print(urlparse(sys.stdin.read().strip()).path.lstrip("/"))')"
  (cd "$BACKEND" && "$PY" scripts/reset_database.py --force-destructive-wipe --confirm-target-db="$db_name")
  "$PY" - "$(env_value REDIS_URL)" <<'EOF'
import sys
import redis
client = redis.Redis.from_url(sys.argv[1])
for key in client.scan_iter("tenant:resolved:*"):
    client.delete(key)
EOF
  rm -f "$ROOT/credentials.txt"
  say "${GREEN}Local database wiped.${OFF}"
}

menu() {
  while true; do
    show_target
    say "  1) seed    create the super admin and the demo college"
    [ "$TARGET" = local ] && say "  2) reset   wipe the local database"
    say "  r) refresh status     t) change target     q) quit"
    read -r -p "> " action
    case "$action" in
      1) seed ;;
      2) if [ "$TARGET" = local ]; then reset_local; else say "Reset is not available for the server."; fi ;;
      r) ;;
      t) choose_target ;;
      q) exit 0 ;;
      *) say "Pick one of the options above." ;;
    esac
  done
}

cd "$ROOT"
[ -x "$PY" ] || die "Missing $PY. Run: npm run backend:setup"
choose_target "${1:-}"
menu
