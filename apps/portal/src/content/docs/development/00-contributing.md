---
title: Contributing
description: Dev setup for working on WoW Lab
updatedAt: 2025-12-17
---

# Contributing

Want to hack on WoW Lab? Here is how to get set up.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

Clone the repo and install deps:

```bash
git clone https://github.com/legacy3/wowlab.git
cd wowlab
pnpm install
```

## Environment

Copy [apps/portal/.env.example](/go/github/blob/main/apps/portal/.env.example) to `.env.local`.

## Commands

```bash
pnpm build    # compile everything
pnpm dev      # run the portal locally
pnpm test     # run tests
pnpm lint     # check for lint errors
```

## Code style

We lean on [Effect-TS](https://effect.website/) for effectful code in the core packages. The portal uses [Refine](https://refine.dev/) for data fetching and routing. The simulation engine is written in Rust (see `crates/engine/`) and compiled to WASM for type sharing and rotation validation in the portal. Actual simulations run on local nodes with JIT compilation.

## Editing docs

Docs live in `apps/portal/src/content/`. Register new pages in `src/lib/docs/` (the relevant `section.*` module).

## Questions

Got stuck or have ideas? Reach out on [Discord](/go/discord) or open an issue on [GitHub](/go/github/issues).
