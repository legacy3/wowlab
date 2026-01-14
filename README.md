# WowLab

[![CI](https://github.com/legacy3/wowlab/actions/workflows/ci.yml/badge.svg)](https://github.com/legacy3/wowlab/actions/workflows/ci.yml)

A monorepo for World of Warcraft spell rotation simulation and analysis.

## Overview

WoW Lab provides a high-performance, event-driven simulation engine for analyzing WoW spell rotations and damage output. The simulation core is written in Rust (`crates/engine/`) with WASM bindings for browser use. Game data logic lives in `crates/gamedata/` which compiles to both native Rust and WASM.

**Tech Stack:**

- **Simulation Engine:** Rust (with WASM support for browser)
- **Game Data:** Rust (`crates/gamedata/`) - CSV parsing, transformations, snapshots
- **Frontend:** Next.js 16, Panda CSS, Park UI
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Package Manager:** pnpm (workspace monorepo)

## Layout

### Apps

- `apps/portal` - Next.js 16 web application
- `apps/mcp-server` - MCP server for querying WoW spell and item data (`@wowlab/mcp-server` on npm)
- `apps/standalone` - Standalone simulation runner

### Crates (Rust)

- `crates/engine` - Rust simulation engine with CLI and WASM targets
- `crates/gamedata` - Game data handling (DBC parsing, snapshots, talent decoding, CLI)
- `crates/node` - Distributed simulation node
- `crates/node-gui` - GUI for simulation nodes (egui)
- `crates/node-headless` - Headless simulation node for servers

### Packages

- `packages/wowlab` - WASM wrapper for `crates/gamedata`

## First-Time Setup

```bash
# enable Corepack (ships with recent Node)
corepack enable

# activate the repo's pnpm version
corepack prepare pnpm@10.22.0 --activate

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

**Rust simulation engine (`crates/engine/`):**

- High-performance event-driven core with timing wheel scheduler
- JSON-based rotation DSL
- Parallel simulation support via rayon
- WASM build for browser integration

**Rust game data (`crates/gamedata/`):**

- DBC CSV parsing with serde structs
- Spell/talent/aura/item transformation
- Snapshot generation for efficient data access
- Talent string decoding
- Compiles to both native and WASM

## MCP Server

WoW Lab includes an MCP server for querying WoW spell and item data. Install it via npm:

```bash
npx @wowlab/mcp-server
```

Or configure it in your Claude Code settings:

```json
{
  "wowlab": {
    "command": "npx",
    "args": ["-y", "@wowlab/mcp-server"]
  }
}
```

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). See the LICENSE.md file for details.
