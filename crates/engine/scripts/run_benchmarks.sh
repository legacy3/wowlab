#!/bin/bash
# Comprehensive benchmark script for the simulation engine
# Tests sequential vs parallel scaling, thread efficiency, and throughput
#
# Usage: ./run_benchmarks.sh [iterations]
#   iterations: number of iterations per test (default: 100000)

set -e

ITERATIONS=${1:-100000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$SCRIPT_DIR/.."
cd "$ENGINE_DIR"

# Binary location (shared target directory)
BINARY="../target/release/engine"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}                    Engine Benchmark Suite${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Iterations per test: ${CYAN}$ITERATIONS${NC}"
echo -e "  Date: $(date)"
echo -e "  Platform: $(uname -s) $(uname -m)"

# Get CPU core count
if [[ "$(uname)" == "Darwin" ]]; then
    TOTAL_CORES=$(sysctl -n hw.ncpu 2>/dev/null || echo "?")
    p_cores=$(sysctl -n hw.perflevel0.logicalcpu 2>/dev/null || echo "")
    e_cores=$(sysctl -n hw.perflevel1.logicalcpu 2>/dev/null || echo "")
    if [[ -n "$p_cores" && -n "$e_cores" ]]; then
        echo -e "  CPU: ${p_cores} P-cores + ${e_cores} E-cores (${TOTAL_CORES} total)"
    else
        echo -e "  CPU: ${TOTAL_CORES} cores"
    fi
else
    TOTAL_CORES=$(nproc 2>/dev/null || echo "4")
    echo -e "  CPU: ${TOTAL_CORES} cores"
fi
echo ""

# Build release binary
echo -e "${YELLOW}Building release binary...${NC}"
cargo build --release --quiet
echo -e "${GREEN}Build complete.${NC}"
echo ""

# Check binary exists
if [[ ! -x "$BINARY" ]]; then
    echo -e "${RED}Error: Binary not found at $BINARY${NC}"
    exit 1
fi

# Show version
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Engine Info${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
$BINARY version 2>&1 || true
echo ""

# Validate rotation
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Rotation Validation${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
if [[ -f "rotations/bm_hunter.rhai" ]]; then
    $BINARY validate -f rotations/bm_hunter.rhai 2>&1 | head -10 || true
else
    echo -e "  ${YELLOW}No rotation file found to validate${NC}"
fi
echo ""

# Storage for results
declare -a THREAD_COUNTS=()
declare -a THROUGHPUTS=()
declare -a TIMES=()

# Extract throughput from sim output: "1000 iterations in 0 seconds (2851/sec) using 12 cores"
extract_throughput() {
    echo "$1" | grep -oE '\([0-9]+/sec\)' | grep -oE '[0-9]+' | head -1
}

# Run a single benchmark
run_benchmark() {
    local threads=$1
    local label=$2

    output=$($BINARY sim -s bm-hunter -d 60 -i "$ITERATIONS" --threads "$threads" 2>&1)

    tp=$(extract_throughput "$output")

    if [[ -z "$tp" ]]; then
        tp="0"
    fi

    THREAD_COUNTS+=("$threads")
    THROUGHPUTS+=("$tp")

    # Format throughput nicely
    if (( tp >= 1000000 )); then
        tp_fmt=$(echo "scale=2; $tp / 1000000" | bc)
        tp_unit="M"
    elif (( tp >= 1000 )); then
        tp_fmt=$(echo "scale=2; $tp / 1000" | bc)
        tp_unit="K"
    else
        tp_fmt="$tp"
        tp_unit=""
    fi

    printf "  %-20s %8s threads  →  ${GREEN}%8s${tp_unit} sims/sec${NC}\n" "$label" "$threads" "$tp_fmt"
}

echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Sequential vs Parallel Scaling${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Determine thread counts to test based on available cores
declare -a TEST_THREADS=(1 2)
if (( TOTAL_CORES >= 4 )); then TEST_THREADS+=(4); fi
if (( TOTAL_CORES >= 6 )); then TEST_THREADS+=(6); fi
if (( TOTAL_CORES >= 8 )); then TEST_THREADS+=(8); fi
if (( TOTAL_CORES >= 12 )); then TEST_THREADS+=(12); fi
if (( TOTAL_CORES >= 16 )); then TEST_THREADS+=(16); fi
# Always include max cores if not already in list
if [[ ! " ${TEST_THREADS[*]} " =~ " ${TOTAL_CORES} " ]]; then
    TEST_THREADS+=("$TOTAL_CORES")
fi

# Run benchmarks at different thread counts
for threads in "${TEST_THREADS[@]}"; do
    if (( threads == 1 )); then
        label="Sequential"
    elif (( threads == TOTAL_CORES )); then
        label="${threads} threads (all)"
    else
        label="${threads} threads"
    fi
    run_benchmark "$threads" "$label"
done

echo ""

# Calculate speedups and efficiency
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Scaling Analysis${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo ""

baseline=${THROUGHPUTS[0]}

if [[ "$baseline" == "0" || -z "$baseline" ]]; then
    echo -e "  ${RED}Error: Could not get baseline throughput${NC}"
    exit 1
fi

printf "  ${BOLD}%-12s  %12s  %10s  %12s${NC}\n" "Threads" "Throughput" "Speedup" "Efficiency"
printf "  %-12s  %12s  %10s  %12s\n" "────────────" "────────────" "──────────" "────────────"

for i in "${!THREAD_COUNTS[@]}"; do
    threads=${THREAD_COUNTS[$i]}
    tp=${THROUGHPUTS[$i]}

    # Format throughput
    if (( tp >= 1000000 )); then
        tp_fmt="$(echo "scale=1; $tp / 1000000" | bc)M"
    elif (( tp >= 1000 )); then
        tp_fmt="$(echo "scale=1; $tp / 1000" | bc)K"
    else
        tp_fmt="$tp"
    fi

    # Calculate speedup: throughput / baseline
    speedup=$(echo "scale=2; $tp / $baseline" | bc)

    # Calculate efficiency: speedup / threads * 100
    efficiency=$(echo "scale=1; ($tp / $baseline) / $threads * 100" | bc)

    # Color efficiency based on value
    if (( $(echo "$efficiency >= 80" | bc -l) )); then
        eff_color=$GREEN
    elif (( $(echo "$efficiency >= 60" | bc -l) )); then
        eff_color=$YELLOW
    else
        eff_color=$RED
    fi

    printf "  %-12s  %10s/s  %9sx  ${eff_color}%10s%%${NC}\n" "$threads" "$tp_fmt" "$speedup" "$efficiency"
done

echo ""

# Recommendations
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Recommendations${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Find optimal thread count (best efficiency above 70%)
best_threads=1
best_throughput=$baseline
for i in "${!THREAD_COUNTS[@]}"; do
    threads=${THREAD_COUNTS[$i]}
    tp=${THROUGHPUTS[$i]}
    speedup=$(echo "scale=2; $tp / $baseline" | bc)
    efficiency=$(echo "scale=1; $speedup / $threads * 100" | bc)

    if (( $(echo "$efficiency >= 70" | bc -l) )) && (( $(echo "$tp > $best_throughput" | bc -l) )); then
        best_threads=$threads
        best_throughput=$tp
    fi
done

# Get max throughput
max_tp=0
max_threads=1
for i in "${!THREAD_COUNTS[@]}"; do
    tp=${THROUGHPUTS[$i]}
    if (( $(echo "$tp > $max_tp" | bc -l) )); then
        max_tp=$tp
        max_threads=${THREAD_COUNTS[$i]}
    fi
done

# Format throughputs for display
format_tp() {
    local tp=$1
    if (( tp >= 1000000 )); then
        echo "$(echo "scale=1; $tp / 1000000" | bc)M"
    elif (( tp >= 1000 )); then
        echo "$(echo "scale=1; $tp / 1000" | bc)K"
    else
        echo "$tp"
    fi
}

echo -e "  ${CYAN}Optimal for efficiency:${NC} $best_threads threads ($(format_tp $best_throughput) sims/sec)"
echo -e "  ${CYAN}Maximum throughput:${NC} $(format_tp $max_tp) sims/sec with ${max_threads} threads"
echo ""

# Summary
echo -e "${BOLD}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}                           Summary${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Calculate max speedup
max_speedup=$(echo "scale=2; $max_tp / $baseline" | bc)

echo -e "  Sequential baseline:     ${CYAN}$(format_tp $baseline) sims/sec${NC}"
echo -e "  Maximum parallel:        ${GREEN}$(format_tp $max_tp) sims/sec${NC} (${max_speedup}x speedup with ${max_threads} threads)"
echo ""
echo -e "${BOLD}Done!${NC}"
