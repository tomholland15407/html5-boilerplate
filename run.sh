#!/usr/bin/env bash
# Start the shopping assistant. Builds the catalog on first run.
set -euo pipefail
cd "$(dirname "$0")"

PY=./.venv/bin/python
[ -x "$PY" ] || { echo "no venv — run: python3 -m venv .venv && ./.venv/bin/pip install fastapi uvicorn openpyxl httpx"; exit 1; }

if ! curl -sf --max-time 3 http://localhost:11434/api/version >/dev/null; then
  echo "Ollama is not responding on :11434 — start it first."; exit 1
fi

if [ ! -f data/catalog.db ]; then
  echo "building catalog ..."
  $PY backend/ingest.py
fi

# Publish it too, if this machine is set up for that. Funnel keeps its
# configuration across reboots, so this is a no-op after the first time — it is
# here so that one command is enough and the address never has to be handled.
if command -v tailscale >/dev/null 2>&1 && tailscale status >/dev/null 2>&1; then
  ON=$(tailscale funnel status --json 2>/dev/null | "$PY" -c \
    'import json,sys
try: print("yes" if any(json.load(sys.stdin).get("AllowFunnel", {}).values()) else "")
except Exception: print("")' 2>/dev/null || true)

  if [ -z "$ON" ]; then
    # Never blocks: without tailnet permission this polls until granted.
    (tailscale funnel --bg 8000 </dev/null >/dev/null 2>&1 &) || true
    sleep 2
    ON=$(tailscale funnel status --json 2>/dev/null | "$PY" -c \
      'import json,sys
try: print("yes" if any(json.load(sys.stdin).get("AllowFunnel", {}).values()) else "")
except Exception: print("")' 2>/dev/null || true)
  fi

  if [ -n "$ON" ]; then
    echo "public at:  https://$(tailscale status --json | "$PY" -c \
      'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
  else
    echo "note: tailscale funnel is off, so a hosted page cannot reach this machine." >&2
    echo "      enable it once:  tailscale funnel 8000" >&2
  fi
fi

echo "starting on http://localhost:8000  (first boot warms the models, ~10s)"
cd backend
exec ../.venv/bin/python -m uvicorn server:app --port 8000 --log-level warning
