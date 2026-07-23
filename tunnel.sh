#!/usr/bin/env bash
# Publish the local assistant so a hosted page can reach it.
#
# The model and the catalog never move: Ollama and the 13,754-row SQLite stay on
# this machine and only the chat endpoint is exposed, on a throwaway hostname
# that changes every run. Ctrl-C and it is gone again.
#
# Run ./run.sh in another terminal first, then this. Pass your Vercel domain to
# have the ready-made link printed for you:
#
#     VERCEL_URL=https://my-app.vercel.app ./tunnel.sh
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8000}"
VERCEL_URL="${VERCEL_URL:-}"

command -v cloudflared >/dev/null 2>&1 || {
  echo "cloudflared is not installed.  brew install cloudflared" >&2; exit 1; }

curl -sf --max-time 3 "http://localhost:$PORT/api/health" >/dev/null 2>&1 || {
  echo "nothing is answering on :$PORT — start ./run.sh first" >&2; exit 1; }

LOG="$(mktemp -t dmx-tunnel)"
cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate >"$LOG" 2>&1 &
TUNNEL_PID=$!
trap 'kill "$TUNNEL_PID" 2>/dev/null || true; rm -f "$LOG"' EXIT

printf 'opening a tunnel to localhost:%s ' "$PORT"
URL=""
for _ in $(seq 1 45); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$URL" ] && break
  kill -0 "$TUNNEL_PID" 2>/dev/null || { echo; echo "cloudflared exited:" >&2; cat "$LOG" >&2; exit 1; }
  printf '.'; sleep 1
done
echo

[ -n "$URL" ] || { echo "no tunnel hostname appeared:" >&2; cat "$LOG" >&2; exit 1; }

# Prove it end to end rather than trust the hostname exists. cloudflared says so
# itself — "it may take some time to be reachable" — and in practice the name
# takes a few seconds to resolve, so keep trying rather than warn immediately.
printf 'waiting for it to answer '
READY=""
for _ in $(seq 1 15); do
  if curl -sf --max-time 8 "$URL/api/health" >/dev/null 2>&1; then READY=yes; break; fi
  printf '.'; sleep 4
done
echo
if [ -n "$READY" ]; then
  echo "the catalog answered through the tunnel — it is live"
else
  echo "the hostname exists but nothing answered through it yet." >&2
  echo "give it another minute, then check: curl $URL/api/health" >&2
fi

echo
echo "  backend reachable at:  $URL"
if [ -n "$VERCEL_URL" ]; then
  echo "  open the demo at:      ${VERCEL_URL%/}/?api=$URL"
  echo
  echo "  That link only has to be used once per tunnel — the browser remembers"
  echo "  the address. Restarting this script changes the hostname, so open the"
  echo "  new link once when it does."
else
  echo "  open the demo at:      https://<your-app>.vercel.app/?api=$URL"
  echo
  echo "  (set VERCEL_URL=... before running this to have that printed properly)"
fi
echo
echo "  Keep the Mac awake for the whole demo:  caffeinate -dims"
echo "  Ctrl-C closes the tunnel."
echo

wait "$TUNNEL_PID"
