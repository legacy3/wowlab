#!/bin/bash
set -e

cd "$(dirname "$0")/.."

for dir in functions/*/; do
  name=$(basename "$dir")
  if [[ "$name" != "_shared" && -f "${dir}deno.json" ]]; then
    echo "Deploying ${name}..."
    supabase functions deploy "$name"
  fi
done

echo "All functions deployed."
