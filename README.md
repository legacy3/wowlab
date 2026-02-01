# WowLab

[![CI](https://github.com/legacy3/wowlab/actions/workflows/ci.yml/badge.svg)](https://github.com/legacy3/wowlab/actions/workflows/ci.yml)

A monorepo for World of Warcraft spell rotation simulation and analysis.

## Overview

WoW Lab provides a high-performance, event-driven simulation engine for analyzing WoW spell rotations and damage output. The simulation core is written in Rust (`crates/engine/`) with WASM bindings for browser use. Shared types and parsers live in `crates/common/` which compiles to both native and WASM.

**Tech Stack:**

- **Simulation Engine:** Rust (with WASM support for browser)
- **Shared Library:** Rust (`crates/common/`) - DBC/CSV parsing, types, stat calculations
- **Frontend:** Next.js 16, Panda CSS, Park UI, Intlayer (i18n)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Scheduler:** Rust (`crates/sentinel/`) - Discord bot, chunk scheduler, HTTP metrics
- **Package Manager:** pnpm (workspace monorepo)

## Layout

### Apps

- `apps/portal` - Next.js 16 web application

### Crates (Rust)

- `crates/centrifugo` - Centrifugo WebSocket beacon for realtime updates
- `crates/cli` - Command-line tools (wowlab-cli)
- `crates/common` - Shared types, parsers (DBC/CSV), and stat calculations
- `crates/engine` - Simulation engine with WASM target
- `crates/node` - Distributed simulation node (shared library)
- `crates/node-gui` - GUI for simulation nodes (egui)
- `crates/node-headless` - Headless simulation node for servers
- `crates/sentinel` - Task scheduler, Discord bot, HTTP metrics
- `crates/supabase` - Supabase client with PostgREST and Realtime

### Packages

- `packages/wowlab-engine` - WASM bindings for `crates/engine`
- `packages/wowlab-parsers` - WASM bindings for parsers
- `packages/wowlab-common` - WASM bindings for `crates/common` (packed as .tgz)

## First-Time Setup

```bash
# enable Corepack (ships with recent Node)
corepack enable

# activate the repo's pnpm version
corepack prepare pnpm@10.26.2 --activate

# install all workspace deps
pnpm install
```

## Everyday Commands

```bash
pnpm dev      # run portal dev server
pnpm build    # build everything (includes type checking)
pnpm cli      # run CLI tools
pnpm test     # run all tests
pnpm lint     # lint all packages
```

## Architecture

**Simulation engine (`crates/engine/`):**

- High-performance discrete-event simulation with batch processing
- JSON-based rotation DSL with variables, action lists, and conditions
- JIT compilation via Cranelift for rotation evaluation
- Parallel simulation support via rayon
- WASM build for browser integration

**Common (`crates/common/`):**

- DBC CSV parsing with serde structs
- Shared types for spells, talents, items, stats
- Stat calculations and rating conversions
- Compiles to both native and WASM

**Distributed compute (`crates/node*` + `crates/sentinel/`):**

- Nodes register and receive simulation chunks via Supabase Realtime
- Sentinel assigns chunks to eligible nodes with backlog-aware load balancing
- Access control via Discord guild membership (Bloom filters), explicit permissions, or public access

## CPU Requirements

Release binaries are compiled with optimized CPU instruction sets for better performance:

| Architecture | Target                           | Minimum CPU                                 |
| ------------ | -------------------------------- | ------------------------------------------- |
| x86-64       | `x86-64-v2`                      | Intel Nehalem (2008) / AMD Bulldozer (2011) |
| ARM64        | `+lse` (Large System Extensions) | ARMv8.1-A (2016)                            |

**What this means:**

- **x86-64-v2** enables SSE4.2, SSSE3, and POPCNT instructions. Any server or desktop CPU from the last ~15 years supports this.
- **ARM64 LSE** enables atomic operations that are significantly faster on multi-core ARM systems. All Apple Silicon and most ARM servers (AWS Graviton2+, Ampere Altra) support this.

These flags provide measurable performance gains for compute-intensive simulation workloads. If you need binaries for older hardware, open an issue and we can provide legacy builds.

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). See the LICENSE.md file for details.
