# Rotation/Simulation Refactor Plan

Cut the crap, fix it properly.

---

## Phase 1: Database - specId Migration

**One migration, done.**

```sql
-- Add specId, backfill from chr_specialization, drop strings
ALTER TABLE rotations ADD COLUMN "specId" integer;

UPDATE rotations r SET "specId" = (
  SELECT cs."ID"
  FROM raw_dbc.chr_specialization cs
  JOIN raw_dbc.chr_classes cc ON cs."ClassID" = cc."ID"
  WHERE cs."Name_lang" = r.spec
    AND cc."Name_lang" = r.class
  LIMIT 1
);

ALTER TABLE rotations DROP COLUMN class;
ALTER TABLE rotations DROP COLUMN spec;
ALTER TABLE rotations ALTER COLUMN "specId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE rotations
  ADD CONSTRAINT rotations_specId_fkey
  FOREIGN KEY ("specId")
  REFERENCES raw_dbc.chr_specialization("ID");
```

**Regenerate types:**
```bash
pnpm supabase gen types typescript --project-id $PROJECT_ID > apps/portal/src/lib/supabase/database.types.ts
```

---

## Phase 2: Kill Mock Data

### 2a. Job History Card

**File:** `src/components/computing/cards/job-history-card.tsx`

- Delete lines 47-124 (mockJobs array)
- Change line 135 from `const displayJobs = mockJobs` to `const displayJobs = jobs`

### 2b. Performance Chart Card

**File:** `src/components/computing/cards/performance-chart-card.tsx`

Two options:
1. **Delete the card entirely** - it's fake data with no real metrics
2. **Wire to actual worker stats** - track iters/sec in workerSystemAtom

Recommend: Delete it. Add real metrics later when needed.

### 2c. Rotation Visualizer

**File:** `src/components/rotations/visualizer/mock-data.ts`

Delete the entire file. The visualizer tab should either:
1. Parse the actual rotation code and visualize it
2. Be hidden until implemented

For now: Hide the Visualize tab in rotation detail.

**File:** `src/components/rotations/detail/tabs/visualize-tab.tsx` - Delete
**File:** `src/components/rotations/detail/rotation-detail.tsx` - Remove Visualize tab from tabs array

---

## Phase 3: Fix /simulate Route

**File:** `src/components/simulate/quick-sim-content.tsx`

Replace the broken `useSimulation` with `useWorkerSimulation`:

```typescript
// Remove
import { useSimulation } from "@/hooks/use-simulation";
const { run, isRunning, result, error, resultId } = useSimulation();

// Add
import { useWorkerSimulation } from "@/hooks/rotations";
const { run: runWorkerSim, isRunning, stats, error } = useWorkerSimulation({
  onComplete: (stats) => {
    // Navigate to results or show inline
  },
});

// Fix handleRunSim
const handleRunSim = async () => {
  if (!selectedRotation?.currentVersion) return;

  await runWorkerSim({
    code: selectedRotation.script,
    name: selectedRotation.name,
    iterations: 100,
    duration: fightDuration,
  });
};
```

### Delete useSimulation hook

**File:** `src/hooks/use-simulation.ts` - Delete entirely

It's unused (the TODO was never implemented) and duplicates useWorkerSimulation.

---

## Phase 4: Consolidate State

### 4a. Kill Unused Atoms

**File:** `src/atoms/simulation/results.ts`

Delete these (unused):
- `simulationHistoryAtom`
- `addToHistoryAtom`
- `activeJobIdAtom`

Keep:
- `simulationResultAtom` - wire this up properly

### 4b. Fix Charts Data Flow

**Problem:** Charts read from `combatDataAtom` which is never written.

**Solution:** When simulation completes, populate `combatDataAtom` from job result.

**File:** `src/hooks/rotations/use-worker-simulation.ts`

After `completeJob()`, also set combat data:
```typescript
import { setCombatDataAtom } from "@/atoms/timeline";

// In onComplete
set(setCombatDataAtom, transformJobResultToCombatData(result));
```

### 4c. Add Progress Tracking to Worker Simulation

**File:** `src/hooks/rotations/use-worker-simulation.ts`

Actually use `updateSimProgressAtom` (currently imported but never called):
```typescript
// In the simulation loop, call:
updateProgress({
  jobId,
  current: completedIterations,
  total: iterations,
  eta: calculateEta(startTime, completedIterations, iterations),
});
```

---

## Phase 5: Fix Rotation Components for specId

### 5a. Update Types

**File:** `src/lib/supabase/types.ts`

Rotation type now has `specId: number` instead of `class/spec: string`.

Add a hook to get spec details:
```typescript
// src/hooks/use-spec.ts
export function useSpec(specId: number) {
  // Returns spec name, class name, icon from chr_specialization + chr_classes
}
```

### 5b. Fix Rotation Header

**File:** `src/components/rotations/detail/rotation-header.tsx:68`

```typescript
// Before
<SpecLabel specId={253} size="sm" showChevron showIcon />

// After
<SpecLabel specId={rotation.specId} size="sm" showChevron showIcon />
```

### 5c. Fix Metadata Setup

**File:** `src/components/rotations/editor/metadata-setup.tsx`

- Delete `WOW_CLASSES` and `CLASS_SPECS` constants (lines 40-62)
- Replace class/spec dropdowns with `SpecPicker` component
- Store `specId` in form state, not class/spec strings

```typescript
// Form schema
const metadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  specId: z.number().min(1, "Spec is required"),  // Changed
  description: z.string().optional(),
});

// In form, replace the two dropdowns with:
<SpecPicker onSpecSelect={(specId) => form.setValue("specId", specId)} />
```

### 5d. Fix Rotation Card

**File:** `src/components/rotations/rotation-card.tsx`

Replace string display with SpecLabel:
```typescript
<SpecLabel specId={rotation.specId} size="sm" showIcon />
```

### 5e. Fix Rotations Browser Filter

**File:** `src/components/rotations/rotations-content.tsx`

- Remove hardcoded class list
- Query `chr_classes` for filter options
- Filter by `specId` joined to `chr_specialization.ClassID`

### 5f. Fix Namespace Page

**File:** `src/components/rotations/namespace-page.tsx`

Add `isPublic` filter for non-owners:
```typescript
filters: [
  { field: "namespace", operator: "eq", value: namespace },
  { field: "deletedAt", operator: "null", value: true },
  // Add this for non-owners:
  ...(isOwnProfile ? [] : [{ field: "isPublic", operator: "eq", value: true }]),
],
```

---

## Phase 6: Cleanup Dead Code

### Delete These Files

```
src/hooks/use-simulation.ts                    # Replaced by use-worker-simulation
src/hooks/rotations/use-compiled-rotation.ts   # Never used
src/components/rotations/visualizer/mock-data.ts
src/components/rotations/detail/tabs/visualize-tab.tsx
src/lib/simulation/rotations/index.ts          # Built-in registry, never used
```

### Delete From atoms/simulation/results.ts

- `simulationHistoryAtom`
- `addToHistoryAtom`
- `activeJobIdAtom`

### Delete From atoms/charts/state.ts

- All `generateMock*` functions (lines 51-154)
- Remove fallback to mock in derived atoms

---

## Phase 7: Consolidate Status UI

### Create Shared Status Components

**File:** `src/components/computing/job-status.tsx`

```typescript
export const JOB_STATUS_COLORS = { ... };
export const JOB_STATUS_ICONS = { ... };
export function JobStatusBadge({ status }: { status: JobStatus }) { ... }
```

### Update Consumers

- `job-history-card.tsx` - import from shared
- `computing-drawer.tsx` - import from shared

---

## Execution Order

1. **Phase 1** - DB migration (do first, everything depends on it)
2. **Phase 5a-c** - Update types and core components for specId
3. **Phase 2** - Kill mock data
4. **Phase 3** - Fix /simulate
5. **Phase 4** - Consolidate state
6. **Phase 5d-f** - Remaining component updates
7. **Phase 6** - Delete dead code
8. **Phase 7** - Consolidate status UI

---

## Files Changed Summary

### Deleted
- `src/hooks/use-simulation.ts`
- `src/hooks/rotations/use-compiled-rotation.ts`
- `src/components/rotations/visualizer/mock-data.ts`
- `src/components/rotations/detail/tabs/visualize-tab.tsx`
- `src/lib/simulation/rotations/index.ts`

### Major Edits
- `src/components/computing/cards/job-history-card.tsx` - remove mock
- `src/components/computing/cards/performance-chart-card.tsx` - delete or fix
- `src/components/simulate/quick-sim-content.tsx` - use worker sim
- `src/components/rotations/editor/metadata-setup.tsx` - use SpecPicker
- `src/components/rotations/detail/rotation-header.tsx` - use rotation.specId
- `src/components/rotations/rotations-content.tsx` - dynamic class filter
- `src/components/rotations/namespace-page.tsx` - add isPublic filter
- `src/hooks/rotations/use-worker-simulation.ts` - add progress tracking
- `src/atoms/simulation/results.ts` - remove unused
- `src/atoms/charts/state.ts` - remove mock generators

### New
- `src/hooks/use-spec.ts` - get spec/class details from specId
- `src/components/computing/job-status.tsx` - shared status components
