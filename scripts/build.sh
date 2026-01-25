#!/usr/bin/env bash
set -euo pipefail

# wowlab build script
# Usage: ./scripts/build.sh [target] [--force]
#
# Targets:
#   all         - Build everything (default)
#   parsers     - Build WASM parser only
#   engine      - Build Rust engine only
#   engine-wasm - Build WASM engine only
#   portal      - Build portal app only
#   rust        - Build all Rust crates
#   check       - Type check and lint everything
#
# Options:
#   --force     - Force rebuild even if no changes detected

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE="$ROOT/.build-cache"

# Colors & logging
info()    { echo -e "\033[0;34m==>\033[0m $1"; }
success() { echo -e "\033[0;32m==>\033[0m $1"; }
error()   { echo -e "\033[0;31m==>\033[0m $1" >&2; }
skip()    { echo -e "\033[0;33m==>\033[0m $1 (no changes)"; }
debug()   { echo -e "\033[0;34m   \033[0m $1"; }

# Parse args
FORCE=false
TARGET=all
for arg in "$@"; do
    case "$arg" in
        --force) FORCE=true ;;
        -*) ;;
        *) TARGET="$arg" ;;
    esac
done

mkdir -p "$CACHE"

#------------------------------------------------------------------------------
# Cache functions
#------------------------------------------------------------------------------

checksum() {
    local tmp=$(mktemp)
    for pattern in "$@"; do
        find $pattern -type f 2>/dev/null >> "$tmp"
    done
    if [[ -s "$tmp" ]]; then
        sort "$tmp" | xargs cat 2>/dev/null | shasum -a 256 | cut -d' ' -f1
    else
        echo "empty"
    fi
    rm -f "$tmp"
}

cached() {
    local name=$1; shift
    local cache_file="$CACHE/$name.checksum"

    debug "[$name] checking cache..."

    if [[ "$FORCE" == true ]]; then
        debug "[$name] --force specified, rebuilding"
        return 1
    fi

    local current=$(checksum "$@")
    debug "[$name] current: ${current:0:12}..."

    if [[ -f "$cache_file" ]]; then
        local cached=$(cat "$cache_file")
        debug "[$name] cached:  ${cached:0:12}..."
        [[ "$current" == "$cached" ]]
    else
        debug "[$name] no cache found, rebuilding"
        return 1
    fi
}

save_cache() {
    local name=$1; shift
    checksum "$@" > "$CACHE/$name.checksum"
}

#------------------------------------------------------------------------------
# Build functions
#------------------------------------------------------------------------------

build_wasm_pkg() {
    local name=$1 crate=$2 pkg_name=$3
    shift 3
    local patterns=("$ROOT/crates/$crate/src" "$ROOT/crates/$crate/Cargo.toml")

    if cached "$name" "${patterns[@]}"; then
        skip "WASM $crate already up to date"
        return
    fi

    info "Building WASM $crate..."
    cd "$ROOT/crates/$crate"

    rm -rf pkg
    wasm-pack build --target web "$@"

    # Move to temp if using custom out-dir, otherwise use pkg
    local pkg_dir="${WASM_OUT_DIR:-pkg}"
    cd "$pkg_dir"
    rm -f "$ROOT/packages/$pkg_name-"*.tgz
    local tarball=$(npm pack --pack-destination "$ROOT/packages")
    cd "$ROOT"
    [[ -n "${WASM_OUT_DIR:-}" ]] && rm -rf "$WASM_OUT_DIR"

    save_cache "$name" "${patterns[@]}"
    success "WASM $crate built -> packages/$tarball"
}

build_parsers() {
    WASM_OUT_DIR="$ROOT/.wasm-build" build_wasm_pkg \
        parsers parsers wowlab-parsers \
        --out-dir "$ROOT/.wasm-build"
}

build_engine_wasm() {
    build_wasm_pkg \
        engine-wasm engine wowlab-engine \
        --features wasm --no-default-features
}

build_engine() {
    local patterns=("$ROOT/crates/engine/src" "$ROOT/crates/engine/Cargo.toml")

    if cached engine "${patterns[@]}"; then
        skip "Rust engine already up to date"
        return
    fi

    info "Building Rust engine..."
    cargo build --release -p engine --manifest-path "$ROOT/crates/Cargo.toml"
    save_cache engine "${patterns[@]}"
    success "Engine built"
}

build_rust() {
    local patterns=("$ROOT/crates/*/src" "$ROOT/crates/*/Cargo.toml" "$ROOT/crates/Cargo.toml")

    if cached rust "${patterns[@]}"; then
        skip "Rust crates already up to date"
        return
    fi

    info "Building all Rust crates..."
    cargo build --release --manifest-path "$ROOT/crates/Cargo.toml"
    save_cache rust "${patterns[@]}"
    success "All Rust crates built"
}

build_portal() {
    local patterns=("$ROOT/apps/portal/src" "$ROOT/apps/portal/package.json" "$ROOT/packages/*.tgz")

    if cached portal "${patterns[@]}"; then
        skip "Portal already up to date"
        return
    fi

    info "Building portal..."
    pnpm --filter @apps/portal build
    save_cache portal "${patterns[@]}"
    success "Portal built"
}

build_all() {
    require_deps wasm-pack cargo pnpm
    build_parsers
    build_engine_wasm
    info "Installing dependencies..."
    pnpm install
    build_portal
    success "Full build complete!"
}

check_all() {
    info "Running Rust checks..."
    cd "$ROOT/crates"
    cargo clippy --all-targets
    cargo fmt --check
    cargo test

    info "Running TypeScript checks..."
    cd "$ROOT"
    pnpm typecheck
    pnpm lint

    success "All checks passed!"
}

#------------------------------------------------------------------------------
# Utilities
#------------------------------------------------------------------------------

require_deps() {
    for cmd in "$@"; do
        if ! command -v "$cmd" &>/dev/null; then
            error "$cmd not found"
            exit 1
        fi
    done
}

#------------------------------------------------------------------------------
# Main
#------------------------------------------------------------------------------

case "$TARGET" in
    all)         build_all ;;
    parsers)     require_deps wasm-pack && build_parsers ;;
    engine)      build_engine ;;
    engine-wasm) require_deps wasm-pack && build_engine_wasm ;;
    rust)        build_rust ;;
    portal)      build_portal ;;
    check)       check_all ;;
    *)
        error "Unknown target: $TARGET"
        echo "Usage: $0 [all|parsers|engine|engine-wasm|rust|portal|check] [--force]"
        exit 1
        ;;
esac
