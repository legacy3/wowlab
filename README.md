# WowLab

[![CI](https://github.com/legacy3/wowlab/actions/workflows/ci.yml/badge.svg)](https://github.com/legacy3/wowlab/actions/workflows/ci.yml)

A monorepo for World of Warcraft spell rotation simulation and analysis.

## Overview

WoW Lab provides a high-performance, event-driven simulation engine for analyzing WoW spell rotations and damage output. The simulation core is written in Rust (`crates/engine/`) with WASM bindings for browser use. Data parsing lives in `crates/parsers/` which compiles to both native and WASM.

**Tech Stack:**

- **Simulation Engine:** Rust (with WASM support for browser)
- **Parsers:** Rust (`crates/parsers/`) - DBC/CSV parsing, transformations, snapshots
- **Frontend:** Next.js 16, Panda CSS, Park UI, Intlayer (i18n)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Scheduler:** Rust (`crates/sentinel/`) - Discord bot, chunk scheduler, HTTP metrics
- **Package Manager:** pnpm (workspace monorepo)

## Layout

### Apps

- `apps/portal` - Next.js 16 web application

### Crates (Rust)

- `crates/api` - API service
- `crates/cli` - Command-line tools
- `crates/engine` - Simulation engine with WASM target
- `crates/parsers` - DBC/CSV data parsing, snapshot generation
- `crates/types` - Shared type definitions
- `crates/node` - Distributed simulation node (shared library)
- `crates/node-gui` - GUI for simulation nodes (egui)
- `crates/node-headless` - Headless simulation node for servers
- `crates/sentinel` - Task scheduler, Discord bot, HTTP metrics

### Packages

- `packages/wowlab-engine` - WASM bindings for `crates/engine`
- `packages/wowlab-parsers` - WASM bindings for `crates/parsers`

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

**Parsers (`crates/parsers/`):**

- DBC CSV parsing with serde structs
- Spell/talent/aura/item transformation
- Snapshot generation for efficient data access
- Compiles to both native and WASM

**Distributed compute (`crates/node*` + `crates/sentinel/`):**

- Nodes register and receive simulation chunks via Supabase Realtime
- Sentinel assigns chunks to eligible nodes with backlog-aware load balancing
- Access control via Discord guild membership (Bloom filters), explicit permissions, or public access

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). See the LICENSE.md file for details.
