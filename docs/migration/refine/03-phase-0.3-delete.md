# Phase 0: Delete Unwanted Code

## Prompt for Claude

```
I'm migrating from Jotai to Refine for Supabase data management.

**YOUR TASK**: Delete ALL the files listed below. Do not keep any backwards compatibility code. Do not rename variables to `_unused`. Just delete.

After deleting, fix any import errors by removing the imports (not by creating stubs).

## Files to Delete

### Supabase Atoms (all of these)
- apps/portal/src/atoms/supabase/auth.ts
- apps/portal/src/atoms/supabase/actions.ts
- apps/portal/src/atoms/supabase/connection.ts
- apps/portal/src/atoms/supabase/client.ts
- apps/portal/src/atoms/supabase/profile.ts
- apps/portal/src/atoms/supabase/index.ts

### Rotations Atoms (replaced by Refine)
- apps/portal/src/atoms/rotations/state.ts
- apps/portal/src/atoms/rotations/index.ts

### Sim Results Atoms (replaced by Refine)
- apps/portal/src/atoms/sim/results.ts
- apps/portal/src/atoms/sim/results-ui.ts (if it only depends on results.ts)

### Old Auth
- apps/portal/src/lib/auth/require-auth.ts
- apps/portal/src/lib/auth/index.ts (if empty after)
- apps/portal/src/components/providers/auth-sync.tsx

### Jotai Provider
- apps/portal/src/providers/jotai-provider.tsx

## After Deletion

1. Remove JotaiProvider from the app layout
2. Remove any imports of deleted atoms
3. Comment out (don't delete) components that break - we'll fix them in later phases
4. Run `pnpm build` to find remaining errors
5. List all files that still have errors for the next phase

## Do NOT Delete

These atoms are for local UI state and will be migrated to React state later:
- atoms/editor/
- atoms/timeline/
- atoms/charts/
- atoms/computing/
- atoms/ui/
- atoms/workbench/
- atoms/changelog/
- atoms/debug/
- atoms/data-inspector.ts
- atoms/user/settings-ui.ts
- atoms/dps-rankings/
- atoms/drop-optimizer/
- atoms/top-gear/
```

## Expected Outcome

- All Supabase-related Jotai atoms are gone
- JotaiProvider is removed from layout
- AuthSync component is deleted
- Build may have errors from components using deleted atoms - that's expected
- A list of broken files ready for Phase 1

## Checklist

- [ ] Delete apps/portal/src/atoms/supabase/ directory
- [ ] Delete apps/portal/src/atoms/rotations/ directory
- [ ] Delete apps/portal/src/atoms/sim/results.ts
- [ ] Delete apps/portal/src/atoms/sim/results-ui.ts
- [ ] Delete apps/portal/src/lib/auth/require-auth.ts
- [ ] Delete apps/portal/src/components/providers/auth-sync.tsx
- [ ] Delete apps/portal/src/providers/jotai-provider.tsx
- [ ] Remove JotaiProvider from app layout
- [ ] Remove all imports of deleted files
- [ ] Run pnpm build and document errors
