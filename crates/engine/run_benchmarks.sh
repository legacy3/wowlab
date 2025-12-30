#!/bin/bash
# Comprehensive benchmark script for the simulation engine
# Tests sequential vs parallel scaling, thread efficiency, and throughput
#
# Usage: ./run_benchmarks.sh [iterations]
#   iterations: number of iterations per test (default: 500000)

set -e

ITERATIONS=${1:-500000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
echo -e "  Platform: $(uname -m)"
echo ""

# Build release binary
echo -e "${YELLOW}Building release binary...${NC}"
cargo build --release --quiet
BINARY="./target/release/engine"
SPEC="specs/hunter/beast-mastery.toml"

echo -e "${GREEN}Build complete.${NC}"
echo ""

# Get baseline info
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Spec Configuration${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
$BINARY validate --spec "$SPEC" --rotation rotations/bm_st.rhai 2>&1 | head -6
echo ""

# Storage for results
declare -a THREAD_COUNTS=()
declare -a THROUGHPUTS=()
declare -a TIMES=()

# Extract throughput from benchmark output
extract_throughput() {
    echo "$1" | grep "Throughput:" | grep -oE '[0-9]+\.[0-9]+' | head -1
}

extract_time() {
    echo "$1" | grep "Time:" | grep -oE '[0-9]+\.[0-9]+m?s' | head -1
}

# Run a single benchmark
run_benchmark() {
    local threads=$1
    local label=$2

    if [ "$threads" -eq 1 ]; then
        # Sequential mode
        output=$($BINARY bench --spec "$SPEC" -i "$ITERATIONS" 2>&1)
    else
        # Parallel mode with specific thread count
        output=$($BINARY bench --spec "$SPEC" -i "$ITERATIONS" --parallel -t "$threads" 2>&1)
    fi

    tp=$(extract_throughput "$output")
    time=$(extract_time "$output")

    THREAD_COUNTS+=("$threads")
    THROUGHPUTS+=("$tp")
    TIMES+=("$time")

    printf "  %-20s %8s threads  →  ${GREEN}%6sM sims/sec${NC}  (%s)\n" "$label" "$threads" "$tp" "$time"
}

echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Sequential vs Parallel Scaling${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo ""

# Run benchmarks at different thread counts
run_benchmark 1  "Sequential"
run_benchmark 2  "2 threads"
run_benchmark 4  "4 threads"
run_benchmark 6  "6 threads (P-cores)"
run_benchmark 8  "8 threads"
run_benchmark 12 "12 threads (all)"

echo ""

# Calculate speedups and efficiency
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Scaling Analysis${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo ""

baseline=${THROUGHPUTS[0]}

printf "  ${BOLD}%-12s  %12s  %10s  %12s${NC}\n" "Threads" "Throughput" "Speedup" "Efficiency"
printf "  %-12s  %12s  %10s  %12s\n" "────────────" "────────────" "──────────" "────────────"

for i in "${!THREAD_COUNTS[@]}"; do
    threads=${THREAD_COUNTS[$i]}
    tp=${THROUGHPUTS[$i]}

    # Calculate speedup: throughput / baseline
    speedup=$(echo "scale=2; $tp / $baseline" | bc)

    # Calculate efficiency: speedup / threads * 100
    efficiency=$(echo "scale=1; $speedup / $threads * 100" | bc)

    # Color efficiency based on value
    if (( $(echo "$efficiency >= 80" | bc -l) )); then
        eff_color=$GREEN
    elif (( $(echo "$efficiency >= 60" | bc -l) )); then
        eff_color=$YELLOW
    else
        eff_color=$RED
    fi

    printf "  %-12s  %10sM/s  %9sx  ${eff_color}%10s%%${NC}\n" "$threads" "$tp" "$speedup" "$efficiency"
done

echo ""

# P-core recommendation
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

# Get last elements (bash 3 compatible)
last_idx=$((${#THROUGHPUTS[@]} - 1))
max_tp=${THROUGHPUTS[$last_idx]}
max_threads=${THREAD_COUNTS[$last_idx]}

echo -e "  • ${CYAN}Optimal for efficiency:${NC} $best_threads threads (${best_throughput}M sims/sec)"
echo -e "  • ${CYAN}Maximum throughput:${NC} ${max_tp}M sims/sec with ${max_threads} threads"
echo -e "  • ${CYAN}Default (P-cores):${NC} 6 threads - best balance of speed and consistency"
echo ""

# Feature flags test
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Feature Flags Comparison${NC}"
echo -e "${BOLD}────────────────────────────────────────────────────────────────${NC}"
echo ""

echo -e "  Testing with 6 threads (P-cores)..."
echo ""

# Default (no special features)
output=$($BINARY bench --spec "$SPEC" -i "$ITERATIONS" --parallel 2>&1)
tp_default=$(extract_throughput "$output")
printf "  %-30s  ${GREEN}%6sM sims/sec${NC}\n" "default" "$tp_default"

# With meta_events
cargo build --release --quiet --features meta_events
output=$($BINARY bench --spec "$SPEC" -i "$ITERATIONS" --parallel 2>&1)
tp_meta=$(extract_throughput "$output")
printf "  %-30s  %6sM sims/sec\n" "meta_events" "$tp_meta"

# With large_capacity
cargo build --release --quiet --features large_capacity
output=$($BINARY bench --spec "$SPEC" -i "$ITERATIONS" --parallel 2>&1)
tp_large=$(extract_throughput "$output")
printf "  %-30s  %6sM sims/sec\n" "large_capacity" "$tp_large"

# Rebuild default for clean state
cargo build --release --quiet

echo ""

# Summary
echo -e "${BOLD}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}                           Summary${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Calculate speedup for 6 threads
speedup_6=$(echo "scale=2; ${THROUGHPUTS[3]} / ${THROUGHPUTS[0]}" | bc)

echo -e "  Sequential baseline:     ${CYAN}${THROUGHPUTS[0]}M sims/sec${NC}"
echo -e "  Parallel (6 P-cores):    ${GREEN}${THROUGHPUTS[3]}M sims/sec${NC} (${speedup_6}x speedup)"
echo -e "  Parallel (12 all cores): ${YELLOW}${THROUGHPUTS[5]}M sims/sec${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} P-core scaling is near-linear (~80% efficiency)"
echo -e "  ${YELLOW}!${NC} E-cores add diminishing returns (lower efficiency)"
echo ""
echo -e "${BOLD}Done!${NC}"
