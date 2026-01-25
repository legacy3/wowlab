#!/usr/bin/env bash
set -euo pipefail

#==============================================================================
#
#    HERE BE DRAGONS
#
#    This script has only been run a handful of times on fresh machines.
#    It works on macOS and probably works on Linux.
#
#    If something breaks:
#      1. Read the error message
#      2. Install the failing tool manually
#      3. Re-run this script (it skips already-installed tools)
#      4. Fix the script and commit your fix
#
#    Known limitations:
#      - Windows: this script doesn't support Windows. Use WSL (Ubuntu
#        recommended) or install tools manually. Native Windows dev works,
#        the tooling just isn't there yet. PRs welcome!
#      - Linux: assumes apt-get (Debian/Ubuntu), requires sudo
#      - Doesn't handle version mismatches
#
#==============================================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

#------------------------------------------------------------------------------
# Args
#------------------------------------------------------------------------------

AUTO_YES=false
for arg in "$@"; do
    case "$arg" in
        -y|--yes) AUTO_YES=true ;;
    esac
done

#------------------------------------------------------------------------------
# Logging
#------------------------------------------------------------------------------

info()    { echo -e "\033[0;34m==>\033[0m $1"; }
success() { echo -e "\033[0;32m==>\033[0m $1"; }
warn()    { echo -e "\033[0;33m==>\033[0m $1"; }
error()   { echo -e "\033[0;31m==>\033[0m $1" >&2; }

#------------------------------------------------------------------------------
# OS Detection
#------------------------------------------------------------------------------

case "$(uname -s)" in
    Darwin*)              OS=macos ;;
    Linux*)               OS=linux ;;
    MINGW*|MSYS*|CYGWIN*) OS=windows ;;
    *)                    OS=unknown ;;
esac

#------------------------------------------------------------------------------
# Helpers
#------------------------------------------------------------------------------

has()     { command -v "$1" &>/dev/null; }
version() { "$1" --version 2>/dev/null | head -1; }

installed() {
    local cmd=$1
    if has "$cmd"; then
        success "$cmd already installed: $(version "$cmd")"
        return 0
    fi
    return 1
}

brew_or_fail() {
    if has brew; then
        brew install "$1"
    else
        error "Homebrew not found. Install $1 manually or install Homebrew first."
        return 1
    fi
}

confirm() {
    if [[ "$AUTO_YES" == true ]]; then
        echo "$1 [y/N] y (--yes)"
        return 0
    fi

    if [[ ! -t 0 ]]; then
        read -r response
        echo "$1 [y/N] $response"
        [[ "$response" =~ ^[yY] ]]
        return
    fi

    read -r -p "$1 [y/N] " response
    [[ "$response" =~ ^[yY] ]]
}

#------------------------------------------------------------------------------
# Installers
#------------------------------------------------------------------------------

install_rust() {
    installed rustc && return
    info "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source_cargo
    success "Rust installed: $(version rustc)"
}

install_protoc() {
    installed protoc && return
    info "Installing protobuf compiler..."
    case "$OS" in
        macos)  brew_or_fail protobuf ;;
        linux)  sudo apt-get update && sudo apt-get install -y protobuf-compiler ;;
        *)      error "Install protobuf manually for your OS"; return 1 ;;
    esac
    success "protoc installed: $(version protoc)"
}

install_wasm_target() {
    if rustup target list --installed | grep -q wasm32-unknown-unknown; then
        success "wasm32-unknown-unknown target already installed"
        return
    fi
    info "Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
    success "wasm32 target installed"
}

install_wasm_pack() {
    installed wasm-pack && return
    info "Installing wasm-pack..."
    cargo install wasm-pack
    success "wasm-pack installed: $(version wasm-pack)"
}

install_node() {
    installed node && return
    info "Installing fnm (Fast Node Manager)..."
    case "$OS" in
        macos) brew_or_fail fnm || curl -fsSL https://fnm.vercel.app/install | bash ;;
        *)     curl -fsSL https://fnm.vercel.app/install | bash ;;
    esac
    source_fnm
    info "Installing Node.js LTS..."
    fnm install --lts
    fnm use lts-latest
    success "Node.js installed: $(version node)"
}

install_pnpm() {
    installed pnpm && return
    info "Installing pnpm..."
    npm install -g pnpm
    success "pnpm installed: $(version pnpm)"
}

#------------------------------------------------------------------------------
# Environment
#------------------------------------------------------------------------------

source_cargo() {
    [[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
}

source_fnm() {
    [[ -d "$HOME/.local/share/fnm" ]] && export PATH="$HOME/.local/share/fnm:$PATH"
    has fnm && eval "$(fnm env 2>/dev/null)" || true
}

#------------------------------------------------------------------------------
# Project
#------------------------------------------------------------------------------

install_deps() {
    info "Installing project dependencies..."
    cd "$ROOT"
    pnpm install
    success "Dependencies installed"
}

build_wasm() {
    info "Building WASM packages..."
    "$ROOT/scripts/build.sh" all --force
}

#------------------------------------------------------------------------------
# Verify
#------------------------------------------------------------------------------

verify() {
    echo ""
    info "Verifying installation..."
    echo ""

    local all_good=true
    local tools=(rustc cargo protoc wasm-pack node pnpm)

    for cmd in "${tools[@]}"; do
        if has "$cmd"; then
            printf "  %-12s \033[0;32m✓\033[0m %s\n" "$cmd" "$(version "$cmd")"
        else
            printf "  %-12s \033[0;31m✗\033[0m not found\n" "$cmd"
            all_good=false
        fi
    done

    echo ""
    $all_good && success "All tools installed!" || { error "Some tools missing"; return 1; }
}

#------------------------------------------------------------------------------
# Main
#------------------------------------------------------------------------------

main() {
    echo ""
    echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
    echo "┃                                                                          ┃"
    echo "┃   WoW Lab Development Environment Setup                                  ┃"
    echo "┃                                                                          ┃"
    echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
    echo ""
    warn "Here be dragons. This script is not well tested."
    echo ""
    echo "  Never run scripts you haven't read. Review the source first:"
    echo "  https://github.com/legacy3/wowlab/blob/main/scripts/setup.sh"
    echo ""
    echo "  OS: $OS"
    echo ""
    echo "  This will install (if not already present):"
    echo ""
    echo "    • Rust (via rustup)"
    echo "    • wasm-pack + wasm32 target"
    echo "    • protobuf compiler (sudo required on Linux)"
    echo "    • Node.js (via fnm)"
    echo "    • pnpm"
    echo ""
    echo "  Then build WASM packages and install project dependencies."
    echo ""

    if ! confirm "Continue?"; then
        echo "Aborted."
        exit 0
    fi

    echo ""

    # Rust
    install_rust
    source_cargo
    install_wasm_target
    install_wasm_pack

    # System
    install_protoc

    # Node
    install_node
    source_fnm
    install_pnpm

    # Project
    install_deps
    build_wasm

    # Done
    verify

    echo ""
    echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
    echo "┃                                                                          ┃"
    echo "┃   Setup complete!                                                        ┃"
    echo "┃                                                                          ┃"
    echo "┃   Next steps:                                                            ┃"
    echo "┃                                                                          ┃"
    echo "┃     pnpm dev     Start development server                                ┃"
    echo "┃     pnpm build   Build everything                                        ┃"
    echo "┃     pnpm check   Run all checks                                          ┃"
    echo "┃                                                                          ┃"
    echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
    echo ""
}

main "$@"
