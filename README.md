# WowLab

[![CI](https://github.com/legacy3/wowlab/actions/workflows/ci.yml/badge.svg)](https://github.com/legacy3/wowlab/actions/workflows/ci.yml)

A TypeScript monorepo for World of Warcraft spell rotation simulation and analysis, built with Effect-TS and functional programming principles.

## Overview

WowLab provides a pure functional, event-driven simulation engine for analyzing WoW spell rotations and damage output. The architecture uses Effect-TS for composable services, Immutable.js for immutable state management, and a priority queue-based event scheduler for accurate combat simulation.

**Tech Stack:**

- **Runtime:** Effect-TS (functional effect system)
- **State:** Immutable.js Records
- **Frontend:** Next.js 16, shadcn/ui, TailwindCSS v4, Jotai
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Package Manager:** pnpm (workspace monorepo)

## Layout

### Apps

- `apps/portal` - Next.js 16 web application (Supabase, shadcn/ui)
- `apps/cli` - Effect-TS CLI tools for game data management
- `apps/mcp-server` - MCP server for querying WoW spell and item data (`@wowlab/mcp-server` on npm)
- `apps/standalone` - Standalone Node.js app for testing simulation

### Packages

- `packages/wowlab-core` - Core entities, schemas, branded types (Immutable.js Records)
- `packages/wowlab-services` - Effect services (state, spell, lifecycle)
- `packages/wowlab-rotation` - Rotation context & actions API
- `packages/wowlab-runtime` - Effect Layer composition and runtime

## First-Time Setup

```bash
# enable Corepack (ships with recent Node)
corepack enable

# activate the repo's pnpm version
corepack prepare pnpm@10.22.0 --activate

# install all workspace deps
pnpm install
```

> Tip: `pnpm store path` shows where the shared package cache lives if you ever need to inspect or clean it.

## Everyday Commands

```bash
pnpm dev      # run portal dev server
pnpm build    # build everything (includes type checking)
pnpm cli      # run CLI tools
pnpm test     # run all tests
pnpm lint     # lint all packages
```

### Quick pnpm vs npm TL;DR

- `pnpm install` replaces `npm install` (never run npm/yarn here anymore).
- `pnpm <script>` is the same as `npm run <script>` - you can drop the `run`.
- `pnpm store` commands manage the shared cache (`pnpm store prune`, etc.).

If someone forgets and runs `npm install`, blow away `node_modules` and rerun `pnpm install` to restore the workspace layout.

## Architecture

**Event-driven simulation:** Priority queue (binary heap) → Dequeue → Execute → Mutate GameState → Publish snapshot → Schedule events

**Core packages:**

- `@wowlab/core` - Immutable.js entities, schemas, branded types
- `@wowlab/services` - Effect services (state, spell, lifecycle, simulation)
- `@wowlab/rotation` - Rotation context & actions API
- `@wowlab/runtime` - Effect Layer composition

## MCP Server

WowLab includes an MCP server for querying WoW spell and item data. Install it via npm:

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

### Additional MCP Servers (Optional)

For AI-assisted development with Claude Code, these MCP servers are also useful:

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  },
  "effect-docs": {
    "command": "npx",
    "args": ["-y", "effect-mcp@latest"]
  },
  "shadcn": {
    "command": "npx",
    "args": ["shadcn@latest", "mcp"]
  }
}
```

## Contributing

Contributions are welcome! Please read `CLAUDE.md` for development guidelines and architectural patterns.

**Key principles:**

- Pure functional programming (Effect-TS)
- Immutable state (Immutable.js Records)
- No type casts, async/await, or imperative code
- Use MCP servers for library documentation

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). See the LICENSE.md file for details.
