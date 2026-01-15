#!/usr/bin/env bash
set -euo pipefail

# wowlab build script
# Usage: ./scripts/build.sh [target]
#
# Targets:
#   all         - Build everything (default)
#   parsers     - Build WASM parser only
#   engine      - Build Rust engine only
#   engine-wasm - Build WASM engine only
#   portal      - Build portal app only
#   rust        - Build all Rust crates
#   check       - Type check and lint everything

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}==>${NC} $1"; }
success() { echo -e "${GREEN}==>${NC} $1"; }
error() { echo -e "${RED}==>${NC} $1" >&2; }

# Check dependencies
check_deps() {
    if ! command -v wasm-pack &> /dev/null; then
        error "wasm-pack not found. Install with: cargo install wasm-pack"
        exit 1
    fi
    if ! command -v cargo &> /dev/null; then
        error "cargo not found. Install Rust from https://rustup.rs"
        exit 1
    fi
    if ! command -v pnpm &> /dev/null; then
        error "pnpm not found. Install with: npm install -g pnpm"
        exit 1
    fi
}

# Build WASM parser package
build_parsers() {
    info "Building WASM parser..."
    cd "$ROOT_DIR/crates/parsers"

    # Build to temp directory
    local tmp_dir="$ROOT_DIR/.wasm-build"
    rm -rf "$tmp_dir"
    wasm-pack build --target web --out-dir "$tmp_dir"

    # Pack tarball
    cd "$tmp_dir"
    rm -f "$ROOT_DIR/packages/parsers-"*.tgz
    local tarball=$(npm pack --pack-destination "$ROOT_DIR/packages" 2>/dev/null)
    cd "$ROOT_DIR"
    rm -rf "$tmp_dir"

    success "WASM parser built -> packages/$tarball"
}

# Build WASM engine package
build_engine_wasm() {
    info "Building WASM engine..."
    cd "$ROOT_DIR/crates/engine"

    # Build to default pkg directory with wasm feature, no default features
    rm -rf pkg
    wasm-pack build --target web --features wasm --no-default-features

    # Pack tarball
    cd pkg
    rm -f "$ROOT_DIR/packages/engine-"*.tgz
    local tarball=$(npm pack --pack-destination "$ROOT_DIR/packages" 2>/dev/null)
    cd "$ROOT_DIR"

    success "WASM engine built -> packages/$tarball"
}

# Build Rust engine
build_engine() {
    info "Building Rust engine..."
    cd "$ROOT_DIR/crates"
    cargo build --release -p engine
    success "Engine built"
}

# Build all Rust crates
build_rust() {
    info "Building all Rust crates..."
    cd "$ROOT_DIR/crates"
    cargo build --release
    success "All Rust crates built"
}

# Build portal
build_portal() {
    info "Building portal..."
    cd "$ROOT_DIR"
    pnpm --filter @apps/portal build
    success "Portal built"
}

# Build everything
build_all() {
    check_deps
    build_engine_wasm
    info "Installing dependencies..."
    pnpm install
    build_portal
    success "Full build complete!"
}

# Check/lint everything
check_all() {
    info "Running Rust checks..."
    cd "$ROOT_DIR/crates"
    cargo clippy --all-targets
    cargo fmt --check
    cargo test

    info "Running TypeScript checks..."
    cd "$ROOT_DIR"
    pnpm typecheck
    pnpm lint

    success "All checks passed!"
}

# Main
TARGET="${1:-all}"

case "$TARGET" in
    all)
        build_all
        ;;
    parsers)
        check_deps
        build_parsers
        ;;
    engine)
        build_engine
        ;;
    engine-wasm)
        check_deps
        build_engine_wasm
        ;;
    rust)
        build_rust
        ;;
    portal)
        build_portal
        ;;
    check)
        check_all
        ;;
    *)
        error "Unknown target: $TARGET"
        echo "Usage: $0 [all|parsers|engine|engine-wasm|rust|portal|check]"
        exit 1
        ;;
esac
