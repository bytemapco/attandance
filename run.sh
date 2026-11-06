#!/usr/bin/env bash
# SAHAJ operations menu, run from your machine.
#
#   ./run.sh            pick a target, see its status, then choose an action
#   ./run.sh local      your local backend, using backend/.env (development)
#   ./run.sh server     the hosted backend, over SSH (production)
#
# Actions: seed (super admin, then a fictional college; the logins are saved to credentials.txt), create the super
# admin alone, reset (empty the database, keep the schema), and start the local backend.
# One password, typed when asked, is used for every account. Resetting the server saves a backup first.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
PY="$BACKEND/.venv/bin/python"

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
  say "  1) local   $LOCAL_URL  ${DIM}(development)${OFF}"
  say "  2) server  $SERVER_URL  ${DIM}(production, via $SERVER_SSH)${OFF}"
  read -r -p "> " pick
  case "$pick" in
    1) TARGET=local; URL="$LOCAL_URL" ;;
    2) TARGET=server; URL="$SERVER_URL" ;;
    *) die "Choose 1 or 2." ;;
  esac
}

# Prints the target and what it reports about itself, so you know where you are before choosing an action.
show_target() {
  local json
  json="$(curl -fsS -m 15 "$URL/health" 2>/dev/null || true)"
  rule
  say "${BOLD}Target${OFF}   $TARGET   ${DIM}$URL${OFF}"
  if [ -z "$json" ]; then
    say "${BOLD}Status${OFF}   ${RED}not reachable${OFF}"
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
  rule
}

# Runs a backend/scripts file on the target's own database: here for local, over ssh for the server.
# A password, when one is needed, is read from SAHAJ_SECRET and travels on stdin, never on a command line.
backend_script() {
  local script="$1"; shift
  if [ "$TARGET" = local ]; then
    (cd "$BACKEND" && SUPERADMIN_PASSWORD="${SAHAJ_SECRET:-}" SUPERADMIN_EMAIL="${SAHAJ_EMAIL:-}" "$PY" "scripts/$script" "$@")
  else
    printf '%s\n' "${SAHAJ_SECRET:-}" | ssh "$SERVER_SSH" \
      "cd $SERVER_BACKEND && IFS= read -r SUPERADMIN_PASSWORD && export SUPERADMIN_PASSWORD SUPERADMIN_EMAIL=$(printf %q "${SAHAJ_EMAIL:-}") && venv/bin/python scripts/$script $*"
  fi
}

confirm() {
  local answer
  read -r -p "Type '$1' to continue: " answer
  [ "$answer" = "$1" ]
}

# Asks for the login of the first account. The password is typed hidden and never stored.
ask_super_admin() {
  local again
  read -r -p "Super admin email: " SAHAJ_EMAIL
  read -r -s -p "Password (min 8 characters): " SAHAJ_SECRET; echo
  read -r -s -p "Repeat password: " again; echo
  [ "$SAHAJ_SECRET" = "$again" ] && [ "${#SAHAJ_SECRET}" -ge 8 ] && [ -n "$SAHAJ_EMAIL" ] || { say "${RED}Email missing, passwords differ, or shorter than 8.${OFF}"; return 1; }
  export SAHAJ_EMAIL SAHAJ_SECRET
}

create_super_admin() {
  ask_super_admin || return 1
  backend_script create_super_admin.py
  unset SAHAJ_SECRET
}

# Creates the super admin, loads the fictional college through the API, and saves one login per role.
# The demo institution gets the same password as the super admin.
seed() {
  local flags=()
  ask_super_admin || return 1
  if [ "$TARGET" = server ]; then
    if [ "${1:-}" != confirmed ]; then
      say "${YELLOW}This adds fictional people and attendance to the SERVER database.${OFF}"
      confirm "seed server" || { say "Cancelled."; return 1; }
    fi
    flags+=(--allow-production)
  else
    start_local_backend
  fi
  backend_script create_super_admin.py
  "$PY" "$ROOT/seed.py" --base-url "$URL" --password "$SAHAJ_SECRET" \
    --super-email "$SAHAJ_EMAIL" --super-password "$SAHAJ_SECRET" "${flags[@]}"
  backend_script backdate_enrollments.py vidyasagar-pune
  unset SAHAJ_SECRET
  say "${GREEN}Done.${OFF} The logins are saved in $ROOT/credentials.txt"
}

# Empties the target's database after you type its name. The server is backed up first.
reset() {
  local info db_name backup=()
  info="$(backend_script wipe_data.py --show)"
  db_name="${info%% *}"
  say "${YELLOW}This empties every table in: $info  (target: $TARGET)${OFF}"
  confirm "$db_name" || { say "Cancelled."; return 1; }
  [ "$TARGET" = server ] && backup=(--backup "~/sahaj-backups/$(date +%Y%m%d-%H%M%S).sql.gz")
  backend_script wipe_data.py --confirm-db "$db_name" "${backup[@]}"
  say "${GREEN}Database emptied.${OFF} Create the super admin to log in again."
}

start_local_backend() {
  curl -fs "$URL/health" >/dev/null 2>&1 && { say "Already running."; return; }
  (cd "$BACKEND" && nohup "$PY" -m uvicorn main:app --host 127.0.0.1 --port 8000 >"$BACKEND/server.log" 2>&1 &)
  for _ in $(seq 1 60); do curl -fs "$URL/health" >/dev/null 2>&1 && { say "${GREEN}Started.${OFF}"; return; }; sleep 1; done
  say "${RED}The backend did not start; see $BACKEND/server.log${OFF}"
}

menu() {
  while true; do
    show_target
    say "  1) seed                 super admin and a fictional college; saves credentials.txt"
    say "  2) create super admin   the first account only"
    say "  3) reset                empty the database"
    say "  4) reset and seed       start from a clean fictional college"
    [ "$TARGET" = local ] && say "  5) start local backend"
    say "  r) refresh status     t) change target     q) quit"
    read -r -p "> " action
    case "$action" in
      1) seed || true ;;
      2) create_super_admin || true ;;
      3) reset || true ;;
      4) if reset; then seed confirmed; fi ;;
      5) if [ "$TARGET" = local ]; then start_local_backend; else say "Pick one of the options above."; fi ;;
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
