# Phase 3: Delete Supabase Atoms (Not UI Atoms)

## Prompt for Claude

```
I'm migrating to Refine. Phase 2 (providers) is complete. Refine is now set up and working.

**YOUR TASK**: Delete ONLY the Supabase data atoms. Keep all UI atoms and JotaiProvider.

## Critical: What to Delete vs Keep

### DELETE these files (Supabase data - replaced by Refine):

apps/portal/src/atoms/supabase/auth.ts
apps/portal/src/atoms/supabase/actions.ts
apps/portal/src/atoms/supabase/connection.ts
apps/portal/src/atoms/supabase/client.ts
apps/portal/src/atoms/supabase/profile.ts
apps/portal/src/atoms/supabase/index.ts
apps/portal/src/atoms/rotations/state.ts
apps/portal/src/atoms/rotations/index.ts
apps/portal/src/atoms/sim/results.ts
apps/portal/src/atoms/sim/results-ui.ts (only if it depends on results.ts)
apps/portal/src/lib/auth/require-auth.ts
apps/portal/src/components/providers/auth-sync.tsx

### KEEP these files (UI state - NOT Supabase data):

apps/portal/src/atoms/editor/*
apps/portal/src/atoms/timeline/*
apps/portal/src/atoms/charts/*
apps/portal/src/atoms/computing/*
apps/portal/src/atoms/ui/*
apps/portal/src/atoms/workbench/*
apps/portal/src/atoms/changelog/*
apps/portal/src/atoms/debug/*
apps/portal/src/atoms/data-inspector.ts
apps/portal/src/atoms/user/settings-ui.ts
apps/portal/src/atoms/dps-rankings/*
apps/portal/src/atoms/drop-optimizer/*
apps/portal/src/atoms/top-gear/*
apps/portal/src/atoms/sim/config.ts (if it's UI config, not DB data)
apps/portal/src/atoms/sim/index.ts (update exports)
apps/portal/src/providers/jotai-provider.tsx  <-- KEEP THIS!

## Step 1: Delete Supabase Atoms Directory

rm -rf apps/portal/src/atoms/supabase/

## Step 2: Delete Rotations Atoms Directory

rm -rf apps/portal/src/atoms/rotations/

## Step 3: Delete Sim Results Files

rm apps/portal/src/atoms/sim/results.ts
rm apps/portal/src/atoms/sim/results-ui.ts

Update apps/portal/src/atoms/sim/index.ts to only export remaining files:

// Remove exports for deleted files
export * from "./config";
// export * from "./results";      // DELETED
// export * from "./results-ui";   // DELETED

## Step 4: Delete Old Auth Files

rm apps/portal/src/lib/auth/require-auth.ts
rm apps/portal/src/components/providers/auth-sync.tsx

If apps/portal/src/lib/auth/index.ts exists and is now empty, delete it too.

## Step 5: Fix Broken Imports

After deletion, run:

pnpm build

This will show import errors. For each error:

1. If a component imports a deleted atom, COMMENT OUT the import and the code using it:

   // TODO: Replace with Refine hook in Phase 4/5
   // import { rotationAtomFamily } from "@/atoms/rotations";
   // const rotation = useAtomValue(rotationAtomFamily(slug));

2. If a component imports from @/atoms/supabase, comment out the import and usage

3. Do NOT create stubs or re-export deleted code

## Step 6: Update atoms/index.ts

Update apps/portal/src/atoms/index.ts to remove exports for deleted directories:

// UI atoms - KEEP
export * from "./editor";
export * from "./timeline";
export * from "./charts";
export * from "./computing";
export * from "./ui";
export * from "./workbench";
export * from "./changelog";
export * from "./debug";
export * from "./data-inspector";
export * from "./user";
export * from "./dps-rankings";
export * from "./drop-optimizer";
export * from "./top-gear";
export * from "./sim";

// DELETED - remove these exports
// export * from "./supabase";
// export * from "./rotations";

## Step 7: Document Broken Components

After fixing imports, run pnpm build again.

Create a list of components that are commented out / broken for Phase 4 and 5:

Example list format:
- apps/portal/src/app/rotations/page.tsx - needs useList for rotations
- apps/portal/src/app/rotations/[namespace]/[slug]/page.tsx - needs rotation data
- apps/portal/src/components/auth/login-button.tsx - needs useLogin
- etc.

## Verify

Run pnpm build - it should pass (with commented-out functionality).
The app should load but some features won't work yet.
```

## Expected Outcome

- All Supabase data atoms deleted
- UI atoms and JotaiProvider preserved
- Broken imports commented out with TODO notes
- List of components to fix in Phase 4/5
- Build passes

## Checklist

- [x] Delete apps/portal/src/atoms/supabase/ directory
- [x] Delete apps/portal/src/atoms/rotations/ directory
- [x] Delete apps/portal/src/atoms/sim/results.ts
- [x] Delete apps/portal/src/atoms/sim/results-ui.ts
- [x] Update apps/portal/src/atoms/sim/index.ts
- [x] Delete apps/portal/src/lib/auth/require-auth.ts
- [x] Delete apps/portal/src/components/providers/auth-sync.tsx
- [x] Update apps/portal/src/atoms/index.ts
- [x] Comment out broken imports (with TODO notes)
- [x] Keep JotaiProvider in layout
- [x] Run pnpm build (should pass)
- [x] Document list of broken components for next phases

## Components with Placeholder Data for Phase 4/5

The following components have been updated with placeholder data and TODO(refine-migration) comments. They build and render but lack real data until Refine hooks are implemented:

### Auth Components (now using Refine hooks - DONE)

- `apps/portal/src/components/layout/auth-button.tsx` - uses `useIsAuthenticated`
- `apps/portal/src/components/layout/user-menu.tsx` - uses `useGetIdentity`, `useLogout`
- `apps/portal/src/components/auth/sign-in-content.tsx` - uses `useIsAuthenticated`
- `apps/portal/src/components/auth/sign-in-form.tsx` - uses `useLogin`
- `apps/portal/src/components/auth/sign-out-button.tsx` - uses `useLogout`

### Rotations Components (need `useList`, `useOne` for rotations resource)

- `apps/portal/src/components/rotations/rotations-content.tsx` - needs `useList({ resource: "rotations" })`
- `apps/portal/src/components/rotations/rotation-detail-page.tsx` - needs `useOne({ resource: "rotations" })` + profiles + sim results + forks
- `apps/portal/src/components/rotations/namespace-page.tsx` - needs `useOne({ resource: "user_profiles" })` + `useList({ resource: "rotations" })`

### Account Components (need user profile + rotations data)

- `apps/portal/src/app/account/page.tsx` - needs auth + user profile + user rotations
- `apps/portal/src/app/account/settings/page.tsx` - server-side auth removed
- `apps/portal/src/components/account/user-profile.tsx` - needs profile data
- `apps/portal/src/components/account/cards/profile-settings-card.tsx` - uses `useGetIdentity`

### Simulation Results Components (need sim results data)

- `apps/portal/src/components/simulate/results-equipment.tsx` - needs character + gear + slot alternatives
- `apps/portal/src/components/simulate/results-overview.tsx` - needs card order state
- `apps/portal/src/components/simulate/results-combos.tsx` - needs combos data
- `apps/portal/src/components/simulate/cards/character-equipment-card.tsx` - needs character + professions + item combos
- `apps/portal/src/components/simulate/cards/avg-gain-card.tsx` - needs item combos data
- `apps/portal/src/components/simulate/cards/baseline-dps-card.tsx` - needs baseline DPS data
- `apps/portal/src/components/simulate/cards/best-dps-card.tsx` - needs best combo data
- `apps/portal/src/components/simulate/cards/combos-analyzed-card.tsx` - needs combos count

### Other

- `apps/portal/src/atoms/changelog/state.ts` - `changelogEntriesAtom` returns empty array
- `apps/portal/src/lib/auth/index.ts` - exports commented out
- `apps/portal/src/app/layout.tsx` - AuthSync component removed
