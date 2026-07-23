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

echo "starting on http://localhost:8000  (first boot warms the models, ~10s)"
cd backend
exec ../.venv/bin/python -m uvicorn server:app --port 8000 --log-level warning
