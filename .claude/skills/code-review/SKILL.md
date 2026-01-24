---
name: code-review
description: Review code for common issues and project conventions. Use when reviewing PRs, checking code quality, or before committing changes.
allowed-tools: Read, Grep, Glob
---

# Code Review

Read-only review skill for checking code quality against project conventions.

## Checklist

### Portal Components

- [ ] Pages are minimal (just render component)
- [ ] `loading.tsx` uses `*Skeleton` component
- [ ] `"use client"` only where needed
- [ ] Barrel exports in `index.ts`
- [ ] State lives in `lib/state/{domain}/` (not in hooks/)
- [ ] Uses `@/lib/format` utilities (not raw `.toLocaleString()` or manual formatting)
- [ ] Loading states use Flask components (not Loader2 from lucide)
- [ ] Styling uses Panda CSS (`css()`, `styled()`, layout components from `styled-system/jsx`)

### General

- [ ] No unused imports or variables
- [ ] No `console.log` in production code
- [ ] Error handling is comprehensive
- [ ] Types are explicit at module boundaries
- [ ] Control flow has braces (no single-line if/for)
- [ ] No backwards-compat shims or deprecated code
- [ ] No type casts (`as Type`) — use `satisfies` instead

## How to Use

1. I'll read the files you want reviewed
2. Check against the patterns above
3. Report issues with file:line references
4. Suggest fixes where applicable
