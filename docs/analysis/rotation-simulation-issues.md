# Rotation, Simulation & Computing: Issues Analysis

> Deep analysis of inconsistencies, duplications, and mock data issues in `apps/portal`

## Executive Summary

The rotation/simulation/computing features have grown organically with multiple incomplete implementations, hardcoded mock data that bypasses real state, and inconsistent data flows between components. The main issues are:

1. **The /simulate route doesn't actually run simulations** - the button is a TODO
2. **Computing dashboard shows mock data, not real jobs** - hardcoded to ignore `jobsAtom`
3. **Rotation visualizer is hardcoded to Beast Mastery** - never reads actual rotation
4. **Two parallel simulation hooks** with different interfaces and capabilities
5. **Multiple sources of truth** for simulation results and job state
6. **Spec/class stored as strings** - should use specId with derived class/spec names

---

## Critical Issues

### 1. /simulate Route Never Runs Simulations

**File:** `src/components/simulate/quick-sim-content.tsx:55-61`

```typescript
const handleRunSim = async () => {
  if (!selectedRotation?.currentVersion) {
    return;
  }
  // TODO: Load compiled rotation module and run simulation
  // await run(compiledRotation.run, fightDuration);
};
```

**Impact:** The "Run Simulation" button does absolutely nothing. Users can set up their character, select a rotation, configure fight settings - but clicking Run does nothing.

**Contrast:** The editor's Test button works correctly using `useWorkerSimulation`:
- `src/components/rotations/editor/rotation-editor.tsx:152-166`

---

### 2. Job History Card Uses Hardcoded Mock Data

**File:** `src/components/computing/cards/job-history-card.tsx`

**Lines 48-124:** Hardcoded mock jobs array with Beast Mastery/Marksmanship examples

**Line 135:** Forces mock data, ignoring real jobs:
```typescript
const displayJobs = mockJobs;  // Always uses mock, ignores jobsAtom!
```

**Impact:** The computing dashboard's job history table never shows actual simulation results. It always displays 4 hardcoded jobs regardless of what simulations have been run.

---

### 3. Rotation Visualizer Hardcoded to Beast Mastery

**File:** `src/components/rotations/visualizer/mock-data.ts:62-127`

- `MOCK_SPELLS`: 8 hardcoded Beast Mastery Hunter spells
- `MOCK_PRIORITY_LIST`: Hardcoded priority entries
- `MOCK_PLAYBACK`: Pre-generated playback frames

**Usage in visualize tab:**
- `src/components/rotations/detail/tabs/visualize-tab.tsx:13` imports and uses mock data

**Impact:** When viewing ANY rotation's "Visualize" tab, you see the same Beast Mastery Hunter rotation regardless of what class/spec the rotation actually is.

---

### 4. Performance Chart Shows Random Mock Data

**File:** `src/components/computing/cards/performance-chart-card.tsx:20-24`

```typescript
const mockThroughputData = Array.from({ length: 30 }, (_, i) => ({
  time: i,
  itersPerSec: Math.floor(800 + Math.random() * 400 + Math.sin(i / 3) * 200),
  memoryMB: Math.floor(120 + Math.random() * 80 + i * 2 + Math.sin(i / 3) * 20),
}));

const data = mockThroughputData;  // Never uses real metrics
```

**Impact:** Performance metrics are entirely fabricated with random numbers.

---

## Duplicate Structures

### Simulation Hooks

Two hooks with overlapping functionality:

| Feature | `useSimulation` | `useWorkerSimulation` |
|---------|-----------------|----------------------|
| **File** | `src/hooks/use-simulation.ts` | `src/hooks/rotations/use-worker-simulation.ts` |
| **Used By** | `/simulate` route (broken) | Editor test button |
| **Execution** | Single runtime in main thread | Worker pool with batching |
| **Input** | `RotationDefinition` object | Raw rotation code string |
| **Output** | `SimulationResult` | `SimulationStats` |
| **Progress** | Uses `updateSimProgressAtom` | **Never updates progress** |
| **Worker Stats** | Doesn't track | Updates `workerSystemAtom` |

Both hooks duplicate:
- Job creation via `createSimJobAtom`
- Phase updates via `updateSimPhaseAtom`
- Completion/failure handling
- Computing drawer integration

### Status UI Components

Duplicate status icon/color mappings:

- `src/components/computing/cards/job-history-card.tsx:31-45` - `STATUS_COLORS` + `STATUS_ICONS`
- `src/components/layout/computing-drawer.tsx:45-51` - `statusIcon` object

---

## State Management Issues

### Multiple Sources of Truth for Results

| Storage | Location | Updated By | Used By |
|---------|----------|------------|---------|
| Hook local state | `use-simulation.ts:39` | `useSimulation` | Quick sim display |
| `jobsAtom.result` | `atoms/computing/state.ts` | Both hooks | Computing drawer, dashboard |
| `simulationResultAtom` | `atoms/simulation/results.ts:12` | **Never** | Charts, result tabs |
| `simulationHistoryAtom` | `atoms/simulation/results.ts:73` | **Never** | Nothing (unused) |

**Result:** Charts and result tabs read from `simulationResultAtom` which is never populated by either simulation hook. They fall back to mock data generators.

### Progress Tracking Inconsistencies

**`useSimulation`:**
- Creates job with `totalIterations = duration * 10` (ticks)
- Updates progress with `current/total` in **seconds**
- Units mismatch: job shows "60 / 600" instead of proper percentage

**`useWorkerSimulation`:**
- Creates job with `totalIterations = iterations`
- **Never calls `updateSimProgressAtom`** (imported but unused at line 9)
- Progress stays at 0% throughout execution

### Worker System Stats Only Updated by Worker Simulation

- `workerSystemAtom` tracks total simulations/iterations
- Only `useWorkerSimulation` calls `updateWorkerSystem` (line 195)
- Running via `/simulate` (if it worked) wouldn't update these stats
- Computing dashboard cards show incomplete totals

---

## Visibility/Filter Inconsistencies

### Rotation Listing Filters

| View | Location | Filter | Effect |
|------|----------|--------|--------|
| Browse | `rotations-content.tsx:52` | `isPublic: true` | Shows only public |
| User Profile | `namespace-page.tsx:66-69` | `namespace` + `deletedAt` | **No isPublic filter** - shows private rotations to visitors |
| Account | `account/(overview)/page.tsx` | User's own | Shows all (correct) |

**Issue:** Namespace page can expose private rotations to anyone viewing a user's profile.

---

## Dead Code / Unused Exports

### Never Referenced

| Item | Location | Notes |
|------|----------|-------|
| `useCompiledRotation` | `hooks/rotations/use-compiled-rotation.ts:35` | Not exported, commented out in index |
| Built-in rotation registry | `lib/simulation/rotations/index.ts` | No references found |
| `simulationHistoryAtom` | `atoms/simulation/results.ts:73` | Defined but never used |
| `addToHistoryAtom` | `atoms/simulation/results.ts:90` | Defined but never used |
| `activeJobIdAtom` | `atoms/simulation/results.ts:17` | Only set, never read |

### Imported but Unused

- `updateSimProgressAtom` in `use-worker-simulation.ts:9` - imported, never called

---

## Charts Mock Data Fallback

**File:** `src/atoms/charts/state.ts`

All chart atoms follow this pattern:
```typescript
export const dpsDataAtom = atom<DpsDataPoint[]>((get) => {
  const combatData = get(combatDataAtom);

  if (combatData && combatData.damage.length > 0) {
    return transformToDpsChartData(combatData);
  }

  // Fallback to mock data - always triggered since combatData never populated
  return generateMockDpsData();
});
```

Mock generators at lines 51-154 produce randomized Beast Mastery data.

**Root Cause:** `combatDataAtom` is never populated because:
1. `/simulate` doesn't run simulations (TODO)
2. `useWorkerSimulation` stores in `jobsAtom.result` not `combatDataAtom`

---

## Results Page Linking Mismatch

**Computing Drawer:** `src/components/layout/computing-drawer.tsx:106`
```typescript
<Link href={`/simulate/results/${job.id}`}>View Results</Link>
```

**Quick Sim Result Card:** `src/components/simulate/simulation-result-card.tsx:24`
```typescript
href={`/simulate/results/${resultId}`}
```

**Potential Issue:** If `resultId` becomes a Supabase record ID (for persistence/sharing), it won't match `job.id` used by the drawer. Results page currently looks up `jobsAtom` by `job.id` so Supabase-based results wouldn't be found.

---

## Data Flow Diagram

```
                         ┌──────────────────────────────────────┐
                         │         /simulate route              │
                         │  ┌───────────────────────────────┐   │
                         │  │ QuickSimContent               │   │
                         │  │   handleRunSim() → TODO!      │   │
                         │  │   useSimulation() → unused    │   │
                         │  └───────────────────────────────┘   │
                         └──────────────────────────────────────┘
                                            ↓ (broken)
                         ┌──────────────────────────────────────┐
                         │         Rotation Editor              │
                         │  ┌───────────────────────────────┐   │
                         │  │ handleTest()                  │   │
                         │  │   useWorkerSimulation() ✓     │   │
                         │  └───────────────────────────────┘   │
                         └──────────────────────────────────────┘
                                            ↓ (works)
┌─────────────────┐     ┌──────────────────────────────────────┐
│   jobsAtom      │ ←── │         Worker Pool                  │
│   (real data)   │     │   runSimulationsPromise()            │
└─────────────────┘     └──────────────────────────────────────┘
         │
         ├──────────→ Computing Drawer ✓ (uses jobsAtom)
         │
         └──────────→ Job History Card ✗ (ignores, uses mockJobs)

┌─────────────────────┐
│ simulationResultAtom│ ← Never written to
│ combatDataAtom      │ ← Never written to
└─────────────────────┘
         │
         └──────────→ Charts, Result Tabs → Fall back to mock data
```

---

## Affected Routes

| Route | Status | Issues |
|-------|--------|--------|
| `/simulate` | Broken | Run button is TODO, never executes |
| `/simulate/results/[id]` | Partial | Works for jobs from editor, charts show mock |
| `/rotations` | Works | Browser functions correctly |
| `/rotations/[id]` | Partial | Visualize tab is hardcoded BM Hunter |
| `/rotations/editor` | Works | Test button functions correctly |
| `/computing` | Misleading | Job history shows mock data, performance chart is random |
| `/users/[handle]` | Bug | May expose private rotations |

---

## Summary of Required Changes

### Must Fix (Critical)

1. **Implement `/simulate` handleRunSim** or connect to worker simulation
2. **Replace mock data in job-history-card** - use `jobsAtom` instead of `mockJobs`
3. **Fix namespace page filter** - add `isPublic` filter for non-owners
4. **Fix rotation header specId** - currently hardcoded to 253 (Beast Mastery)

### Should Fix (Data Integrity)

5. **Migrate rotations to use specId** - replace class/spec strings with specId FK
6. **Unify simulation hooks** - single interface for both paths
7. **Connect simulation results to charts** - populate `combatDataAtom`
8. **Add progress tracking to worker simulation** - use `updateSimProgressAtom`
9. **Replace visualizer mock data** - parse actual rotation code

### Nice to Have (Cleanup)

10. Remove dead code (`useCompiledRotation`, unused atoms)
11. Consolidate status UI components
12. Replace performance chart mock data with real metrics
13. Standardize result ID linking strategy
14. Replace hardcoded class/spec lists with database queries

---

## Spec/Class Data Inconsistencies

### Current State: Strings Everywhere

The `rotations` table stores class and spec as **text strings**:

```sql
-- rotations table schema
class    text NOT NULL   -- "Hunter", "Mage", etc.
spec     text NOT NULL   -- "Beast Mastery", "Fire", etc.
```

Meanwhile, there's a proper `chr_specialization` table in `raw_dbc` with numeric IDs:

| ID | Name_lang | ClassID |
|----|-----------|---------|
| 253 | Beast Mastery | 3 |
| 254 | Marksmanship | 3 |
| 255 | Survival | 3 |
| 62 | Arcane | 8 |
| 63 | Fire | 8 |
| ... | ... | ... |

### The Problem

1. **rotations table** stores redundant `class` + `spec` strings
2. **No specId** stored - can't join to game data tables
3. **Hardcoded mappings** in multiple places instead of database lookups
4. **Inconsistent display** - some components use specId, rotation pages use strings

### Specific Issues

#### 1. Rotation Header Hardcodes specId=253

**File:** `src/components/rotations/detail/rotation-header.tsx:68`

```typescript
<SpecLabel specId={253} size="sm" showChevron showIcon />
```

This always shows "Beast Mastery Hunter" regardless of the actual rotation's spec. The rotation has `class` and `spec` string fields but no `specId` to pass to `SpecLabel`.

#### 2. Metadata Setup Has Hardcoded Class/Spec Lists

**File:** `src/components/rotations/editor/metadata-setup.tsx:40-62`

```typescript
const WOW_CLASSES = [
  "Druid", "Hunter", "Mage", "Paladin", "Priest",
  "Rogue", "Shaman", "Warlock", "Warrior",
] as const;

const CLASS_SPECS: Record<string, string[]> = {
  Druid: ["Balance", "Feral", "Restoration"],
  Hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  // ...
};
```

Issues:
- Missing Death Knight, Monk, Demon Hunter, Evoker
- Missing Guardian druid (only Balance, Feral, Restoration)
- Rogue has "Combat" instead of "Outlaw" (outdated)
- No connection to actual game data

#### 3. SpecPicker Returns specId But It's Discarded

**File:** `src/components/ui/spec-picker.tsx:11`

```typescript
onSpecSelect: (specId: number, className: string, specName: string) => void;
```

The picker correctly returns `specId` from `chr_specialization`, but:
- Metadata setup doesn't use this component
- If it did, it would discard `specId` and only store the strings

#### 4. SpecLabel Requires specId (Which Rotations Don't Have)

**File:** `src/components/ui/spec-label.tsx:26`

```typescript
interface SpecLabelProps {
  specId: number;  // Required!
  // ...
}
```

To display a rotation's spec properly, you'd need to:
1. Take the rotation's `class` + `spec` strings
2. Query `chr_specialization` to find matching ID
3. Pass that ID to SpecLabel

This reverse lookup is fragile and shouldn't be necessary.

#### 5. Rotations Browser Filter Uses Hardcoded Class List

**File:** `src/components/rotations/rotations-content.tsx:138-149`

```typescript
<SelectContent>
  <SelectItem value="all">All Classes</SelectItem>
  <SelectItem value="Priest">Priest</SelectItem>
  <SelectItem value="Mage">Mage</SelectItem>
  {/* ... hardcoded list, missing several classes */}
</SelectContent>
```

### Recommended Fix

**Store `specId` instead of `class` + `spec` strings:**

```sql
-- Migration
ALTER TABLE rotations ADD COLUMN "specId" integer;
UPDATE rotations SET "specId" = (
  SELECT "ID" FROM raw_dbc.chr_specialization
  WHERE "Name_lang" = rotations.spec
  LIMIT 1
);
ALTER TABLE rotations DROP COLUMN class;
ALTER TABLE rotations DROP COLUMN spec;
ALTER TABLE rotations ALTER COLUMN "specId" SET NOT NULL;
```

Benefits:
- Single source of truth (specId)
- Class is derivable: `chr_specialization.ClassID` → `chr_classes`
- Spec name is derivable: `chr_specialization.Name_lang`
- Icon is derivable: `chr_specialization.SpellIconFileID` → `manifest_interface_data`
- Consistent with talents system (which already uses specId)
- No hardcoded lists to maintain

### Components That Would Need Updates

| Component | Current | After |
|-----------|---------|-------|
| `metadata-setup.tsx` | Hardcoded WOW_CLASSES, CLASS_SPECS | Use `SpecPicker` component |
| `rotation-header.tsx` | Hardcoded `specId={253}` | Use `rotation.specId` |
| `rotations-content.tsx` | Hardcoded class filter | Query `chr_classes` |
| `rotation-card.tsx` | Displays `rotation.class`/`rotation.spec` | Use `SpecLabel specId={rotation.specId}` |
| `namespace-page.tsx` | Groups by class string | Group by ClassID |

---

## Appendix: File Locations

### Components
- `src/components/computing/cards/job-history-card.tsx`
- `src/components/computing/cards/performance-chart-card.tsx`
- `src/components/computing/computing-content.tsx`
- `src/components/layout/computing-drawer.tsx`
- `src/components/rotations/editor/rotation-editor.tsx`
- `src/components/rotations/visualizer/mock-data.ts`
- `src/components/rotations/detail/tabs/visualize-tab.tsx`
- `src/components/rotations/namespace-page.tsx`
- `src/components/rotations/rotations-content.tsx`
- `src/components/simulate/quick-sim-content.tsx`
- `src/components/simulate/simulation-result-card.tsx`

### Hooks
- `src/hooks/use-simulation.ts`
- `src/hooks/rotations/use-worker-simulation.ts`
- `src/hooks/rotations/use-compiled-rotation.ts`

### State (Atoms)
- `src/atoms/computing/state.ts`
- `src/atoms/simulation/job.ts`
- `src/atoms/simulation/results.ts`
- `src/atoms/charts/state.ts`
- `src/atoms/timeline/index.ts` (combatDataAtom)

### Routes
- `src/app/simulate/(index)/page.tsx`
- `src/app/simulate/results/[id]/page.tsx`
- `src/app/rotations/(browse)/page.tsx`
- `src/app/rotations/[id]/page.tsx`
- `src/app/rotations/editor/(create)/page.tsx`
- `src/app/rotations/editor/(edit)/[id]/page.tsx`
- `src/app/computing/page.tsx`
- `src/app/users/[handle]/page.tsx`
