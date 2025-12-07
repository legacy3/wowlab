# Data Fetching Audit - apps/portal

> Generated: 2025-12-07
> Purpose: Track migration from direct Supabase calls to Refine hooks

## Overview

The portal app is migrating to a **Refine-first architecture**:

- **Refine hooks** (`useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete`) for all Supabase data
- **Jotai atoms** for ephemeral UI state only (editor state, timeline, charts, computing)
- **Direct Supabase** only for auth/access control where Refine hooks aren't applicable

---

## Correctly Using Refine Hooks

| File                                                 | Hooks Used                                        | Resource(s)                                          |
| ---------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `hooks/use-changelog.ts`                             | `useList`                                         | `changelog`                                          |
| `hooks/use-most-wanted-items.ts`                     | `useList`                                         | `view_most_wanted_items`                             |
| `hooks/use-spec-rankings.ts`                         | `useList`                                         | `view_spec_rankings_hourly`                          |
| `hooks/use-top-sims.ts`                              | `useList`                                         | `view_top_sims_daily`                                |
| `hooks/use-user-settings.ts`                         | `useOne`, `useUpdate`                             | `user_settings`                                      |
| `hooks/use-sim-results.ts`                           | `useList`, `useCreate`                            | `rotation_sim_results`                               |
| `components/rotations/rotations-content.tsx`         | `useList`                                         | `rotations`                                          |
| `components/rotations/rotation-detail-page.tsx`      | `useList`, `useOne`                               | `rotations`, `user_profiles`, `rotation_sim_results` |
| `components/rotations/namespace-page.tsx`            | `useList`, `useGetIdentity`                       | `user_profiles`, `rotations`                         |
| `components/account/user-profile.tsx`                | `useOne`, `useGetIdentity`                        | `user_profiles`                                      |
| `components/account/cards/profile-settings-card.tsx` | `useUpdate`, `useGetIdentity`                     | `user_profiles`                                      |
| `app/account/page.tsx`                               | `useIsAuthenticated`, `useGetIdentity`, `useList` | `rotations`                                          |

---

## Legitimate Direct Supabase Usage

### Auth Provider (Required - Refine doesn't provide one)

Refine's `@refinedev/supabase` package only provides `dataProvider` and `liveProvider`.
**There is no built-in `authProvider`** - you must implement it yourself using Supabase Auth APIs.

This is the documented/expected pattern from Refine's official docs.

| File                          | Pattern                           | Reason                                                                  |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `lib/refine/auth-provider.ts` | `supabase.auth.signInWithOAuth()` | OAuth login - required                                                  |
| `lib/refine/auth-provider.ts` | `supabase.auth.signOut()`         | Logout - required                                                       |
| `lib/refine/auth-provider.ts` | `supabase.auth.getSession()`      | Session check - required                                                |
| `lib/refine/auth-provider.ts` | `supabase.auth.getUser()`         | Get current user - required                                             |
| `lib/refine/auth-provider.ts` | `.from("user_profiles").select()` | Fetch profile in `getIdentity` - acceptable (tightly coupled with auth) |

### Access Control Provider

| File                           | Pattern                               | Reason                                                                      |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------------------------- |
| `lib/refine/access-control.ts` | `.from("rotations").select("userId")` | Permission checks - acceptable (access control is separate from data layer) |

---

## PROBLEMS

### 1. Broken/Stub Implementations (Returns Empty Data)

| File                                        | Current State                      | Impact                                   |
| ------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| ~~`atoms/changelog/state.ts`~~              | ~~Returns `[]`~~                   | **FIXED** - Now uses `useChangelog` hook |
| `components/simulate/results-combos.tsx`    | Returns `[]`, has TODO comment     | Combos tab shows nothing                 |
| `components/simulate/results-equipment.tsx` | Returns placeholder data, has TODO | Equipment tab shows fake data            |
| `components/simulate/results-overview.tsx`  | Uses `useState` instead of atom    | Card order not persisted                 |

### 2. Direct Supabase Calls That Should Use Refine

These work but bypass Refine, creating inconsistency:

| File                                              | Current Pattern                                                            | Problem                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| ~~`atoms/dps-rankings/state.ts`~~                 | ~~`atomWithRefresh` + `createClient().from("view_spec_rankings_hourly")`~~ | **FIXED** - Now uses `useSpecRankings` hook |
| ~~`atoms/dps-rankings/state.ts`~~                 | ~~`atomWithRefresh` + `createClient().from("view_top_sims_daily")`~~       | **FIXED** - Now uses `useTopSims` hook      |
| `components/lab/data-inspector/query-context.tsx` | `createClient()` + Effect pipeline                                         | Entire query system bypasses Refine         |
| `lib/services/SupabaseDbcService.ts`              | `supabase.schema("raw_dbc").from(table)`                                   | Direct queries to raw_dbc schema            |

### 3. Incomplete Component Migrations

| File                                                     | TODO                                 |
| -------------------------------------------------------- | ------------------------------------ |
| ~~`components/account/user-profile.tsx`~~                | ~~"migrate to useOne"~~ **FIXED**    |
| ~~`components/account/cards/profile-settings-card.tsx`~~ | ~~Refine update mutation~~ **FIXED** |

---

## Migration Plan

### Priority 1: Fix Broken Features

- [x] `atoms/changelog/state.ts` → Create `useChangelog` hook with `useList` (**DONE**)
- [ ] `components/simulate/results-combos.tsx` → Implement with `useList`
- [ ] `components/simulate/results-equipment.tsx` → Implement with `useOne`
- [ ] `components/simulate/results-overview.tsx` → Restore Jotai atom for card order

### Priority 2: Migrate DPS Rankings

- [x] `atoms/dps-rankings/state.ts` → Replace `specRankingsAtom` with hook (**DONE**)
- [x] `atoms/dps-rankings/state.ts` → Replace `topSimCharactersAtom` with hook (**DONE**)
- [x] Update consuming components to use hooks instead of atoms (**DONE**)

### Priority 3: Data Inspector Decision

- [ ] Decide: Should data-inspector use Refine or keep Effect pipeline?
- [ ] If Refine: Create `useSpellData` and `useItemData` hooks
- [ ] If keep Effect: Document as intentional exception (raw DBC data)

### Priority 4: Complete Account Pages

- [x] `components/account/user-profile.tsx` → Migrate to `useOne` (**DONE**)
- [x] `components/account/cards/profile-settings-card.tsx` → Add `useUpdate` mutation (**DONE**)

---

## Architectural Decisions

### What Should Use Refine

- All user data (rotations, profiles, settings, sim results)
- All views (rankings, most wanted items)
- Any data that benefits from caching/invalidation

### What Can Stay Direct Supabase

- Auth provider operations (required by Supabase Auth)
- Access control checks (permission verification)

### What Needs Discussion

- `SupabaseDbcService` / Data Inspector: This queries raw WoW game data (DBC tables), not user data. Options:
  1. Keep as-is (Effect + direct Supabase) - it's read-only reference data
  2. Create Refine resources for DBC tables - adds consistency
  3. Move to server-side only - reduce client bundle

---

## Jotai Atoms Reference

### Atoms That Should NOT Fetch Data (UI State Only)

- `atoms/timeline/` - Generated combat data, computed atoms
- `atoms/editor/` - Editor UI state
- `atoms/computing/` - Computation state
- `atoms/workbench/` - Workbench UI state
- `atoms/top-gear/state.ts` - Card order (atomWithStorage)
- `atoms/data-inspector.ts` - Query state, card order (atomWithStorage)

### Atoms That Currently Fetch Data (Should Migrate)

- ~~`atoms/dps-rankings/state.ts`~~ - ~~`specRankingsAtom`, `topSimCharactersAtom`~~ **MIGRATED** to hooks
- ~~`atoms/changelog/state.ts`~~ - **MIGRATED** to `useChangelog` hook

---

## Notes

- No server actions or API routes exist in the portal
- No raw `fetch()` calls - all HTTP through Supabase client
- No SWR or React Query - Refine handles caching
