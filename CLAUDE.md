# CLAUDE.md

## COMMANDS

```
pnpm build    # always use this
pnpm dev
pnpm test
pnpm lint
```

Never use `pnpm --filter` or `pnpm typecheck`.

## PROJECT STRUCTURE

- `packages/*` — Effect-TS simulation library
- `apps/portal/` — Next.js 16, shadcn/ui, Jotai
- `apps/cli/` — CLI tools
- `apps/mcp-server/` — WoW data MCP server

## CODE STYLE

**Effect-TS:** Effect.gen, pipe, Services with Layers, Data.TaggedError. No async/await, no type casts.

**Next.js:** Server components for pages, client components for interactivity. PageLayout wrapper. Suspense with skeletons.

**Jotai:** `useAtom()` only. Async atoms wrapped in Suspense. Domain folders in `atoms/`.

**Naming:** `Feature` → `FeatureInner` → `FeatureSkeleton`

## MCP SERVERS

Use these for docs — don't guess APIs: Context7, Effect Docs, shadcn, Supabase
