# Phase 5: Migrate Rotations CRUD

## Prompt for Claude

```
I'm migrating to Refine. Phase 4 (auth) is complete.

**YOUR TASK**: Migrate all rotation-related data fetching and mutations to Refine hooks.

## Important: Column Names (camelCase)

The database uses camelCase. Use these in all filters:
- userId (not user_id)
- deletedAt (not deleted_at)
- createdAt, updatedAt
- patchRange, parentId

## Refine Data Hooks Reference

| Operation         | Refine Hook                              |
| ----------------- | ---------------------------------------- |
| List rotations    | `useList({ resource: "rotations" })`     |
| Get one rotation  | `useOne()` or `useList` with filters     |
| Create rotation   | `useCreate()`                            |
| Update rotation   | `useUpdate()`                            |
| Delete rotation   | `useUpdate({ deletedAt: now() })` (soft) |

## Jotai Atom → Refine Hook Mapping

| Old Atom                          | New Hook                                     |
| --------------------------------- | -------------------------------------------- |
| `rotationAtomFamily(slug)`        | `useList` with namespace/slug filters        |
| `rotationsByNamespaceAtomFamily`  | `useList` with namespace filter              |
| `myRotationsAtom`                 | `useList` with userId filter                 |
| `saveRotationAtom`                | `useCreate`                                  |
| `updateRotationAtom`              | `useUpdate`                                  |
| `deleteRotationAtom`              | `useUpdate` with deletedAt                   |
| `browseRotationsAtom`             | `useList` with visibility/status filters     |
| `searchRotationsAtomFamily`       | `useList` with class/spec filters            |
| `parentRotationAtomFamily`        | `useOne` with parentId                       |
| `forkRotationsAtomFamily`         | `useList` with parentId filter               |

## Step 1: Find All Rotation Data Usages

grep -rn "rotationAtom\|rotationsAtom\|myRotations\|saveRotation\|updateRotation\|deleteRotation\|browseRotations\|searchRotations" apps/portal/src/ --include="*.tsx" --include="*.ts"

## Step 2: Rotations List Page (Browse)

Update apps/portal/src/app/rotations/page.tsx:

"use client";

import { useList } from "@refinedev/core";
import { RotationCard } from "@/components/rotations/rotation-card";
import { RotationsSkeleton } from "@/components/rotations/rotations-skeleton";

interface Rotation {
  id: string;
  namespace: string;
  slug: string;
  name: string;
  description: string | null;
  class: string;
  spec: string;
  visibility: string;
  status: string;
  updatedAt: string;
  user_profiles?: {
    handle: string;
    avatarUrl: string | null;
  };
}

export default function RotationsPage() {
  const { data, isLoading, isError } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "visibility", operator: "eq", value: "public" },
      { field: "status", operator: "eq", value: "approved" },
      { field: "deletedAt", operator: "null", value: true },
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    pagination: { pageSize: 50 },
    meta: {
      select: "*, user_profiles(handle, avatarUrl)",
    },
  });

  if (isLoading) return <RotationsSkeleton />;
  if (isError) return <div>Error loading rotations</div>;

  return (
    <div className="grid gap-4">
      {data?.data.map((rotation) => (
        <RotationCard key={rotation.id} rotation={rotation} />
      ))}
    </div>
  );
}

## Step 3: Single Rotation Page

Update apps/portal/src/app/rotations/[namespace]/[slug]/page.tsx:

"use client";

import { useList } from "@refinedev/core";
import { useParams, notFound } from "next/navigation";
import { RotationDetail } from "@/components/rotations/rotation-detail";
import { RotationDetailSkeleton } from "@/components/rotations/rotation-detail-skeleton";

export default function RotationPage() {
  const { namespace, slug } = useParams<{ namespace: string; slug: string }>();

  // Use useList with filters since we're querying by namespace/slug, not ID
  const { data, isLoading, isError } = useList({
    resource: "rotations",
    filters: [
      { field: "namespace", operator: "eq", value: namespace },
      { field: "slug", operator: "eq", value: slug },
      { field: "deletedAt", operator: "null", value: true },
    ],
    pagination: { pageSize: 1 },
    meta: {
      select: "*, user_profiles(handle, avatarUrl)",
    },
  });

  if (isLoading) return <RotationDetailSkeleton />;
  if (isError) return <div>Error loading rotation</div>;

  const rotation = data?.data[0];
  if (!rotation) return notFound();

  return <RotationDetail rotation={rotation} />;
}

## Step 4: Create Rotation Page

Update apps/portal/src/app/rotations/new/page.tsx:

"use client";

import { useCreate, useGetIdentity, useGo, useIsAuthenticated } from "@refinedev/core";
import { redirect } from "next/navigation";
import { RotationForm } from "@/components/rotations/rotation-form";

interface UserIdentity {
  id: string;
  handle?: string;
}

export default function NewRotationPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<UserIdentity>();
  const { mutate: create, isLoading: isCreating } = useCreate();
  const go = useGo();

  if (authLoading || identityLoading) return <RotationFormSkeleton />;
  if (!auth?.authenticated) redirect("/");

  const onSubmit = (values: RotationFormValues) => {
    create(
      {
        resource: "rotations",
        values: {
          ...values,
          userId: identity?.id,
          namespace: identity?.handle,
        },
      },
      {
        onSuccess: ({ data }) => {
          go({ to: `/rotations/${data.namespace}/${data.slug}` });
        },
      }
    );
  };

  return <RotationForm onSubmit={onSubmit} isLoading={isCreating} />;
}

## Step 5: Update Rotation (Editor)

In the rotation editor component:

import { useUpdate, useOne } from "@refinedev/core";

// Load rotation by ID (if you have the ID)
const { data: rotationData, isLoading } = useOne({
  resource: "rotations",
  id: rotationId,
});

// Or load by namespace/slug
const { data: rotationData } = useList({
  resource: "rotations",
  filters: [
    { field: "namespace", operator: "eq", value: namespace },
    { field: "slug", operator: "eq", value: slug },
  ],
  pagination: { pageSize: 1 },
});

const { mutate: updateRotation, isLoading: isUpdating } = useUpdate();

const saveRotation = (values: Partial<Rotation>) => {
  updateRotation({
    resource: "rotations",
    id: rotationId,
    values,
  });
};

## Step 6: Delete Rotation (Soft Delete)

import { useUpdate, useGo } from "@refinedev/core";

const { mutate: updateRotation } = useUpdate();
const go = useGo();

const handleDelete = () => {
  updateRotation(
    {
      resource: "rotations",
      id: rotationId,
      values: {
        deletedAt: new Date().toISOString(),
      },
    },
    {
      onSuccess: () => {
        go({ to: "/rotations" });
      },
    }
  );
};

## Step 7: User's Own Rotations

For displaying the current user's rotations (e.g., in account page or dashboard):

import { useList, useGetIdentity } from "@refinedev/core";

const { data: identity } = useGetIdentity<{ id: string }>();

const { data: myRotations, isLoading } = useList({
  resource: "rotations",
  filters: [
    { field: "userId", operator: "eq", value: identity?.id },
    { field: "deletedAt", operator: "null", value: true },
  ],
  sorters: [{ field: "updatedAt", order: "desc" }],
  queryOptions: {
    enabled: !!identity?.id,  // Only run query when we have user ID
  },
});

## Step 8: Search Rotations by Class/Spec

import { useList } from "@refinedev/core";

function useSearchRotations(classFilter?: string, specFilter?: string) {
  return useList({
    resource: "rotations",
    filters: [
      { field: "visibility", operator: "eq", value: "public" },
      { field: "status", operator: "eq", value: "approved" },
      { field: "deletedAt", operator: "null", value: true },
      ...(classFilter ? [{ field: "class", operator: "eq", value: classFilter }] : []),
      ...(specFilter ? [{ field: "spec", operator: "eq", value: specFilter }] : []),
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    pagination: { pageSize: 50 },
  });
}

## Step 9: Parent/Fork Rotations

// Get parent rotation
const { data: parent } = useOne({
  resource: "rotations",
  id: rotation.parentId ?? "",
  queryOptions: {
    enabled: !!rotation.parentId,
  },
});

// Get fork rotations
const { data: forks } = useList({
  resource: "rotations",
  filters: [
    { field: "parentId", operator: "eq", value: rotation.id },
  ],
  sorters: [{ field: "createdAt", order: "desc" }],
});

## Verify

1. Run pnpm build
2. Test rotations list page loads
3. Test single rotation page loads
4. Test creating a new rotation (must be logged in)
5. Test updating a rotation in editor
6. Test deleting a rotation
7. Test viewing own rotations in account page
```

## Expected Outcome

- All rotation pages use Refine hooks
- CRUD operations work correctly
- No more Jotai atoms for rotations

## Checklist

- [ ] Find all files using rotation atoms
- [ ] Update rotations list page (browse)
- [ ] Update single rotation page
- [ ] Update create rotation page
- [ ] Update rotation editor (update)
- [ ] Add delete functionality (soft delete)
- [ ] Update user's own rotations display
- [ ] Update search by class/spec
- [ ] Update parent/fork rotation queries
- [ ] Run pnpm build
- [ ] Test list page
- [ ] Test single rotation page
- [ ] Test create flow
- [ ] Test update flow
- [ ] Test delete flow
