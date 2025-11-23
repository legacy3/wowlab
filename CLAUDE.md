# CLAUDE.md

AI agent guidance for the WowLab repository.

## [!] CRITICAL: STOP WHEN YOU DON'T KNOW [!]

**IF YOU DON'T UNDERSTAND THE PROBLEM OR DON'T KNOW THE SOLUTION:**

1. **STOP IMMEDIATELY** - Do not continue trying random things
2. **ADMIT IT** - Say "I don't know" or "I don't understand this"
3. **EXPLAIN WHAT YOU TRIED** - Briefly summarize what you investigated
4. **ASK FOR HELP** - Ask the user for clarification or suggest they consult documentation

**NEVER:**

- String the user along with guesses
- Try random solutions hoping something works
- Make changes to configuration without understanding the root cause
- Waste the user's time and money with trial-and-error

**This is non-negotiable. Admitting you don't know is ALWAYS better than pretending you do.**

## [!] DOCUMENTATION REQUIREMENT [!]

**BEFORE MAKING ANY CHANGES TO EFFECT-TS CODE:**

1. **SEARCH THE EFFECT DOCS** - Use the Effect Docs MCP server to find relevant documentation
2. **QUOTE THE DOCS** - Provide a written quote from the official Effect documentation explaining why this change is correct
3. **EXPLAIN THE FIX** - Show how the documentation applies to the specific problem
4. **ONLY THEN MAKE THE CHANGE** - Never modify Effect code based on guesses or assumptions

**This applies to:**

- Service definitions and dependencies
- Layer composition and provision
- Type annotations and inference
- Error handling patterns
- Any Effect-specific APIs

**If the docs don't clearly explain the solution, STOP and ask the user.**

## MCP Servers

See `docs/MCP-SERVERS.md` for complete documentation. **ALWAYS use MCP servers for library documentation - never guess APIs.**

**Available servers:** Context7, Effect Docs, shadcn, Supabase, Next.js DevTools

## Project

TypeScript library for WoW spell rotation simulation using Effect-TS and Immutable.js. pnpm monorepo.

- `packages/*` - 7 internal packages (domain, services, schemas, rotation, bootstrap, spellbook, parsers)
- `apps/portal/` - Next.js 16 web app (Supabase, shadcn/ui, Jotai)
- `apps/cli/` - Effect-TS CLI tools
- `apps/proof-of-concept/` - Experimental features

## Commands

**[!] CRITICAL BUILD RULE [!]**

**ALWAYS:** `pnpm build` | `pnpm dev` | `pnpm test` | `pnpm lint`

**NEVER:** `pnpm typecheck` (included in build) | `pnpm --filter` (always wrong)

## Architecture

**Event-driven simulation:** Priority queue → Dequeue → Execute → Mutate GameState → Publish snapshot → Schedule events

**Module exports:** `@packages/lib-innocent` (all), `/domain` (entities), `/services` (services), `/rotation` (rotation API)

## Core Rules

**ALWAYS:**

- Effect combinators (Effect.gen, pipe, flatMap, map)
- Effect services with Layer composition
- Pure functional, immutable (Immutable.js Records)
- Barrel exports, clean code, remove dead code
- Use MCP servers for library docs

**NEVER:**

- Type casts (`as Effect.Effect<...>`)
- async/await, Promises, callbacks
- Modify library APIs for app convenience
- Backwards compatibility, deprecated code
- Write tests unless requested

## Effect Patterns

**Service:** Use `Effect.Service<MyService>()("MyService", { effect: Effect.gen(...) })`

**Error:** Use `Data.TaggedError("MyError")<{ readonly message: string }>`

**Context:** Access services via `yield* MyService` in Effect.gen

## Portal App (Next.js 16)

**Tech:** Next.js 16, shadcn/ui, TailwindCSS v4, Jotai

### Page Structure

- All pages MUST be server components (no `"use client"`)
- Client interactivity handled by separate components
- Use `PageLayout` wrapper on all pages
- Server components can do server-side operations (auth, data fetching)

### Component Naming

**Pattern:** `Feature` (export) → `FeatureInner` (implementation) → `FeatureSkeleton` (loading)

**Rules:**

- Client components encapsulate their own Suspense boundaries
- Consistent naming: `{Feature}`, `{Feature}Inner`, `{Feature}Skeleton`
- NEVER use `fallback={null}` - always show a skeleton
- Use `loading.tsx` for route-level loading states

**Examples:**

- `RotationDetail` → `RotationDetailInner` + `RotationDetailSkeleton`
- `UserMenu` → `UserMenuInner` + `UserMenuSkeleton`

### State Management (Jotai)

**Structure:** `atoms/domain/{feature}/state.ts`

**Rules:**

- ALWAYS use `useAtom()` (not `useAtomValue` or `loadable`)
- Wrap async atoms in `<Suspense>` boundary
- Organize atoms by domain in `atoms/` folder
- Use `atomWithRefresh` for refreshable async data
- Derived async atoms must await dependencies

## React Hooks

**@react-hookz/web** installed (57 production-ready hooks). See [docs](https://github.com/react-hookz/web) for full list.

Common: `useAsync`, `useToggle`, `useDebounce`, `useLocalStorageValue`, `useMediaQuery`, `useMeasure`

## Reference

- `docs/MCP-SERVERS.md` - MCP server documentation
- `README.md` - Setup and commands
- `docs/libs/EffectPatterns/` - 150+ Effect-TS patterns
- `docs/libs/TypeOnceSnippets/` - Effect-TS snippets
