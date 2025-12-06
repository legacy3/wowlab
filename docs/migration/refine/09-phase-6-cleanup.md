# Phase 6: Final Cleanup and Verification

## Prompt for Claude

```
I'm migrating to Refine. Phase 5 (remaining data) is complete.

**YOUR TASK**: Final cleanup, remove unused code, and verify everything works.

## Step 1: Remove Jotai (if no longer needed)

Check if any atoms are still used:

grep -r "from \"jotai\"" apps/portal/src/
grep -r "from 'jotai'" apps/portal/src/
grep -r "useAtom" apps/portal/src/

If there are NO remaining usages:
pnpm remove jotai jotai-devtools (in apps/portal)

If there ARE remaining usages, they should only be for local UI state (editor, timeline, etc.). These are fine to keep for now and can be migrated to React state later.

## Step 2: Clean Up atoms/ Directory

After the migration, the atoms/ directory should only contain:
- atoms/editor/ - Local editor state
- atoms/timeline/ - Timeline UI state
- atoms/charts/ - Chart UI state
- atoms/computing/ - Worker state
- atoms/ui/ - Ephemeral UI state
- atoms/workbench/ - Workbench state
- atoms/changelog/ - Changelog state
- atoms/debug/ - Debug state
- atoms/data-inspector.ts - Data inspector
- atoms/user/settings-ui.ts - Settings UI only
- atoms/dps-rankings/ - Rankings UI
- atoms/drop-optimizer/ - Optimizer UI
- atoms/top-gear/ - Top gear UI

Delete any remaining Supabase-related atoms that weren't caught earlier.

## Step 3: Clean Up Unused Imports

Look for and remove:
- Unused imports from deleted files
- Empty index.ts files
- Orphaned type definitions

## Step 4: Verify All Pages Work

Test each page:
- [ ] / (home)
- [ ] /rotations
- [ ] /rotations/[namespace]/[slug]
- [ ] /rotations/new
- [ ] /rotations/editor
- [ ] /users/[handle]
- [ ] /account
- [ ] Auth flow (login/logout)

## Step 5: Verify Persistence Works

1. Load the app
2. Navigate to rotations list
3. Close the tab
4. Reopen the app
5. Check that data loads from IndexedDB cache

## Step 6: Update atoms/index.ts

The main atoms index should only export UI-related atoms:

export * from "./editor";
export * from "./timeline";
export * from "./charts";
export * from "./computing";
export * from "./ui";
export * from "./workbench";
export * from "./changelog";
export * from "./debug";
export * from "./data-inspector";
export * from "./user/settings-ui";
export * from "./dps-rankings";
export * from "./drop-optimizer";
export * from "./top-gear";

// Remove any exports for deleted atoms

## Step 7: Final Build Check

pnpm build
pnpm lint

Fix any remaining errors.

## Step 8: Documentation

Update any documentation that references the old patterns:
- README.md
- CLAUDE.md (update stack info if needed)
- Any architecture docs
```

## Expected Outcome

- Clean codebase with no dead code
- All pages working correctly
- Persistence working
- Build passing
- No Jotai for Supabase data

## Checklist

- [ ] Check for remaining Jotai usages
- [ ] Remove jotai package if unused
- [ ] Clean up atoms/ directory
- [ ] Remove unused imports
- [ ] Test all pages
- [ ] Test persistence
- [ ] Update atoms/index.ts exports
- [ ] Run pnpm build
- [ ] Run pnpm lint
- [ ] Update documentation
