#!/usr/bin/env bash
# SAHAJ demo-data tool, run from your machine.
#
#   ./run.sh            pick a target, see its status, then choose an action
#   ./run.sh local      go straight to your local backend
#   ./run.sh server     go straight to the server
#
# Actions: seed (super admin, then fictional college data), reset (empty the database, keep the schema) and both.
# Resetting the server backs the database up first and asks you to type the database name.
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
    if [ "${1:-}" != confirmed ]; then
      say "${YELLOW}This adds demo people and attendance to the SERVER database.${OFF}"
      confirm "" "seed server" || { say "Cancelled."; return 1; }
    fi
    flags+=(--allow-production)
  else
    start_local_backend
  fi
  backend_script create_super_admin.py
  "$PY" "$ROOT/seed.py" --base-url "$URL" --password "$PASSWORD" --super-password "$PASSWORD" "${flags[@]}"
  backend_script backdate_enrollments.py "$DEMO_SLUG"
  say "${GREEN}Done.${OFF} One login per role is in $ROOT/credentials.txt"
}

# Empties the target's database after you type its name. The server is backed up first.
reset() {
  local info db_name backup=()
  info="$(backend_script wipe_data.py --show)"
  db_name="${info%% *}"
  say "${YELLOW}This empties every table in: $info  (target: $TARGET)${OFF}"
  confirm "" "$db_name" || { say "Cancelled."; return 1; }
  [ "$TARGET" = server ] && backup=(--backup "~/sahaj-backups/$(date +%Y%m%d-%H%M%S).sql.gz")
  backend_script wipe_data.py --confirm-db "$db_name" "${backup[@]}"
  backend_script create_super_admin.py
  rm -f "$ROOT/credentials.txt"
  say "${GREEN}Database emptied; the super admin is back.${OFF}"
}

menu() {
  while true; do
    show_target
    say "  1) seed             add the demo college"
    say "  2) reset            empty the database"
    say "  3) reset and seed   start from a clean demo"
    say "  r) refresh status     t) change target     q) quit"
    read -r -p "> " action
    case "$action" in
      1) seed || true ;;
      2) reset || true ;;
      3) if reset; then seed confirmed; fi ;;
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
