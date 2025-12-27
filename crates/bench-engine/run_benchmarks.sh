#!/bin/bash
# Benchmark script for testing all feature flag combinations
# Usage: ./run_benchmarks.sh [iterations]
#   iterations: number of iterations for the main benchmark (default: 16000000)

set -e

ITERATIONS=${1:-16000000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "Engine Benchmark Suite"
echo "========================================"
echo "Iterations: $ITERATIONS"
echo "Date: $(date)"
echo ""

# Feature combinations to test
declare -a FEATURES=(
    ""
    "engine/quaternary_heap"
    "engine/front_buffer"
    "engine/all_optimizations"
)

declare -a NAMES=(
    "baseline (binary heap)"
    "quaternary_heap"
    "front_buffer"
    "all_optimizations"
)

# Results storage
declare -a RESULTS=()

# Build all variants first
echo "Building all variants..."
for i in "${!FEATURES[@]}"; do
    feat="${FEATURES[$i]}"
    name="${NAMES[$i]}"
    if [ -z "$feat" ]; then
        echo "  Building: $name"
        cargo build --release 2>/dev/null
    else
        echo "  Building: $name"
        cargo build --release --features "$feat" 2>/dev/null
    fi
done
echo ""

# Run benchmarks
echo "========================================"
echo "Running Benchmarks"
echo "========================================"

for i in "${!FEATURES[@]}"; do
    feat="${FEATURES[$i]}"
    name="${NAMES[$i]}"

    echo ""
    echo "--- $name ---"

    if [ -z "$feat" ]; then
        output=$(cargo run --release 2>&1)
    else
        output=$(cargo run --release --features "$feat" 2>&1)
    fi

    # Extract key metrics
    single_sim=$(echo "$output" | grep "^Single" | head -1)
    events=$(echo "$output" | grep "Events processed" | head -1)
    warmup=$(echo "$output" | grep "100000 sims" | head -1)
    main_time=$(echo "$output" | grep "^Time:" | head -1)
    throughput=$(echo "$output" | grep "^Throughput:" | head -1)

    echo "$single_sim"
    echo "$events"
    echo "$warmup"
    echo "$main_time"
    echo "$throughput"

    # Store result for summary
    tp=$(echo "$throughput" | grep -oE '[0-9]+\.[0-9]+')
    RESULTS+=("$name|$tp")
done

# Summary table
echo ""
echo "========================================"
echo "Summary"
echo "========================================"
printf "%-25s %15s\n" "Configuration" "Throughput"
printf "%-25s %15s\n" "-------------------------" "---------------"
for result in "${RESULTS[@]}"; do
    name=$(echo "$result" | cut -d'|' -f1)
    tp=$(echo "$result" | cut -d'|' -f2)
    printf "%-25s %12sM/s\n" "$name" "$tp"
done

echo ""
echo "Done!"
