#!/usr/bin/env bash
set -euo pipefail

# wowlab development environment setup
# Run this on a fresh machine to get everything working

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

info() { echo -e "${BLUE}==>${NC} $1"; }
success() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
error() { echo -e "${RED}==>${NC} $1" >&2; }

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)  OS="linux" ;;
        Darwin*) OS="macos" ;;
        MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
        *) OS="unknown" ;;
    esac
    echo "$OS"
}

OS=$(detect_os)

# Install Rust
install_rust() {
    if command -v rustc &> /dev/null; then
        local version=$(rustc --version)
        success "Rust already installed: $version"
        return 0
    fi

    info "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    success "Rust installed: $(rustc --version)"
}

# Install wasm-pack
install_wasm_pack() {
    if command -v wasm-pack &> /dev/null; then
        local version=$(wasm-pack --version)
        success "wasm-pack already installed: $version"
        return 0
    fi

    info "Installing wasm-pack..."
    cargo install wasm-pack
    success "wasm-pack installed: $(wasm-pack --version)"
}

# Install wasm32 target
install_wasm_target() {
    if rustup target list --installed | grep -q wasm32-unknown-unknown; then
        success "wasm32-unknown-unknown target already installed"
        return 0
    fi

    info "Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
    success "wasm32 target installed"
}

# Install Node.js via fnm (if not present)
install_node() {
    if command -v node &> /dev/null; then
        local version=$(node --version)
        success "Node.js already installed: $version"
        return 0
    fi

    info "Installing fnm (Fast Node Manager)..."
    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install fnm
        else
            curl -fsSL https://fnm.vercel.app/install | bash
        fi
    else
        curl -fsSL https://fnm.vercel.app/install | bash
    fi

    # Source fnm
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"

    info "Installing Node.js LTS..."
    fnm install --lts
    fnm use lts-latest
    success "Node.js installed: $(node --version)"
}

# Install pnpm
install_pnpm() {
    if command -v pnpm &> /dev/null; then
        local version=$(pnpm --version)
        success "pnpm already installed: $version"
        return 0
    fi

    info "Installing pnpm..."
    npm install -g pnpm
    success "pnpm installed: $(pnpm --version)"
}

# Install project dependencies
install_deps() {
    info "Installing project dependencies..."
    cd "$ROOT_DIR"
    pnpm install
    success "Dependencies installed"
}

# Build WASM packages
build_wasm() {
    info "Building WASM packages..."
    "$SCRIPT_DIR/build.sh" parsers
    success "WASM packages built"
}

# Verify installation
verify() {
    echo ""
    info "Verifying installation..."
    echo ""

    local all_good=true

    # Check each tool
    for cmd in rustc cargo wasm-pack node pnpm; do
        if command -v $cmd &> /dev/null; then
            printf "  %-12s ${GREEN}✓${NC} %s\n" "$cmd" "$($cmd --version 2>/dev/null | head -1)"
        else
            printf "  %-12s ${RED}✗${NC} not found\n" "$cmd"
            all_good=false
        fi
    done

    echo ""

    if $all_good; then
        success "All tools installed!"
    else
        error "Some tools are missing"
        return 1
    fi
}

# Print next steps
next_steps() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "Setup complete!"
    echo ""
    echo "  Next steps:"
    echo ""
    echo "    pnpm dev          # Start development server"
    echo "    pnpm build        # Build everything"
    echo "    pnpm check        # Run all checks"
    echo ""
    echo "  After changing Rust code:"
    echo ""
    echo "    pnpm build:parsers   # Rebuild WASM parser"
    echo "    pnpm build:engine    # Rebuild engine"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  wowlab development environment setup"
    echo "  Detected OS: $OS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    install_rust

    # Source cargo env in case it was just installed
    [[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

    install_wasm_target
    install_wasm_pack
    install_node

    # Source fnm if installed
    if [[ -d "$HOME/.local/share/fnm" ]]; then
        export PATH="$HOME/.local/share/fnm:$PATH"
        eval "$(fnm env 2>/dev/null)" || true
    fi

    install_pnpm
    install_deps
    build_wasm
    verify
    next_steps
}

main "$@"
