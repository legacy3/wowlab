---
title: Contributing
description: Dev setup for working on WoWLab
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

Copy [apps/portal/.env.example](https://github.com/legacy3/wowlab/blob/main/apps/portal/.env.example) to `.env.local`.

## Commands

```bash
pnpm build    # compile everything
pnpm dev      # run the portal locally
pnpm test     # run tests
pnpm lint     # check for lint errors
```

## Code style

We lean on [Effect-TS](https://effect.website/) for effectful code in the core packages. The portal uses [Refine](https://refine.dev/) for data fetching and routing. [Immutable.js](https://immutable-js.com/) handles the simulation state.

## Editing docs

Docs live in `apps/portal/src/content/`. Register new pages in `src/lib/docs/` (the relevant `section.*` module).
