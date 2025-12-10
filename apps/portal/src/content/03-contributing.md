# Contributing

How to set up the development environment.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```bash
git clone https://github.com/legacy3/wowlab.git
cd wowlab
pnpm install
```

## Environment

Copy [apps/portal/.env.example](https://github.com/legacy3/wowlab/blob/main/apps/portal/.env.example) to `.env.local`.

## Commands

```bash
pnpm build    # Build all packages
pnpm dev      # Run portal dev server
pnpm test     # Run tests
pnpm lint     # Lint
```

## Code style

- Effect-TS for effectful code
- Immutable.js for state
- No async/await, no type casts

## Editing docs

Docs are markdown in `apps/portal/src/content/`. Add new docs to `src/lib/docs.ts`.
