# Phase 5: Migrate Remaining Data (Profiles, Settings, Sim Results)

## Prompt for Claude

```
I'm migrating to Refine. Phase 4 (rotations) is complete.

**YOUR TASK**: Migrate user profiles, user settings, and simulation results to Refine.

## Resources to Migrate

1. **user_profiles** - Public user profile pages
2. **user_settings** - Private user settings (class, spec, theme, etc.)
3. **rotation_sim_results** - Simulation result history

## Step 1: User Profile Page

Create/update apps/portal/src/app/users/[handle]/page.tsx:

"use client";

import { useList } from "@refinedev/core";
import { useParams } from "next/navigation";
import { UserProfile } from "@/components/users/user-profile";

export default function UserProfilePage() {
  const { handle } = useParams<{ handle: string }>();

  const { data, isLoading } = useList({
    resource: "user_profiles",
    filters: [{ field: "handle", operator: "eq", value: handle }],
    pagination: { pageSize: 1 },
  });

  if (isLoading) return <UserProfileSkeleton />;

  const profile = data?.data[0];
  if (!profile) return <NotFound />;

  return <UserProfile profile={profile} />;
}

## Step 2: User's Rotations on Profile

On the user profile page, also fetch their public rotations:

const { data: rotations } = useList({
  resource: "rotations",
  filters: [
    { field: "namespace", operator: "eq", value: handle },
    { field: "visibility", operator: "eq", value: "public" },
  ],
  sorters: [{ field: "updated_at", order: "desc" }],
  queryOptions: { enabled: !!handle },
});

## Step 3: User Settings

For the current user's settings (class, spec, theme, etc.):

import { useOne, useUpdate, useGetIdentity } from "@refinedev/core";

interface UserSettings {
  id: string;
  class: string | null;
  spec: string | null;
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  showTooltips: boolean;
  defaultFightDuration: number;
  defaultIterations: number;
}

function useUserSettings() {
  const { data: identity } = useGetIdentity<{ id: string }>();

  const { data, isLoading } = useOne<UserSettings>({
    resource: "user_settings",
    id: identity?.id ?? "",
    queryOptions: { enabled: !!identity?.id },
  });

  const { mutate } = useUpdate();

  const updateSettings = (values: Partial<UserSettings>) => {
    if (!identity?.id) return;
    mutate({
      resource: "user_settings",
      id: identity.id,
      values,
    });
  };

  return { settings: data?.data, isLoading, updateSettings };
}

## Step 4: Simulation Results

For listing sim results for a rotation:

const { data: simResults, isLoading } = useList({
  resource: "rotation_sim_results",
  filters: [{ field: "rotationId", operator: "eq", value: rotationId }],
  sorters: [{ field: "createdAt", order: "desc" }],
  pagination: { pageSize: 20 },
  queryOptions: { enabled: !!rotationId },
});

For creating a new sim result:

const { mutate: createSimResult } = useCreate();

const saveSimResult = (result: SimResultInput) => {
  createSimResult({
    resource: "rotation_sim_results",
    values: {
      rotationId,
      ...result,
    },
  });
};

## Step 5: Update Profile (Account Settings)

For updating the current user's profile:

const { data: identity } = useGetIdentity<{ id: string }>();
const { mutate: updateProfile } = useUpdate();

const handleSave = (values: Partial<UserProfile>) => {
  updateProfile({
    resource: "user_profiles",
    id: identity?.id ?? "",
    values,
  });
};

## Step 6: Clean Up Any Remaining Atoms

Search for any remaining usages of:
- `profileAtom`
- `settingsAtom` / `preferencesAtom`
- `simResultsAtom`

And migrate them to Refine hooks.

## Verify

1. Run pnpm build
2. Test user profile page
3. Test account settings page
4. Test user settings save
5. Test sim results display
6. Test sim results save
```

## Expected Outcome

- All Supabase data uses Refine
- No more Jotai atoms for Supabase data
- User profiles, settings, and sim results work correctly

## Checklist

- [ ] Update user profile page
- [ ] Add user's rotations to profile
- [ ] Create useUserSettings hook or pattern
- [ ] Update simulation results list
- [ ] Update simulation result creation
- [ ] Update account settings save
- [ ] Remove any remaining Supabase atoms
- [ ] Run pnpm build
- [ ] Test user profile page
- [ ] Test account settings
- [ ] Test settings save
- [ ] Test sim results
