# Refine Migration TODO

Master checklist for the entire migration. Check items off as you complete each phase.

## Phase 0.1: Create Database Tables

- [ ] Create `user_settings` table
- [ ] Enable RLS on `user_settings`
- [ ] Create SELECT policy (own settings)
- [ ] Create INSERT policy (own settings)
- [ ] Create UPDATE policy (own settings)
- [ ] Create/verify `update_updated_at_column()` trigger function
- [ ] Create updated_at trigger on `user_settings`
- [ ] Verify table in list_tables
- [ ] Verify RLS is enabled

## Phase 0.2: Seed Database with Mock Data

- [ ] Create `fight_profiles` table
- [ ] Insert fight profile data (patchwerk, movement, aoe)
- [ ] Enable RLS on `fight_profiles` with public read policy
- [ ] Create `wanted_items` materialized view
- [ ] Create indexes on `wanted_items` (rank, slot)
- [ ] Insert sample rotations (3 rotations)
- [ ] Insert sample sim results
- [ ] Refresh `top_sims_daily` materialized view
- [ ] Refresh `spec_rankings_hourly` materialized view
- [ ] Verify data in tables/views
- [ ] Update `atoms/dps-rankings/state.ts` to fetch from DB
- [ ] Update `quick-sim-content.tsx` to fetch fight profiles from DB
- [ ] Run `pnpm build`

## Phase 0.3: Delete Unwanted Code

- [ ] Delete `apps/portal/src/atoms/supabase/` directory
- [ ] Delete `apps/portal/src/atoms/rotations/` directory
- [ ] Delete `apps/portal/src/atoms/sim/results.ts`
- [ ] Delete `apps/portal/src/atoms/sim/results-ui.ts`
- [ ] Delete `apps/portal/src/lib/auth/require-auth.ts`
- [ ] Delete `apps/portal/src/lib/auth/index.ts` (if empty)
- [ ] Delete `apps/portal/src/components/providers/auth-sync.tsx`
- [ ] Delete `apps/portal/src/providers/jotai-provider.tsx`
- [ ] Remove JotaiProvider from app layout
- [ ] Remove all imports of deleted files
- [ ] Run `pnpm build` and note errors

## Phase 1: Install Dependencies

- [ ] `pnpm add @refinedev/core @refinedev/supabase @refinedev/nextjs-router`
- [ ] `pnpm add @tanstack/react-query-persist-client idb-keyval`
- [ ] Create `lib/config/game.ts`
- [ ] Create `lib/refine/persister.ts`
- [ ] Create `lib/refine/data-provider.ts` (placeholder)
- [ ] Create `lib/refine/auth-provider.ts` (placeholder)
- [ ] Create `lib/refine/access-control.ts` (placeholder)
- [ ] Create `lib/refine/index.ts`
- [ ] Run `pnpm build`

## Phase 2: Create Refine Providers

- [ ] Implement `lib/refine/data-provider.ts`
- [ ] Implement `lib/refine/auth-provider.ts`
- [ ] Implement `lib/refine/access-control.ts`
- [ ] Create `providers/refine-provider.tsx`
- [ ] Update `lib/refine/index.ts` exports
- [ ] Add RefineProvider to app layout
- [ ] Run `pnpm build`
- [ ] Verify app loads in browser

## Phase 3: Migrate Auth

- [ ] Find all files using old auth patterns
- [ ] Update sign-in to use `useLogin()`
- [ ] Update sign-out to use `useLogout()`
- [ ] Update auth checks to use `useIsAuthenticated()`
- [ ] Update identity access to use `useGetIdentity()`
- [ ] Update account page
- [ ] Verify OAuth callback works
- [ ] Run `pnpm build`
- [ ] Test login flow manually
- [ ] Test logout flow manually
- [ ] Test protected page redirect

## Phase 4: Migrate Rotations

- [ ] Find all files using rotation atoms
- [ ] Update rotations list page (`useList`)
- [ ] Update single rotation page (`useList` with filters)
- [ ] Update create rotation page (`useCreate`)
- [ ] Update rotation editor (`useUpdate`)
- [ ] Add delete functionality (`useDelete`)
- [ ] Update user's own rotations display
- [ ] Run `pnpm build`
- [ ] Test list page
- [ ] Test single rotation page
- [ ] Test create flow
- [ ] Test update flow
- [ ] Test delete flow

## Phase 5: Migrate Remaining Data

- [ ] Update user profile page (`useList`)
- [ ] Add user's rotations to profile
- [ ] Implement `useUserSettings` hook
- [ ] Update simulation results list
- [ ] Update simulation result creation
- [ ] Update account settings save
- [ ] Remove any remaining Supabase atoms
- [ ] Run `pnpm build`
- [ ] Test user profile page
- [ ] Test account settings
- [ ] Test settings save
- [ ] Test sim results

## Phase 6: Final Cleanup

- [ ] Check for remaining Jotai usages for Supabase data
- [ ] Clean up `atoms/` directory
- [ ] Remove unused imports
- [ ] Update `atoms/index.ts` exports
- [ ] Test all pages work
- [ ] Test persistence works
- [ ] Run `pnpm build`
- [ ] Run `pnpm lint`
- [ ] Update documentation

## Final Verification

- [ ] Home page loads
- [ ] Rotations list works
- [ ] Single rotation page works
- [ ] Create rotation works
- [ ] Edit rotation works
- [ ] Delete rotation works
- [ ] User profile page works
- [ ] Account page works
- [ ] User settings save/load works
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Fight profiles load from DB
- [ ] Wanted items load from DB
- [ ] Cache persists across browser refresh
- [ ] Cache invalidates on patch version change
- [ ] No console errors
- [ ] Build passes
- [ ] Lint passes
