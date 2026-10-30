#!/usr/bin/env bash
# Package an iOS .app bundle into an IPA on Linux/macOS.
# This does NOT sign the app. Use iLoader or another legitimate signing workflow.

set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Usage:
  make_ipa.sh <Runner.app.zip | App.app directory> [output.ipa]

Examples:
  ./make_ipa.sh ~/Downloads/Runner.app.zip
  ./make_ipa.sh ~/Downloads/Runner.app.zip ~/Downloads/attendance_mobile.ipa
  ./make_ipa.sh /path/to/Runner.app ./attendance_mobile.ipa

Accepts a ZIP containing either:
  Runner.app/...
or:
  Payload/Runner.app/...

The output IPA is a container only; this script does not sign it.
USAGE
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage >&2
  exit 2
fi

INPUT="${1/#\~/$HOME}"
OUTPUT="${2:-$PWD/attendance_mobile.ipa}"
OUTPUT="${OUTPUT/#\~/$HOME}"

if [[ ! -e "$INPUT" ]]; then
  echo "Error: input not found: $INPUT" >&2
  exit 1
fi

for cmd in zip unzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required. On Ubuntu install it with: sudo apt install zip unzip" >&2
    exit 1
  fi
done

# Resolve output to an absolute path before creating the temporary directory.
mkdir -p "$(dirname "$OUTPUT")"
OUTPUT="$(cd "$(dirname "$OUTPUT")" && pwd)/$(basename "$OUTPUT")"

WORK="$(mktemp -d)"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

PAYLOAD="$WORK/Payload"
mkdir -p "$PAYLOAD"

if [[ -d "$INPUT" && "$INPUT" == *.app ]]; then
  APP_PATH="$INPUT"
elif [[ -f "$INPUT" ]]; then
  if ! unzip -tq "$INPUT" >/dev/null 2>&1; then
    echo "Error: input is not a readable ZIP archive: $INPUT" >&2
    exit 1
  fi

  unzip -q "$INPUT" -d "$WORK/extracted"

  # Prefer an app already under Payload; otherwise find the first .app bundle.
  APP_PATH=""
  if [[ -d "$WORK/extracted/Payload" ]]; then
    while IFS= read -r -d '' candidate; do
      APP_PATH="$candidate"
      break
    done < <(find "$WORK/extracted/Payload" -maxdepth 2 -type d -name '*.app' -print0)
  fi
  if [[ -z "$APP_PATH" ]]; then
    while IFS= read -r -d '' candidate; do
      APP_PATH="$candidate"
      break
    done < <(find "$WORK/extracted" -type d -name '*.app' -print0)
  fi
  if [[ -z "$APP_PATH" ]]; then
    echo "Error: no .app bundle found inside: $INPUT" >&2
    echo "Check that you downloaded the iOS app artifact from Codemagic." >&2
    exit 1
  fi
else
  echo "Error: input must be a ZIP archive or a path to a .app directory." >&2
  usage >&2
  exit 2
fi

if [[ ! -f "$APP_PATH/Info.plist" ]]; then
  echo "Error: found app bundle but Info.plist is missing: $APP_PATH" >&2
  exit 1
fi

APP_NAME="$(basename "$APP_PATH")"
cp -a "$APP_PATH" "$PAYLOAD/$APP_NAME"

# Remove an old output first so zip cannot append to a stale IPA.
rm -f "$OUTPUT"
(
  cd "$WORK"
  zip -qr "$OUTPUT" Payload
)

if ! unzip -tq "$OUTPUT" >/dev/null 2>&1; then
  echo "Error: generated IPA failed ZIP integrity validation." >&2
  rm -f "$OUTPUT"
  exit 1
fi

echo "IPA created: $OUTPUT"
echo "Contents:"
unzip -l "$OUTPUT" | grep -m 5 -E 'Payload/[^/]+\.app/Info\.plist|Payload/[^/]+\.app/' || true
echo
echo "Reminder: this script packages the app; it does NOT sign it."
echo "Import the IPA into iLoader and use its Sign & Install flow."