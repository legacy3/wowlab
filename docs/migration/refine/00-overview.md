# Refine Migration Overview

## Goal

Replace Jotai-based state management with Refine for all Supabase CRUD operations. Keep Effect-TS for spell/item data (via TanStack Query).

## Phases

| Phase | Description                             | Files Changed           |
| ----- | --------------------------------------- | ----------------------- |
| 0.1   | Create required database tables         | Supabase migration      |
| 0.2   | Seed database with mock data            | Supabase + remove mocks |
| 0.3   | Delete unwanted code                    | ~40 files deleted       |
| 1     | Install deps, create base config        | 5 new files             |
| 2     | Create Refine providers                 | 4 new files             |
| 3     | Migrate auth                            | 3-5 files               |
| 4     | Migrate rotations CRUD                  | 5-10 files              |
| 5     | Migrate profiles, settings, sim results | 5-10 files              |
| 6     | Final cleanup and verification          | varies                  |

## Key Principles

1. **Database first** - Create tables and seed data before writing code
2. **Delete first** - Remove all Jotai atoms for Supabase data before adding Refine
3. **No backwards compatibility** - Don't keep old code around "just in case"
4. **One resource at a time** - Fully migrate rotations before moving to profiles
5. **Test as you go** - Each phase should leave the app in a working state

## Stack After Migration

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Framework  | Next.js 16 App Router                  |
| Data Layer | Refine + @refinedev/supabase           |
| Auth       | Refine authProvider + Supabase OAuth   |
| Caching    | TanStack Query + IndexedDB             |
| Spell Data | Effect-TS + TanStack Query (unchanged) |
| URL State  | nuqs                                   |
| Components | shadcn/ui                              |

## Database Tables

| Table                  | Purpose                               | Status        |
| ---------------------- | ------------------------------------- | ------------- |
| `user_profiles`        | Public profile (handle, avatar)       | EXISTS        |
| `user_settings`        | Private settings (class, spec, theme) | CREATE in 0.1 |
| `rotations`            | User rotation scripts                 | EXISTS        |
| `rotation_sim_results` | Simulation results                    | EXISTS        |
| `fight_profiles`       | Fight type configurations             | CREATE in 0.2 |

## Materialized Views

| View                   | Purpose                  | Status        |
| ---------------------- | ------------------------ | ------------- |
| `top_sims_daily`       | Top simulations by DPS   | EXISTS        |
| `spec_rankings_hourly` | Spec rankings by avg DPS | EXISTS        |
| `wanted_items`         | Top gear by DPS gain     | CREATE in 0.2 |

## Files to Delete (Phase 0.3)

```
apps/portal/src/atoms/supabase/        # All Supabase-related atoms
apps/portal/src/atoms/rotations/       # Replaced by Refine useList/useOne/etc
apps/portal/src/atoms/sim/results.ts   # Replaced by Refine
apps/portal/src/providers/jotai-provider.tsx
apps/portal/src/lib/auth/require-auth.ts
apps/portal/src/components/providers/auth-sync.tsx
```

## Files to Keep (migrate gradually)

```
apps/portal/src/atoms/editor/          # Local editor state (React state later)
apps/portal/src/atoms/timeline/        # UI state
apps/portal/src/atoms/charts/          # UI state
apps/portal/src/atoms/computing/       # Worker state
apps/portal/src/atoms/ui/              # Ephemeral UI state
```

## Mock Data to Migrate (Phase 0.2)

| Source File                                 | Data                             | Target Table           |
| ------------------------------------------- | -------------------------------- | ---------------------- |
| `atoms/dps-rankings/state.ts`               | `mostWantedItemsAtom` (10 items) | `wanted_items`         |
| `components/simulate/quick-sim-content.tsx` | `FIGHT_PROFILES` (3 profiles)    | `fight_profiles`       |
| Manual                                      | Sample rotations                 | `rotations`            |
| Manual                                      | Sample sim results               | `rotation_sim_results` |
