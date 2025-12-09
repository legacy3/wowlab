# Rotation Supabase Integration Plan

> Store user rotation scripts. That's it.

## Schema

One table:

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

## What We Dropped

| Old Field | Why Dropped |
|-----------|-------------|
| `namespace` | Redundant - join to user_profiles.handle |
| `config` | Undefined purpose |
| `status` | No moderation needed |
| `visibility` (3 states) | Simplified to `is_public` boolean |
| `version` | Edit in place, no versioning |
| `patchRange` | Not needed for MVP |
| `publishedAt` | Not needed |
| `deletedAt` | Hard delete instead |

Also dropping `rotation_sim_results` table for now - deal with it when we wire up simulations.

---

## UI Components

### Existing (needs update)

| Component | Changes Needed |
|-----------|----------------|
| RotationsBrowse | Update filters for new schema |
| RotationDetail | Update to join user_profiles for handle |
| RotationCard | Update field names |
| EditorContent | Wire to atoms + bootstrap |
| RotationScriptCard | Replace hardcoded script with editor |
| TemplatesCard | Wire to form atoms |
| ValidationCard | Wire to validation atoms |

### New

| Component | Purpose |
|-----------|---------|
| RotationMetadataCard | Name, class, spec, visibility fields |
| CodeEditor | Monaco wrapper for script editing |

---

## Atoms

```typescript
// apps/portal/src/atoms/editor/state.ts

interface RotationEditorContext {
  mode: "create" | "edit" | "fork";
  rotationId: string | null;
  forkedFromId: string | null;
}

interface RotationFormData {
  name: string;
  slug: string;
  class: string;
  spec: string;
  script: string;
  description: string;
  isPublic: boolean;
}

rotationEditorContextAtom    // mode + IDs
rotationFormAtom             // form fields
rotationInitialSnapshotAtom  // for dirty detection
rotationValidationAtom       // validation results
rotationSavingAtom           // loading state

// Derived
rotationDirtyAtom            // form !== snapshot
rotationCanSaveAtom          // !saving && no errors
```

---

## Data Flow

### Create New Rotation

```
/rotations/editor
    ↓
Server: get user profile (handle)
    ↓
Bootstrap: { mode: "create", form: defaults }
    ↓
EditorContent: hydrate atoms
    ↓
User edits form
    ↓
Save: useCreate → INSERT into rotations
    ↓
Redirect to /rotations/editor/{id}
```

### Edit Existing Rotation

```
/rotations/editor/{id}
    ↓
Server: fetch rotation (with ownership check)
    ↓
Bootstrap: { mode: "edit", rotationId, form: rotation }
    ↓
EditorContent: hydrate atoms
    ↓
User edits form
    ↓
Save: useUpdate → UPDATE rotations
```

### Fork Rotation

```
/rotations/editor?fork={id}
    ↓
Server: fetch source rotation (must be public)
    ↓
Bootstrap: { mode: "fork", forkedFromId, form: { ...source, name: "Copy of..." } }
    ↓
EditorContent: hydrate atoms
    ↓
User edits form
    ↓
Save: useCreate → INSERT with forked_from_id
```

---

## Implementation Phases

### Phase 1: Database Migration

1. Drop `rotation_sim_results` table
2. Drop `rotations` table
3. Create new `rotations` table with simplified schema
4. Add RLS policies
5. Regenerate TypeScript types

### Phase 2: Atoms & Types

1. Update `atoms/editor/state.ts` with new atoms
2. Create `RotationFormData` type matching new schema
3. Add hydration hook

### Phase 3: Server Loaders

1. Update `/rotations/editor/page.tsx` for create/fork
2. Update `/rotations/editor/[id]/page.tsx` for edit
3. Add ownership checks

### Phase 4: Editor Components

1. Add `RotationMetadataCard` (name, class, spec, visibility)
2. Update `RotationScriptCard` with real editor
3. Wire `TemplatesCard` to apply templates
4. Wire `ValidationCard` to show real errors

### Phase 5: CRUD Hooks

1. Create `useRotationEditorActions` hook
2. Implement save (create/update)
3. Implement delete
4. Handle navigation after save

### Phase 6: Browse/Detail Updates

1. Update `RotationsBrowse` queries
2. Update `RotationDetail` to use new schema
3. Update `RotationCard` field mappings
4. Fix URL generation to use `/@{handle}/{slug}`

---

## Files to Change

```
# Database
supabase migration (new)

# Types (auto-generated)
apps/portal/src/lib/supabase/database.types.ts

# Atoms
apps/portal/src/atoms/editor/state.ts

# Hooks (new)
apps/portal/src/hooks/rotations/use-hydrate-rotation-editor.ts
apps/portal/src/hooks/rotations/use-rotation-editor-actions.ts
apps/portal/src/hooks/rotations/use-rotation-validation.ts

# Pages
apps/portal/src/app/rotations/editor/page.tsx
apps/portal/src/app/rotations/editor/[id]/page.tsx

# Components
apps/portal/src/components/rotations/editor/editor-content.tsx
apps/portal/src/components/rotations/editor/cards/rotation-metadata-card.tsx (new)
apps/portal/src/components/rotations/editor/cards/rotation-script-card.tsx
apps/portal/src/components/rotations/editor/cards/templates-card.tsx
apps/portal/src/components/rotations/editor/cards/validation-card.tsx
apps/portal/src/components/rotations/rotations-content.tsx
apps/portal/src/components/rotations/rotation-detail-page.tsx
apps/portal/src/components/rotations/rotation-card.tsx
```

---

## Out of Scope

- Simulation results storage (separate effort)
- Leaderboards/rankings (depends on sim results)
- Script syntax validation (basic only for now)
- Monaco custom language (use JS highlighting)
- Patch compatibility
- Versioning/history
