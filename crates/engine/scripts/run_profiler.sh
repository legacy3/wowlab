#!/bin/bash
# Profile the engine and show hotspots
# Usage: ./scripts/run_profiler.sh [iterations] [--json] [--top N]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/profile.py" "$@"
