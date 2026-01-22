#!/bin/bash
set -e

cd "$(dirname "$0")"

for dir in */; do
  if [[ "$dir" != "_shared/" && -f "${dir}deno.json" ]]; then
    echo "Checking ${dir%/}..."
    cd "$dir"
    deno install --quiet 2>/dev/null || true
    deno check index.ts
    cd ..
  fi
done

echo "All functions pass type checking."
