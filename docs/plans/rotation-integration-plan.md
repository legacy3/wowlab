# Rotation Integration Plan

## Goal

Allow users to run their own rotations (from `/rotations`) in `/simulate` instead of only hardcoded ones.

---

## Current vs Target

```
CURRENT                                    TARGET
─────────────────────────────────────────────────────────────────────────────

/rotations                                 /rotations
┌─────────────────────┐                    ┌─────────────────────┐
│ Editor → DB         │                    │ Editor → DB         │
│ (script string)     │                    │ (script)            │
└─────────────────────┘                    └──────────┬──────────┘
         ✗                                            │
    no connection                                     ▼
         ✗                                 ┌─────────────────────┐
                                           │ Edge Function       │
/simulate                                  │ compiles → Storage  │
┌─────────────────────┐                    └──────────┬──────────┘
│ Hardcoded registry  │                              │
│ ROTATION_REGISTRY[] │                              ▼
└─────────────────────┘                    /simulate
                                           ┌─────────────────────┐
                                           │ dynamic import()    │
                                           │ from Storage URL    │
                                           └─────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Migration

Add columns and version history table.

```sql
-- Add to rotations table
ALTER TABLE rotations ADD COLUMN compiled_url text;
ALTER TABLE rotations ADD COLUMN compiled_at timestamptz;
ALTER TABLE rotations ADD COLUMN current_version integer DEFAULT 1;

-- Version history (full versions, not deltas)
CREATE TABLE rotation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id uuid REFERENCES rotations(id) ON DELETE CASCADE,
  version integer NOT NULL,
  script text NOT NULL,
  compiled_url text,
  message text,  -- optional commit message
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id),

  UNIQUE(rotation_id, version)
);

-- Index for fast lookups
CREATE INDEX idx_rotation_versions_lookup
  ON rotation_versions(rotation_id, version DESC);

-- Auto-version on update
CREATE OR REPLACE FUNCTION create_rotation_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.script IS DISTINCT FROM NEW.script THEN
    INSERT INTO rotation_versions (rotation_id, version, script, compiled_url, created_by)
    VALUES (OLD.id, OLD.current_version, OLD.script, OLD.compiled_url, OLD.userId);

    NEW.current_version := OLD.current_version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rotation_version_trigger
  BEFORE UPDATE ON rotations
  FOR EACH ROW EXECUTE FUNCTION create_rotation_version();
```

No `spellIds` column needed - spells are lazy-loaded on first cast during simulation.

---

### Phase 2: Supabase Storage Bucket

Create a public bucket for compiled rotation modules.

```
Bucket: compiled-rotations
Path:   rotations/{rotation_id}/v{version}.js
Access: Public (read-only)
```

Versioned paths allow:
- Cache forever (immutable content)
- Old versions stay accessible
- No cache invalidation needed

---

### Phase 3: Compile Edge Function

**Location**: `supabase/functions/compile-rotation/index.ts`

Triggered on rotation insert/update. Generates a JS module and uploads to storage.

**Input** (from DB trigger):
```typescript
{
  id: string;
  name: string;
  script: string;
  current_version: number;
}
```

**Output** (uploaded to storage):
```typescript
// compiled-rotations/rotations/{id}/v{version}.js
import * as Effect from "effect/Effect";
import * as Context from "@wowlab/rotation/Context";
import { tryCast } from "@wowlab/rotation/utils";

export default {
  name: "My BM Rotation",
  run: (playerId, targetId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;
      ${script}
    }),
};
```

**Then**: Update `compiled_url` and `compiled_at` in the rotation record.

No `spellIds` in the module - spell data is lazy-loaded when `tryCast` is called.

---

### Phase 4: Lazy Spell Data Loading

Modify `tryCast` (or the underlying spell service) to fetch spell data on-demand.

**Flow**:
```
tryCast(spellId)
    │
    ▼
┌─────────────────────────┐
│ Check cache             │
│ (React Query/IndexedDB) │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │           │
    cached     not cached
      │           │
      ▼           ▼
   use it    fetch from Supabase
                  │
                  ▼
             cache it
                  │
                  ▼
               use it
```

After first simulation run, all spells are cached. Subsequent runs are instant.

---

### Phase 5: Rotation Loader Hook (Portal)

**Location**: `apps/portal/src/hooks/rotations/use-compiled-rotation.ts`

```typescript
export function useCompiledRotation(rotationId: string) {
  const { rotation, isLoading: isLoadingMeta } = useRotation(rotationId);

  const { data: compiled, isLoading: isLoadingModule } = useQuery({
    queryKey: ["compiled-rotation", rotation?.compiledUrl],
    queryFn: async () => {
      if (!rotation?.compiledUrl) return null;
      const module = await import(/* @vite-ignore */ rotation.compiledUrl);
      return module.default as RotationDefinition;
    },
    enabled: !!rotation?.compiledUrl,
  });

  return { rotation: compiled, isLoading: isLoadingMeta || isLoadingModule };
}
```

---

### Phase 6: Update Rotation Picker

**Location**: `apps/portal/src/components/simulate/rotation-picker.tsx`

Show three sections:
- **My Rotations** - user's DB rotations (requires auth)
- **Community** - public DB rotations
- **Built-in** - hardcoded fallbacks

```
┌─────────────────────────────────────────┐
│  Search rotations...                    │
├─────────────────────────────────────────┤
│  Auto-detect                            │
├─────────────────────────────────────────┤
│  MY ROTATIONS                           │
│  └─ My BM Build                         │
├─────────────────────────────────────────┤
│  COMMUNITY                              │
│  └─ Popular BM by user123               │
├─────────────────────────────────────────┤
│  BUILT-IN                               │
│  └─ Beast Mastery Hunter                │
└─────────────────────────────────────────┘
```

---

### Phase 7: Update Simulation Atoms

**Location**: `apps/portal/src/atoms/sim/rotation.ts`

```typescript
type RotationSource =
  | { type: "builtin"; id: string }
  | { type: "database"; id: string };

export const selectedRotationAtom = atom<RotationSource | null>(null);

export const currentRotationAtom = atom(async (get) => {
  const source = get(selectedRotationAtom);

  if (!source) return autoDetect(get);

  if (source.type === "builtin") {
    return getRotation(source.id);
  }

  // Load pre-compiled module from storage
  const rotation = await fetchRotation(source.id);
  const module = await import(rotation.compiledUrl);
  return module.default as RotationDefinition;
});
```

---

### Phase 8: Version History UI

**Location**: `apps/portal/src/components/rotations/editor/`

Add version history panel to rotation editor.

**Hook**: `apps/portal/src/hooks/rotations/use-rotation-versions.ts`

```typescript
export function useRotationVersions(rotationId: string) {
  return useQuery({
    queryKey: ["rotation-versions", rotationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("rotation_versions")
        .select("version, created_at, message, created_by")
        .eq("rotation_id", rotationId)
        .order("version", { ascending: false });
      return data;
    },
  });
}

export function useRotationVersion(rotationId: string, version: number) {
  return useQuery({
    queryKey: ["rotation-version", rotationId, version],
    queryFn: async () => {
      const { data } = await supabase
        .from("rotation_versions")
        .select("script")
        .eq("rotation_id", rotationId)
        .eq("version", version)
        .single();
      return data?.script;
    },
  });
}
```

**Diffing**: Use `diff` npm package for client-side diffing.

```typescript
import { diffLines } from 'diff';

const changes = diffLines(oldScript, newScript);
// Render with syntax highlighting + diff colors
```

**UI Features**:
- Version list sidebar
- Click to view any version
- Diff view between any two versions
- Restore button (copies old script to editor)
- Optional commit message on save

---

## File Changes

| File | Change |
|------|--------|
| `supabase/migrations/xxx_rotation_versioning.sql` | **NEW** - Version table, trigger |
| `supabase/functions/compile-rotation/index.ts` | **NEW** - Compile edge function |
| `apps/portal/src/lib/supabase/database.types.ts` | Add new columns + `rotation_versions` table |
| `apps/portal/src/hooks/rotations/use-compiled-rotation.ts` | **NEW** |
| `apps/portal/src/hooks/rotations/use-rotation-versions.ts` | **NEW** - Version history hooks |
| `apps/portal/src/atoms/sim/rotation.ts` | Support DB + builtin |
| `apps/portal/src/components/simulate/rotation-picker.tsx` | Show all sources |
| `apps/portal/src/components/rotations/editor/version-history.tsx` | **NEW** - Version history panel |
| `apps/portal/src/components/rotations/editor/diff-view.tsx` | **NEW** - Diff viewer |

---

## Verification Checklist

### Database
- [ ] `compiled_url` column exists on `rotations` table
- [ ] `compiled_at` column exists on `rotations` table
- [ ] `current_version` column exists on `rotations` table
- [ ] `rotation_versions` table exists
- [ ] Version trigger fires on script update
- [ ] Old version saved before update

### Storage
- [ ] `compiled-rotations` bucket exists
- [ ] Bucket is publicly readable
- [ ] CORS configured for portal domain

### Edge Function
- [ ] `compile-rotation` function deployed
- [ ] DB trigger calls function on insert/update
- [ ] Function generates valid JS module
- [ ] Function uploads to storage
- [ ] Function updates `compiled_url` in DB

### Lazy Loading
- [ ] `tryCast` fetches spell data if not cached
- [ ] Spell data cached in React Query / IndexedDB
- [ ] Second simulation run uses cached data (no fetches)

### Portal - Simulate
- [ ] Rotation picker shows "My Rotations" section
- [ ] Rotation picker shows "Community" section
- [ ] Rotation picker shows "Built-in" section
- [ ] Selecting DB rotation loads compiled module
- [ ] Simulation runs with DB rotation
- [ ] Auto-detect still works for built-in rotations

### Version History
- [ ] Version list shows in editor
- [ ] Can view any previous version
- [ ] Diff view works between versions
- [ ] Restore copies script to editor
- [ ] Commit message saves with version

### End-to-End
- [ ] Create new rotation in editor
- [ ] Save rotation
- [ ] Wait for compilation (check `compiled_at`)
- [ ] Go to simulate, select new rotation
- [ ] Run simulation successfully
- [ ] Edit rotation, save again
- [ ] Version history shows both versions
- [ ] Diff between v1 and v2 works
