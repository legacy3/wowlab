# Phase 6: Migrate Remaining Data (Profiles, Settings, Sim Results)

## Prompt for Claude

```
I'm migrating to Refine. Phase 5 (rotations) is complete.

**YOUR TASK**: Migrate user profiles, user settings, and simulation results to Refine.

## Important Notes

1. **Column names are camelCase**: userId, rotationId, meanDps, etc.
2. **user_settings already exists for all users**: Phase 0.1 created auto-insert trigger
3. **most_wanted_items is a materialized view**: Read-only, no mutations

## Resources to Migrate

1. **user_profiles** - Public user profile pages
2. **user_settings** - Private user settings (class, spec, theme, etc.)
3. **rotation_sim_results** - Simulation result history
4. **fight_profiles** - Static reference data
5. **most_wanted_items** - Materialized view for DPS rankings

## Step 1: User Profile Page

Update apps/portal/src/app/users/[handle]/page.tsx:

"use client";

import { useList } from "@refinedev/core";
import { useParams, notFound } from "next/navigation";
import { UserProfile } from "@/components/users/user-profile";
import { UserProfileSkeleton } from "@/components/users/user-profile-skeleton";

interface Profile {
  id: string;
  handle: string;
  email: string;
  avatarUrl: string | null;
}

interface Rotation {
  id: string;
  namespace: string;
  slug: string;
  name: string;
  class: string;
  spec: string;
  updatedAt: string;
}

export default function UserProfilePage() {
  const { handle } = useParams<{ handle: string }>();

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useList<Profile>({
    resource: "user_profiles",
    filters: [{ field: "handle", operator: "eq", value: handle }],
    pagination: { pageSize: 1 },
  });

  // Fetch user's public rotations
  const { data: rotationsData, isLoading: rotationsLoading } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "namespace", operator: "eq", value: handle },
      { field: "visibility", operator: "eq", value: "public" },
      { field: "deletedAt", operator: "null", value: true },
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    queryOptions: { enabled: !!handle },
  });

  if (profileLoading) return <UserProfileSkeleton />;

  const profile = profileData?.data[0];
  if (!profile) return notFound();

  return (
    <UserProfile
      profile={profile}
      rotations={rotationsData?.data ?? []}
      rotationsLoading={rotationsLoading}
    />
  );
}

## Step 2: User Settings Hook

Create apps/portal/src/hooks/use-user-settings.ts:

import { useOne, useUpdate, useGetIdentity } from "@refinedev/core";

export interface UserSettings {
  id: string;
  class: string | null;
  spec: string | null;
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  showTooltips: boolean;
  defaultFightDuration: number;
  defaultIterations: number;
}

interface UserIdentity {
  id: string;
}

export function useUserSettings() {
  const { data: identity } = useGetIdentity<UserIdentity>();

  // Settings row is auto-created on signup (Phase 0.1 trigger)
  // So useOne should always find a row for authenticated users
  const { data, isLoading, isError } = useOne<UserSettings>({
    resource: "user_settings",
    id: identity?.id ?? "",
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  const { mutate, isLoading: isUpdating } = useUpdate();

  const updateSettings = (values: Partial<Omit<UserSettings, "id">>) => {
    if (!identity?.id) return;

    mutate({
      resource: "user_settings",
      id: identity.id,
      values,
    });
  };

  return {
    settings: data?.data,
    isLoading,
    isError,
    isUpdating,
    updateSettings,
  };
}

## Step 3: Account Settings Page

Update the account settings page to use the hook:

"use client";

import { useUserSettings } from "@/hooks/use-user-settings";
import { useGetIdentity, useIsAuthenticated, useUpdate } from "@refinedev/core";
import { redirect } from "next/navigation";

export default function AccountPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();

  // Also need to update profile
  const { mutate: updateProfile, isLoading: isUpdatingProfile } = useUpdate();

  if (authLoading || identityLoading || settingsLoading) {
    return <AccountSkeleton />;
  }

  if (!auth?.authenticated) {
    redirect("/");
  }

  const handleProfileUpdate = (values: { handle?: string; avatarUrl?: string }) => {
    updateProfile({
      resource: "user_profiles",
      id: identity?.id ?? "",
      values,
    });
  };

  return (
    <AccountSettings
      identity={identity}
      settings={settings}
      onProfileUpdate={handleProfileUpdate}
      onSettingsUpdate={updateSettings}
      isUpdating={isUpdatingProfile}
    />
  );
}

## Step 4: Simulation Results

For listing sim results for a rotation:

import { useList, useCreate } from "@refinedev/core";

interface SimResult {
  id: string;
  rotationId: string;
  patch: string;
  fightType: string;
  duration: number;
  iterations: number;
  meanDps: number;
  minDps: number;
  maxDps: number;
  stdDev: number | null;
  scenario: string;
  gearSet: string;
  createdAt: string;
}

function useSimResults(rotationId: string) {
  return useList<SimResult>({
    resource: "rotation_sim_results",
    filters: [
      { field: "rotationId", operator: "eq", value: rotationId },
    ],
    sorters: [{ field: "createdAt", order: "desc" }],
    pagination: { pageSize: 20 },
    queryOptions: {
      enabled: !!rotationId,
    },
  });
}

// For creating a new sim result
function useSaveSimResult() {
  const { mutate, isLoading } = useCreate();

  const saveResult = (rotationId: string, result: Omit<SimResult, "id" | "rotationId" | "createdAt">) => {
    mutate({
      resource: "rotation_sim_results",
      values: {
        rotationId,
        ...result,
      },
    });
  };

  return { saveResult, isLoading };
}

## Step 5: Fight Profiles (Static Data)

For loading fight profile options:

import { useList } from "@refinedev/core";

interface FightProfile {
  id: string;
  label: string;
  description: string;
  category: string;
  order: number;
}

function useFightProfiles() {
  return useList<FightProfile>({
    resource: "fight_profiles",
    sorters: [{ field: "order", order: "asc" }],
    pagination: { pageSize: 100 },  // Load all
  });
}

## Step 6: Most Wanted Items (Materialized View)

Create a Refine hook:

// apps/portal/src/hooks/use-most-wanted-items.ts
import { useList } from "@refinedev/core";
import type { WantedItem } from "@/atoms/dps-rankings/state";

export function useMostWantedItems() {
  return useList<WantedItem>({
    resource: "most_wanted_items",
    sorters: [{ field: "rank", order: "asc" }],
    pagination: { pageSize: 10 },
  });
}

## Step 7: Clean Up Remaining Supabase Atom Usages

Search for any remaining direct Supabase usages that should use Refine:

grep -rn "supabase.from\|useAtomValue.*supabase\|supabaseClientAtom" apps/portal/src/ --include="*.tsx" --include="*.ts"

Migrate each one to appropriate Refine hook.

## Verify

1. Run pnpm build
2. Test user profile page (/users/[handle])
3. Test account settings page (/account)
4. Test user settings save
5. Test fight profiles load in simulation UI
6. Test most wanted items display
7. Test sim results display on rotation pages
```

## Expected Outcome

- All Supabase data uses Refine
- No more Jotai atoms for Supabase data
- User profiles, settings, and sim results work correctly

## Checklist

- [ ] Update user profile page
- [ ] Add user's rotations to profile page
- [ ] Create useUserSettings hook
- [ ] Update account settings page
- [ ] Create useSimResults hook
- [ ] Create useSaveSimResult hook
- [ ] Create useFightProfiles hook
- [ ] Update mostWantedItems to fetch from DB
- [ ] Remove any remaining Supabase atoms
- [ ] Run pnpm build
- [ ] Test user profile page
- [ ] Test account settings
- [ ] Test settings save
- [ ] Test sim results
- [ ] Test fight profiles
- [ ] Test most wanted items
