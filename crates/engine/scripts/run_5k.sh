#!/bin/bash
# Quick sim: 5000 iterations of BM Hunter
# Usage: ./scripts/run_5k.sh [extra args...]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$SCRIPT_DIR/.."
BINARY="$ENGINE_DIR/../target/release/engine"

cd "$ENGINE_DIR"
"$BINARY" sim -s bm-hunter -i 5000 "$@"
