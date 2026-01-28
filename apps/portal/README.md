# Portal

WoW Lab web application built with Next.js 16, React 19, Panda CSS, and Park UI.

## Development

```bash
# from the repo root
pnpm dev
```

Runs at [http://localhost:3000](http://localhost:3000).

## Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Panda CSS with Park UI components
- **Data**: Supabase (auth, database, storage) + React Query
- **State**: Zustand for local state, React Query for server state
- **i18n**: Intlayer (English + German)
- **Content**: MDX via Velite (docs, blog)
- **Simulation**: WASM engine integration (`packages/wowlab-engine`)

## Environment

Copy `.env.example` to `.env.local` for Supabase credentials.
