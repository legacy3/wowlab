# Phase 4: Migrate Rotations CRUD

## Prompt for Claude

```
I'm migrating to Refine. Phase 3 (auth) is complete.

**YOUR TASK**: Migrate all rotation-related data fetching and mutations to Refine hooks.

## Refine Data Hooks

| Operation | Refine Hook |
|-----------|-------------|
| List rotations | `useList({ resource: "rotations" })` |
| Get one rotation | `useOne({ resource: "rotations", id })` |
| Create rotation | `useCreate()` |
| Update rotation | `useUpdate()` |
| Delete rotation | `useDelete()` |

## Step 1: Find All Rotation Data Usages

Search for these patterns:
- `rotationsAtom`
- `rotationAtom`
- `useAtom.*rotation`
- `supabase.from("rotations")`

## Step 2: Rotations List Page

Create/update apps/portal/src/app/rotations/page.tsx:

"use client";

import { useList } from "@refinedev/core";
import { RotationCard } from "@/components/rotations/rotation-card";

export default function RotationsPage() {
  const { data, isLoading } = useList({
    resource: "rotations",
    filters: [
      { field: "visibility", operator: "eq", value: "public" },
      { field: "deleted_at", operator: "null" },
    ],
    sorters: [{ field: "updated_at", order: "desc" }],
    pagination: { pageSize: 50 },
    meta: { select: "*, user_profiles(handle, avatar_url)" },
  });

  if (isLoading) return <RotationsSkeleton />;

  return (
    <div className="grid gap-4">
      {data?.data.map((rotation) => (
        <RotationCard key={rotation.id} rotation={rotation} />
      ))}
    </div>
  );
}

## Step 3: Single Rotation Page

Create/update apps/portal/src/app/rotations/[namespace]/[slug]/page.tsx:

"use client";

import { useList } from "@refinedev/core";
import { useParams } from "next/navigation";
import { RotationDetail } from "@/components/rotations/rotation-detail";

export default function RotationPage() {
  const { namespace, slug } = useParams<{ namespace: string; slug: string }>();

  // Use useList with filters instead of useOne (namespace/slug isn't the ID)
  const { data, isLoading } = useList({
    resource: "rotations",
    filters: [
      { field: "namespace", operator: "eq", value: namespace },
      { field: "slug", operator: "eq", value: slug },
    ],
    pagination: { pageSize: 1 },
    meta: { select: "*, user_profiles(handle, avatar_url)" },
  });

  if (isLoading) return <RotationDetailSkeleton />;

  const rotation = data?.data[0];
  if (!rotation) return <NotFound />;

  return <RotationDetail rotation={rotation} />;
}

## Step 4: Create Rotation Page

Create/update apps/portal/src/app/rotations/new/page.tsx:

"use client";

import { useCreate, useGetIdentity, useGo } from "@refinedev/core";
import { RotationForm } from "@/components/rotations/rotation-form";

export default function NewRotationPage() {
  const { data: identity } = useGetIdentity<{ id: string; handle: string }>();
  const { mutate, isLoading } = useCreate();
  const go = useGo();

  const onSubmit = (values: RotationFormValues) => {
    mutate(
      {
        resource: "rotations",
        values: {
          ...values,
          user_id: identity?.id,
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

  return <RotationForm onSubmit={onSubmit} isLoading={isLoading} />;
}

## Step 5: Update Rotation (Editor)

For the rotation editor, use useUpdate:

const { mutate: updateRotation, isLoading } = useUpdate();

const saveRotation = (values: Partial<Rotation>) => {
  updateRotation({
    resource: "rotations",
    id: rotationId,
    values,
  });
};

## Step 6: Delete Rotation

const { mutate: deleteRotation } = useDelete();

const handleDelete = () => {
  deleteRotation(
    { resource: "rotations", id: rotationId },
    { onSuccess: () => go({ to: "/rotations" }) }
  );
};

## Step 7: User's Own Rotations

For displaying the current user's rotations:

const { data: identity } = useGetIdentity<{ id: string }>();

const { data: myRotations } = useList({
  resource: "rotations",
  filters: [
    { field: "user_id", operator: "eq", value: identity?.id },
  ],
  sorters: [{ field: "updated_at", order: "desc" }],
  queryOptions: { enabled: !!identity?.id },
});

## Verify

1. Run pnpm build
2. Test rotations list page loads
3. Test single rotation page loads
4. Test creating a new rotation
5. Test updating a rotation
6. Test deleting a rotation
```

## Expected Outcome

- All rotation pages use Refine hooks
- CRUD operations work correctly
- No more Jotai atoms for rotations

## Checklist

- [ ] Find all files using rotation atoms
- [ ] Update rotations list page
- [ ] Update single rotation page
- [ ] Update create rotation page
- [ ] Update rotation editor (update)
- [ ] Add delete functionality
- [ ] Update user's own rotations display
- [ ] Run pnpm build
- [ ] Test list page
- [ ] Test single rotation page
- [ ] Test create flow
- [ ] Test update flow
- [ ] Test delete flow
