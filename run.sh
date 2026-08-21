#!/usr/bin/env bash
# User-facing entry point: serve the app locally.
set -euo pipefail
cd "$(dirname "$0")"

PYTHON="${PYTHON:-uv run python}"
PORT="${PORT:-8000}"

echo "Open http://127.0.0.1:${PORT}/ in a browser (Ctrl-C to stop)."
exec $PYTHON serve.py --port "$PORT"
