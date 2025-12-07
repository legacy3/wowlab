# Phase 7: Final Cleanup and Verification

## Prompt for Claude

```
I'm migrating to Refine. Phase 6 (remaining data) is complete.

**YOUR TASK**: Final cleanup, verify Jotai is only used for UI state, and confirm everything works.

## Step 1: Verify Jotai Usage

Check what Jotai atoms are still used:

grep -rn "from \"jotai\"\|from 'jotai'\|useAtom\|useAtomValue\|useSetAtom" apps/portal/src/ --include="*.tsx" --include="*.ts"

All remaining usages should be for UI state only:
- atoms/editor/ - Local editor state
- atoms/timeline/ - Timeline UI state
- atoms/charts/ - Chart UI state
- atoms/computing/ - Worker state
- atoms/ui/ - Ephemeral UI state
- atoms/workbench/ - Workbench state
- atoms/changelog/ - Changelog state
- atoms/debug/ - Debug state

If any Supabase data atoms are still used, migrate them in this phase.

## Step 2: Clean Up atoms/index.ts

Update apps/portal/src/atoms/index.ts to only export UI atoms:

// UI State Atoms - these use Jotai
export * from "./editor";
export * from "./timeline";
export * from "./charts";
export * from "./computing";
export * from "./ui";
export * from "./workbench";
export * from "./changelog";
export * from "./debug";
export * from "./data-inspector";
export * from "./user";        // settings-ui.ts only
export * from "./dps-rankings"; // UI filters + DB fetch
export * from "./drop-optimizer";
export * from "./top-gear";
export * from "./sim";         // config.ts only, not results

// NOTE: Supabase data is now fetched via Refine hooks
// - rotations: useList, useOne, useCreate, useUpdate
// - user_profiles: useList, useUpdate
// - user_settings: useOne, useUpdate (via useUserSettings hook)
// - rotation_sim_results: useList, useCreate
// - fight_profiles: useList (static data)
// - view_most_wanted_items: useList (materialized view)

## Step 3: Clean Up atoms/sim/index.ts

Update to only export config (not deleted results):

// Only export config, results are fetched via Refine
export * from "./config";

## Step 4: Verify No Orphaned Exports

Check that all exports in atoms/ still point to existing files:

# This should not error
pnpm build

If there are missing export errors, fix them.

## Step 5: Remove Unused Dependencies (Optional)

Check if any old dependencies are unused:

pnpm why jotai

If jotai is still used (for UI atoms), keep it.
If not used at all, you can remove it:
pnpm remove jotai jotai-devtools

## Step 6: Test All Pages

Manually test each page:

### Public Pages
- [ ] / (home) - loads correctly
- [ ] /rotations - list loads, cards display
- [ ] /rotations/[namespace]/[slug] - rotation detail loads
- [ ] /users/[handle] - profile loads, rotations display

### Auth Flow
- [ ] Login with Discord/GitHub works
- [ ] Logout works
- [ ] Session persists across page refresh
- [ ] User menu shows identity

### Protected Pages
- [ ] /account - loads when logged in
- [ ] /account - redirects when logged out
- [ ] /rotations/new - requires auth
- [ ] /rotations/editor - requires auth

### CRUD Operations
- [ ] Create new rotation
- [ ] Update rotation in editor
- [ ] Delete rotation (soft delete)
- [ ] Update profile settings
- [ ] Update user settings (theme, class, spec)

### Data Display
- [ ] Fight profiles load in simulation UI
- [ ] Most wanted items display
- [ ] Spec rankings display
- [ ] Top sims display
- [ ] Sim results show on rotation pages

## Step 7: Test Persistence

1. Load the app
2. Navigate to rotations list (wait for data to load)
3. Open DevTools > Application > IndexedDB
4. Verify "wowlab-refine-cache" store exists with data
5. Close the tab completely
6. Reopen the app
7. Verify rotations load from cache (check Network tab - should be cached)

## Step 8: Test Cache Invalidation

1. In the database, update the patch version comment or a rotation
2. Refresh the app
3. Verify new data loads (stale time check)

## Step 9: Final Build Check

pnpm build
pnpm lint

Fix any remaining errors or warnings.

## Step 10: Update Documentation

Update CLAUDE.md if the tech stack section needs changes:

Old:
| Data Layer | Jotai + Supabase |

New:
| Data Layer | Refine + @refinedev/supabase |
| UI State   | Jotai (editor, timeline, charts) |

Update any other docs that reference the old architecture.
```

## Expected Outcome

- Clean codebase with no dead code
- All pages working correctly
- Persistence working
- Build passing
- Jotai only for UI state
- Documentation updated

## Checklist

- [ ] Verify Jotai only used for UI atoms
- [ ] Update atoms/index.ts exports
- [ ] Update atoms/sim/index.ts exports
- [ ] Fix any orphaned exports
- [ ] Check/remove unused dependencies
- [ ] Test home page
- [ ] Test rotations list
- [ ] Test single rotation page
- [ ] Test user profile page
- [ ] Test auth flow (login/logout)
- [ ] Test account page
- [ ] Test create rotation
- [ ] Test update rotation
- [ ] Test delete rotation
- [ ] Test user settings
- [ ] Test IndexedDB persistence
- [ ] Test cache loads on refresh
- [ ] Run pnpm build (passes)
- [ ] Run pnpm lint (passes)
- [ ] Update CLAUDE.md
- [ ] Update any other documentation
