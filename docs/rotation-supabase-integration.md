# Rotation Supabase Integration Plan

> Store user rotation scripts. That's it.

## Schema (Already Done)

```sql
rotations
├── id (uuid, pk, default gen_random_uuid())
├── userId (uuid, fk → auth.users, not null)
├── slug (text, not null)
├── name (text, not null)
├── class (text, not null)
├── spec (text, not null)
├── script (text, not null)
├── description (text, nullable)
├── isPublic (boolean, default false)
├── forkedFromId (uuid, nullable, fk → rotations)
├── createdAt (timestamptz, default now())
├── updatedAt (timestamptz, default now())

UNIQUE(userId, slug)
```

**URL pattern:** `/@{handle}/{slug}` where handle comes from `user_profiles`.

**RLS:**
- SELECT: `"isPublic" = true` OR `"userId" = auth.uid()`
- INSERT: `"userId" = auth.uid()`
- UPDATE: `"userId" = auth.uid()`
- DELETE: `"userId" = auth.uid()`

---

## Established Codebase Patterns

Before implementing, follow these patterns from the existing codebase:

### Data Fetching - Refine Hooks

**DO use Refine hooks in client components:**
```typescript
// Fetch single record
const { data: rotation, isLoading } = useOne<Rotation>({
  resource: "rotations",
  id: rotationId,
  queryOptions: { enabled: !!rotationId },
});

// Fetch list with filters
const { result, query: { isLoading } } = useList<Rotation>({
  resource: "rotations",
  filters: [{ field: "isPublic", operator: "eq", value: true }],
  sorters: [{ field: "updatedAt", order: "desc" }],
});

// Mutations
const { mutateAsync: createRotation } = useCreate();
const { mutateAsync: updateRotation } = useUpdate<Rotation>();
const { mutateAsync: deleteRotation } = useDelete();
```

**DON'T do raw Supabase queries in server components for data that Refine manages.**

### Forms - react-hook-form + Zod

Follow the profile-settings-card.tsx pattern:
```typescript
const form = useForm<RotationFormValues>({
  defaultValues: { name: "", slug: "", ... },
  mode: "onChange",
});

// Zod schema for validation
const rotationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(50),
  class: z.string().min(1),
  spec: z.string().min(1),
  script: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

// Controller pattern for fields
<Controller
  name="name"
  control={form.control}
  rules={{ validate: (v) => rotationSchema.shape.name.safeParse(v).success || "Invalid" }}
  render={({ field, fieldState }) => (
    <Input {...field} aria-invalid={fieldState.invalid} />
  )}
/>
```

### URL State - nuqs

For editor mode (create/edit/fork), use nuqs:
```typescript
import { useQueryState, parseAsStringLiteral } from "nuqs";

const modes = ["create", "edit", "fork"] as const;
const [mode, setMode] = useQueryState(
  "mode",
  parseAsStringLiteral(modes)
    .withDefault("create")
    .withOptions({ shallow: true, history: "replace" }),
);
```

### Jotai - UI State Only

Jotai is for **UI state persistence**, not form data:
```typescript
// Good: Card ordering (persisted to localStorage)
export const editorCardOrderAtom = createPersistedOrderAtom<EditorCardId>(
  "editor-card-order",
  ["rotation-script", "templates", "syntax-reference", "validation"],
);

// Bad: Don't use Jotai for form data that comes from/goes to server
```

### Custom Hooks - Wrapper Pattern

Follow use-user-settings.ts pattern:
```typescript
export function useRotation(id: string | undefined) {
  const { data: rotation, isLoading, isError, refetch } = useOne<Rotation>({
    resource: "rotations",
    id: id ?? "",
    queryOptions: { enabled: !!id },
  });

  return { rotation, isLoading, isError, refetch };
}

export function useRotationMutations() {
  const { mutateAsync: create } = useCreate();
  const { mutateAsync: update } = useUpdate<Rotation>();
  const { mutateAsync: remove } = useDelete();
  const router = useRouter();

  const createRotation = async (values: RotationInsert) => {
    const result = await create({ resource: "rotations", values });
    router.push(`/rotations/editor/${result.data.id}`);
    return result;
  };

  const updateRotation = async (id: string, values: RotationUpdate) => {
    return update({ resource: "rotations", id, values });
  };

  const deleteRotation = async (id: string) => {
    await remove({ resource: "rotations", id });
    router.push("/rotations");
  };

  return { createRotation, updateRotation, deleteRotation };
}
```

### Page Structure

Pages are thin - just layout + pass params to client components:
```typescript
// app/rotations/editor/page.tsx
export default async function RotationEditorPage({ searchParams }: Props) {
  const { fork } = await searchParams;

  return (
    <PageLayout title="Rotation Editor" breadcrumbs={[...]}>
      <RotationEditor forkSourceId={fork} />
    </PageLayout>
  );
}

// app/rotations/editor/[id]/page.tsx
export default async function EditRotationPage({ params }: Props) {
  const { id } = await params;

  return (
    <PageLayout title="Edit Rotation" breadcrumbs={[...]}>
      <RotationEditor rotationId={id} />
    </PageLayout>
  );
}
```

### Component Structure

```typescript
// Outer component with Suspense
export function RotationEditor(props: Props) {
  return (
    <Suspense fallback={<RotationEditorSkeleton />}>
      <RotationEditorInner {...props} />
    </Suspense>
  );
}

// Inner component with hooks
function RotationEditorInner({ rotationId, forkSourceId }: Props) {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { rotation, isLoading } = useRotation(rotationId);
  // ... form setup, mutations, etc.
}

// Skeleton for loading state
function RotationEditorSkeleton() {
  return <div className="grid gap-4">...</div>;
}
```

---

## Implementation Plan

### Phase 1: Fix Broken Components

The schema change broke these - fix them first:

**rotation-card.tsx** - Remove references to:
- `rotation.status` → remove status badge
- `rotation.visibility` → use `rotation.isPublic`
- `rotation.patchRange` → remove from display

**rotation-detail-page.tsx** - Fix:
- Remove `namespace` filter → use userId + join to user_profiles
- Remove `deletedAt` filter → removed from schema
- Remove `SimResult` references → table dropped
- Change `parentId` → `forkedFromId`
- Remove `version`, `patchRange`, `visibility`, `publishedAt` references

**rotations-content.tsx** - Fix:
- Change `visibility: "public"` → `isPublic: true`
- Remove `status` filter
- Remove `deletedAt` filter
- Remove status filter UI

### Phase 2: Create Rotation Hooks

**File: `hooks/rotations/use-rotation.ts`**
```typescript
export function useRotation(id: string | undefined) {
  return useOne<Rotation>({
    resource: "rotations",
    id: id ?? "",
    queryOptions: { enabled: !!id },
  });
}
```

**File: `hooks/rotations/use-rotation-mutations.ts`**
```typescript
export function useRotationMutations() {
  // createRotation, updateRotation, deleteRotation
  // Handle redirects after mutations
}
```

**File: `hooks/rotations/index.ts`**
```typescript
export { useRotation } from "./use-rotation";
export { useRotationMutations } from "./use-rotation-mutations";
```

### Phase 3: Create RotationEditor Component

**File: `components/rotations/editor/rotation-editor.tsx`**

Single component that handles create/edit/fork:
- Props: `{ rotationId?: string; forkSourceId?: string }`
- Uses `useRotation` to fetch for edit/fork
- Uses `useForm` for form state
- Uses `useRotationMutations` for save/delete
- Checks ownership via `useGetIdentity`

### Phase 4: Update Editor Cards

**rotation-metadata-card.tsx** (new)
- Form fields: name, slug, class, spec, description, isPublic
- Receives form control via props (not atoms)

**rotation-script-card.tsx**
- Textarea for script (Monaco later)
- Save/delete buttons
- Dirty indicator

**validation-card.tsx**
- Real-time validation of form values
- Uses form.watch() to react to changes

**templates-card.tsx**
- Apply template → calls form.setValue()

### Phase 5: Update Pages

Keep pages thin - just pass IDs:
```typescript
// /rotations/editor/page.tsx
<RotationEditor forkSourceId={searchParams.fork} />

// /rotations/editor/[id]/page.tsx
<RotationEditor rotationId={params.id} />
```

---

## Files to Change

```
# Hooks (new)
apps/portal/src/hooks/rotations/use-rotation.ts
apps/portal/src/hooks/rotations/use-rotation-mutations.ts
apps/portal/src/hooks/rotations/index.ts

# Components (new)
apps/portal/src/components/rotations/editor/rotation-editor.tsx
apps/portal/src/components/rotations/editor/cards/rotation-metadata-card.tsx

# Components (fix for new schema)
apps/portal/src/components/rotations/rotation-card.tsx
apps/portal/src/components/rotations/rotation-detail-page.tsx
apps/portal/src/components/rotations/rotations-content.tsx

# Components (wire up)
apps/portal/src/components/rotations/editor/cards/rotation-script-card.tsx
apps/portal/src/components/rotations/editor/cards/validation-card.tsx
apps/portal/src/components/rotations/editor/cards/templates-card.tsx

# Pages (simplify)
apps/portal/src/app/rotations/editor/page.tsx
apps/portal/src/app/rotations/editor/[id]/page.tsx
```

---

## Out of Scope

- Simulation results storage (separate effort)
- Monaco editor (use textarea for now)
- Script syntax validation (basic only)
- Patch compatibility
- Versioning/history
