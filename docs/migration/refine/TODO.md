# Refine Migration TODO

Master checklist for the entire migration. Check items off as you complete each phase.

> **Phase Order**: 0.1 → 0.2 → 1 → 2 → 3 → 4 → 5 → 6 → 7
>
> This order ensures the app stays functional after each phase.

## Phase 0.1: Create Database Tables

- [ ] Check/create `update_updated_at_column()` trigger function
- [ ] Create `user_settings` table (camelCase columns)
- [ ] Enable RLS on `user_settings`
- [ ] Create SELECT policy (own settings)
- [ ] Create INSERT policy (own settings)
- [ ] Create UPDATE policy (own settings)
- [ ] Create updated_at trigger
- [ ] Create auto-create trigger on signup
- [ ] Backfill existing users
- [ ] Verify table in list_tables
- [ ] Verify RLS is enabled
- [ ] Verify all triggers work

## Phase 0.2: Seed Database with Data

- [ ] Create `fight_profiles` table
- [ ] Insert fight profile data (patchwerk, movement, aoe)
- [ ] Enable RLS on `fight_profiles` with public read policy
- [ ] Create `view_most_wanted_items` materialized view
- [ ] Create indexes on `view_most_wanted_items` (rank, slot)
- [ ] Refresh `view_top_sims_daily` materialized view
- [ ] Refresh `view_spec_rankings_hourly` materialized view
- [ ] Verify data in tables/views
- [ ] Run `pnpm build` (should pass - no code changes)

## Phase 1: Install Dependencies

- [ ] Install @refinedev/core
- [ ] Install @refinedev/supabase
- [ ] Install @refinedev/nextjs-router
- [ ] Install @tanstack/react-query-persist-client
- [ ] Install idb-keyval
- [ ] Create `lib/config/game.ts`
- [ ] Create `lib/refine/persister.ts`
- [ ] Create `lib/refine/data-provider.ts` (placeholder)
- [ ] Create `lib/refine/auth-provider.ts` (placeholder)
- [ ] Create `lib/refine/access-control.ts` (placeholder)
- [ ] Create `lib/refine/index.ts`
- [ ] Document existing QueryClient location
- [ ] Run `pnpm build` (should pass)

## Phase 2: Create Refine Providers

- [ ] Implement `lib/refine/data-provider.ts`
- [ ] Implement `lib/refine/auth-provider.ts` (camelCase columns!)
- [ ] Implement `lib/refine/access-control.ts` (camelCase columns!)
- [ ] Create `providers/refine-provider.tsx` with PersistQueryClientProvider
- [ ] Update `lib/refine/index.ts` exports
- [ ] Add RefineProvider to app layout (keep JotaiProvider!)
- [ ] Merge/remove any existing QueryClientProvider
- [ ] Run `pnpm build`
- [ ] Verify app loads in browser
- [ ] Verify IndexedDB cache is created

## Phase 3: Delete Supabase Atoms

- [ ] Delete `apps/portal/src/atoms/supabase/` directory
- [ ] Delete `apps/portal/src/atoms/rotations/` directory
- [ ] Delete `apps/portal/src/atoms/sim/results.ts`
- [ ] Delete `apps/portal/src/atoms/sim/results-ui.ts`
- [ ] Update `apps/portal/src/atoms/sim/index.ts`
- [ ] Delete `apps/portal/src/lib/auth/require-auth.ts`
- [ ] Delete `apps/portal/src/components/providers/auth-sync.tsx`
- [ ] Update `apps/portal/src/atoms/index.ts`
- [ ] Comment out broken imports (with TODO notes)
- [ ] Keep JotaiProvider in layout
- [ ] Run `pnpm build` (should pass)
- [ ] Document list of broken components for next phases

## Phase 4: Migrate Auth

- [ ] Find all files using old auth patterns
- [ ] Update sign-in to use `useLogin()`
- [ ] Update sign-out to use `useLogout()`
- [ ] Update auth checks to use `useIsAuthenticated()`
- [ ] Update identity access to use `useGetIdentity()`
- [ ] Update account page
- [ ] Update user menu component
- [ ] Verify OAuth callback works
- [ ] Run `pnpm build`
- [ ] Test login flow manually
- [ ] Test logout flow manually
- [ ] Test protected page redirect

## Phase 5: Migrate Rotations

- [ ] Find all files using rotation atoms
- [ ] Update rotations list page (`useList`)
- [ ] Update single rotation page (`useList` with filters)
- [ ] Update create rotation page (`useCreate`)
- [ ] Update rotation editor (`useUpdate`)
- [ ] Add delete functionality (`useUpdate` with deletedAt)
- [ ] Update user's own rotations display
- [ ] Update search by class/spec
- [ ] Update parent/fork rotation queries
- [ ] Run `pnpm build`
- [ ] Test list page
- [ ] Test single rotation page
- [ ] Test create flow
- [ ] Test update flow
- [ ] Test delete flow

## Phase 6: Migrate Remaining Data

- [ ] Update user profile page (`useList`)
- [ ] Add user's rotations to profile page
- [ ] Create `useUserSettings` hook
- [ ] Update account settings page
- [ ] Create `useSimResults` hook
- [ ] Create `useSaveSimResult` hook
- [ ] Create `useFightProfiles` hook
- [ ] Update `mostWantedItems` to fetch from DB
- [ ] Remove any remaining Supabase atoms
- [ ] Run `pnpm build`
- [ ] Test user profile page
- [ ] Test account settings
- [ ] Test settings save
- [ ] Test sim results
- [ ] Test fight profiles
- [ ] Test most wanted items

## Phase 7: Final Cleanup

- [ ] Verify Jotai only used for UI atoms
- [ ] Update `atoms/index.ts` exports
- [ ] Update `atoms/sim/index.ts` exports
- [ ] Fix any orphaned exports
- [ ] Check/remove unused dependencies
- [ ] Test all pages work
- [ ] Test IndexedDB persistence
- [ ] Test cache loads on refresh
- [ ] Run `pnpm build` (passes)
- [ ] Run `pnpm lint` (passes)
- [ ] Update CLAUDE.md
- [ ] Update any other documentation

## Final Verification Checklist

### Public Pages

- [ ] Home page loads
- [ ] Rotations list works
- [ ] Single rotation page works
- [ ] User profile page works

### Auth Flow

- [ ] Login flow works
- [ ] Logout flow works
- [ ] Session persists across refresh

### Protected Pages

- [ ] Account page works (auth required)
- [ ] Create rotation works (auth required)
- [ ] Edit rotation works (auth + ownership)
- [ ] Delete rotation works (auth + ownership)

### Data

- [ ] User settings save/load works
- [ ] Fight profiles load from DB
- [ ] Most wanted items load from DB
- [ ] Sim results display correctly
- [ ] Spec rankings display correctly
- [ ] Top sims display correctly

### Caching

- [ ] Cache persists across browser refresh
- [ ] Cache invalidates on patch version change
- [ ] IndexedDB store visible in DevTools

### Build

- [ ] No console errors
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
