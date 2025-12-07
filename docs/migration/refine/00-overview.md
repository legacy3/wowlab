# Refine Migration Overview

## Goal

Replace Jotai-based state management with Refine for all Supabase CRUD operations. Keep Effect-TS for spell/item data (via TanStack Query). Keep Jotai for local UI state (editor, timeline, charts, etc.).

## Phase Order

> **Important**: Phases are reordered so the app stays functional after each phase.

| Phase | Description                             | Files Changed      |
| ----- | --------------------------------------- | ------------------ |
| 0.1   | Create required database tables         | Supabase migration |
| 0.2   | Seed database with mock data            | Supabase only      |
| 1     | Install deps, create base config        | 5 new files        |
| 2     | Create Refine providers                 | 4 new files        |
| 3     | Delete Supabase atoms (not UI atoms)    | ~15 files deleted  |
| 4     | Migrate auth                            | 3-5 files          |
| 5     | Migrate rotations CRUD                  | 5-10 files         |
| 6     | Migrate profiles, settings, sim results | 5-10 files         |
| 7     | Final cleanup and verification          | varies             |

## Key Principles

1. **Database first** - Create tables and seed data before writing code
2. **Providers before deletion** - Set up Refine BEFORE deleting Jotai atoms
3. **Keep UI atoms** - JotaiProvider stays for editor/timeline/charts until Phase 7
4. **No backwards compatibility** - Don't keep old code around "just in case"
5. **One resource at a time** - Fully migrate rotations before moving to profiles
6. **Test as you go** - Each phase should leave the app in a working state

## Column Naming Convention

> **Critical**: The database uses **camelCase** column names, not snake_case.

| Correct (DB) | Wrong (don't use) |
| ------------ | ----------------- |
| `userId`     | `user_id`         |
| `deletedAt`  | `deleted_at`      |
| `rotationId` | `rotation_id`     |
| `createdAt`  | `created_at`      |
| `updatedAt`  | `updated_at`      |
| `meanDps`    | `mean_dps`        |

All Refine filters and selects must use camelCase to match the database.

## Stack After Migration

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Framework  | Next.js 16 App Router                  |
| Data Layer | Refine + @refinedev/supabase           |
| Auth       | Refine authProvider + Supabase OAuth   |
| Caching    | TanStack Query (shared) + IndexedDB    |
| Spell Data | Effect-TS + TanStack Query (unchanged) |
| UI State   | Jotai (editor, timeline, charts)       |
| URL State  | nuqs                                   |
| Components | shadcn/ui                              |

## TanStack Query Strategy

Effect-TS data already uses TanStack Query. We will **share a single QueryClient** between Effect-TS and Refine to avoid duplicate caches and conflicting stale times.

The existing QueryClient will be:

1. Extended with IndexedDB persistence for Refine data
2. Passed to Refine's `options.reactQuery.clientConfig`

## Database Tables

| Table                  | Purpose                            | Status        |
| ---------------------- | ---------------------------------- | ------------- |
| `user_profiles`        | Public profile (handle, avatar)    | EXISTS        |
| `user_settings`        | Private settings (theme, UI prefs) | CREATE in 0.1 |
| `rotations`            | User rotation scripts              | EXISTS        |
| `rotation_sim_results` | Simulation results                 | EXISTS        |
| `fight_profiles`       | Fight type configurations          | CREATE in 0.2 |

## Materialized Views

| View                        | Purpose                  | Status        |
| --------------------------- | ------------------------ | ------------- |
| `view_top_sims_daily`       | Top simulations by DPS   | EXISTS        |
| `view_spec_rankings_hourly` | Spec rankings by avg DPS | EXISTS        |
| `view_most_wanted_items`    | Top gear by DPS gain     | CREATE in 0.2 |

## Files to Delete (Phase 3)

Only delete Supabase data atoms. Keep UI atoms.

```
# DELETE these (Supabase data)
apps/portal/src/atoms/supabase/        # All Supabase-related atoms
apps/portal/src/atoms/rotations/       # Replaced by Refine useList/useOne/etc
apps/portal/src/atoms/sim/results.ts   # Replaced by Refine
apps/portal/src/atoms/sim/results-ui.ts
apps/portal/src/lib/auth/require-auth.ts
apps/portal/src/components/providers/auth-sync.tsx
```

## Files to Keep (UI state - stays as Jotai)

```
# KEEP these (UI state, NOT Supabase data)
apps/portal/src/atoms/editor/          # Local editor state
apps/portal/src/atoms/timeline/        # UI state
apps/portal/src/atoms/charts/          # UI state
apps/portal/src/atoms/computing/       # Worker state
apps/portal/src/atoms/ui/              # Ephemeral UI state
apps/portal/src/atoms/workbench/       # Workbench state
apps/portal/src/atoms/changelog/       # UI state
apps/portal/src/atoms/debug/           # Debug state
apps/portal/src/atoms/data-inspector.ts
apps/portal/src/atoms/user/settings-ui.ts  # UI only, not DB settings
apps/portal/src/atoms/dps-rankings/    # Keep but remove hardcoded data
apps/portal/src/atoms/drop-optimizer/  # UI state
apps/portal/src/atoms/top-gear/        # UI state
apps/portal/src/providers/jotai-provider.tsx  # KEEP until Phase 7
```

## Jotai Atom → Refine Hook Mapping

| Jotai Atom                       | Refine Replacement                                       |
| -------------------------------- | -------------------------------------------------------- |
| `rotationAtomFamily(slug)`       | `useList({ filters: [namespace, slug] })`                |
| `profileByHandleAtomFamily`      | `useList({ filters: [handle] })`                         |
| `rotationsByNamespaceAtomFamily` | `useList({ filters: [namespace] })`                      |
| `myRotationsAtom`                | `useList({ filters: [userId: identity.id] })`            |
| `saveRotationAtom`               | `useCreate()`                                            |
| `updateRotationAtom`             | `useUpdate()`                                            |
| `deleteRotationAtom`             | `useUpdate({ deletedAt: now() })` (soft delete)          |
| `browseRotationsAtom`            | `useList({ filters: [public, approved, not deleted] })`  |
| `searchRotationsAtomFamily`      | `useList({ filters: [class, spec] })`                    |
| `rotationSimResultsAtomFamily`   | `useList({ resource: "rotation_sim_results", filters })` |
| `parentRotationAtomFamily`       | `useOne({ id: parentId })`                               |
| `forkRotationsAtomFamily`        | `useList({ filters: [parentId] })`                       |
| `currentUserAtom`                | `useGetIdentity()`                                       |
| `sessionAtom`                    | `useIsAuthenticated()`                                   |
| `specRankingsAtom`               | Keep as-is (reads from materialized view)                |
| `topSimCharactersAtom`           | Keep as-is (reads from materialized view)                |
| `mostWantedItemsAtom`            | Convert to fetch from `view_most_wanted_items` view      |
