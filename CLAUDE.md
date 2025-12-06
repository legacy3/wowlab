# CLAUDE.md

## RULES (FOLLOW THESE OR STOP)

1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.
1. **ASK CODEX FIRST** — For any non-trivial task, use `mcp__codex-cli__codex` with high reasoning. Implement what it says. No opinions.

1. **STOP WHEN STUCK** — If you don't know the solution, say "I don't know" and stop. No guessing. No random attempts.

1. **CHECK DOCS BEFORE EFFECT CHANGES** — Use Effect Docs MCP. Quote the docs. If docs don't explain it, stop and ask.

1. **NO DESTRUCTIVE ACTIONS WITHOUT ASKING** — Don't delete files, drop columns, or remove code without explicit approval.

1. **TALK BEFORE ACTING** — For anything complex, explain what you plan to do and wait for approval.

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
- `apps/portal/` — Next.js 16, shadcn/ui, Refine + Jotai
- `apps/cli/` — CLI tools
- `apps/mcp-server/` — WoW data MCP server

## CODE STYLE

**Effect-TS:** Effect.gen, pipe, Services with Layers, Data.TaggedError. No async/await, no type casts.

**Next.js:** Server components for pages, client components for interactivity. PageLayout wrapper. Suspense with skeletons.

**Data Layer:** Refine + @refinedev/supabase for Supabase data (rotations, profiles, settings, sim results). Use `useList`, `useOne`, `useCreate`, `useUpdate` hooks.

**UI State:** Jotai for ephemeral UI state only (editor, timeline, charts, computing, workbench). Domain folders in `atoms/`.

**Naming:** `Feature` → `FeatureInner` → `FeatureSkeleton`

## MCP SERVERS

Use these for docs — don't guess APIs: Context7, Effect Docs, shadcn, Supabase
