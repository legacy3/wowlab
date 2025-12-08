# Portal Cleanup Plan

Generated: 2024-12-08

## Critical Issues

### 1. Dead Hooks - Never Used

| File                           | Status                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `src/hooks/use-sim-results.ts` | **NEVER IMPORTED** - `useSimResults` and `useSaveSimResult` exported but never used |

### 2. Mock Data in Production Atoms

| File                          | Problem                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `src/atoms/charts/state.ts`   | Generates random mock data at module load with `Math.random()` |
| `src/atoms/timeline/state.ts` | 683 lines of hardcoded Beast Mastery mock data with seeded RNG |

The charts and timeline visualize **fake data** regardless of actual simulation results. These atoms should be hydrated from real simulation job results, not generate mock data at module load.

### 3. Dead Component Directory - Workbench

| Location                                      | Status                     |
| --------------------------------------------- | -------------------------- |
| `src/components/rotations/editor/workbench/*` | **NEVER IMPORTED**         |
| `src/atoms/workbench/state.ts`                | Dead code supporting above |

`WorkbenchDashboard` is exported but no route imports it.

---

## High Priority - Dead Code

### Unused Feature Components

| Component       | Location                                  |
| --------------- | ----------------------------------------- |
| `SignOutButton` | `src/components/auth/sign-out-button.tsx` |
| `UserProfile`   | `src/components/account/user-profile.tsx` |
| `StatCard`      | `src/components/stats/stat-card.tsx`      |

### Dead Atoms

| File                             | Status                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/atoms/ui/sortable-state.ts` | All 5 exported atoms (`sectionOrderAtom`, `sectionVisibilityAtom`, `sectionsAtom`, `updateSectionOrderAtom`, `toggleSectionVisibilityAtom`) never imported anywhere |

### Dead Lib Files

| File                            | Status                      |
| ------------------------------- | --------------------------- |
| `src/lib/supabase-app-layer.ts` | Placeholder, never imported |

---

## DRY Violations

### 1. Identical Hook Patterns - useItem + useSpell

Both `src/hooks/use-item.ts` and `src/hooks/use-spell.ts` are 90% identical:

```typescript
// Both do exactly this:
const queryClient = useQueryClient();
const dataProvider = useDataProvider()();
return useQuery({
  queryKey: [TYPE, "transformed", id],
  queryFn: async () => {
    const layer = createPortalDbcLayer(queryClient, dataProvider);
    return Effect.runPromise(transformFn(id).pipe(Effect.provide(layer)));
  },
  enabled: id != null,
});
```

**Fix:** Create generic `usePortalDbcEntity<T>(type, transformFn, id)` hook.

### 2. Identical List Hooks

`useTopSims`, `useSpecRankings`, `useMostWantedItems` are all ~10 lines doing:

```typescript
return useList<T>({
  resource: "view_xxx",
  sorters: [...],
  pagination: { pageSize: 10 },
});
```

**Fix:** Create `useSupabaseView<T>(resource, sorters, pageSize)` factory.

### 3. Repeated atomWithStorage Boilerplate

8 separate files with identical pattern:

```typescript
export type CardId = "a" | "b" | "c";
const DEFAULT_ORDER: CardId[] = ["a", "b", "c"];
export const cardOrderAtom = atomWithStorage<CardId[]>("key", DEFAULT_ORDER);
```

**Files affected:**

- `src/atoms/editor/state.ts`
- `src/atoms/workbench/state.ts` (dead code anyway)
- `src/atoms/top-gear/state.ts`
- `src/atoms/charts/state.ts`
- `src/atoms/debug/simulation.ts`
- `src/atoms/user/settings-ui.ts`
- `src/atoms/data-inspector.ts`

**Fix:** Create `createPersistedOrderAtom<T extends string>(key: string, defaultOrder: T[])` utility in `src/atoms/utils/`.

---

## Hook Consolidation

### Timeline Hooks Should Move to /src/hooks/

These are generic and reusable but buried deep in the timeline component folder:

| Hook                     | Current Location                                  | Notes                             |
| ------------------------ | ------------------------------------------------- | --------------------------------- |
| `use-resize-observer.ts` | `src/components/simulate/results/timeline/hooks/` | Generic, reusable anywhere        |
| `use-zoom.ts`            | same                                              | Could be used by any Konva canvas |
| `use-drag-pan.ts`        | same                                              | Generic pan handling              |
| `use-fps-counter.ts`     | same                                              | Debug utility                     |
| `use-export.ts`          | same                                              | Canvas export                     |
| `use-scales.ts`          | same                                              | Timeline-specific, could stay     |
| `use-track-layout.ts`    | same                                              | Timeline-specific, could stay     |
| `use-lane-assignment.ts` | same                                              | Timeline-specific, could stay     |

**Recommendation:** Move generic hooks to `/src/hooks/canvas/` or `/src/hooks/visualization/`.

---

## Summary

| Category              | Items   | Action                               |
| --------------------- | ------- | ------------------------------------ |
| Dead hooks            | 1 file  | Delete `use-sim-results.ts`          |
| Mock data atoms       | 2 files | Replace with real data hydration     |
| Dead workbench        | 6 files | Delete entire `workbench/` directory |
| Unused components     | 3 files | Delete or wire up                    |
| Dead atoms            | 1 file  | Delete `sortable-state.ts`           |
| Dead lib files        | 1 file  | Delete `supabase-app-layer.ts`       |
| DRY hook violations   | 5 hooks | Consolidate into 2 factories         |
| DRY atom violations   | 7 files | Create factory helper                |
| Buried timeline hooks | 5 hooks | Move to `/src/hooks/`                |

---

## Recommended Cleanup Order

### Phase 1: Delete Dead Code (Low Risk)

```bash
# Dead hooks
rm src/hooks/use-sim-results.ts

# Dead workbench (entire directory)
rm -rf src/components/rotations/editor/workbench/
rm src/atoms/workbench/state.ts
rm src/atoms/workbench/index.ts

# Dead atoms
rm src/atoms/ui/sortable-state.ts

# Dead lib
rm src/lib/supabase-app-layer.ts

# Update barrel exports
# - Remove workbench from src/atoms/index.ts
# - Remove sortable-state from src/atoms/ui/index.ts
```

### Phase 2: Create Hook Factories

1. Create `src/hooks/use-portal-dbc-entity.ts`:

```typescript
export function usePortalDbcEntity<T>(
  type: string,
  transformFn: (id: number) => Effect.Effect<T, Error, DbcLayer>,
  id: number | null | undefined,
) {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  return useQuery({
    queryKey: [type, "transformed", id],
    queryFn: async (): Promise<T> => {
      if (id == null) throw new Error(`${type} ID is required`);
      const layer = createPortalDbcLayer(queryClient, dataProvider);
      return Effect.runPromise(transformFn(id).pipe(Effect.provide(layer)));
    },
    enabled: id != null,
  });
}
```

2. Refactor `use-item.ts` and `use-spell.ts` to use it.

3. Create `src/hooks/use-supabase-view.ts` for list hooks.

### Phase 3: Create Atom Utilities

Create `src/atoms/utils/create-persisted-order-atom.ts`:

```typescript
import { atomWithStorage } from "jotai/utils";

export function createPersistedOrderAtom<T extends string>(
  key: string,
  defaultOrder: readonly T[],
) {
  return atomWithStorage<readonly T[]>(key, defaultOrder);
}
```

### Phase 4: Move Timeline Hooks

Move these to `src/hooks/canvas/`:

- `use-resize-observer.ts`
- `use-zoom.ts`
- `use-drag-pan.ts`
- `use-fps-counter.ts`
- `use-export.ts`

### Phase 5: Fix Mock Data Architecture

This is the biggest change. The atoms in `charts/state.ts` and `timeline/state.ts` need to:

1. NOT generate data at module load
2. Accept data from simulation job results
3. Transform real simulation events into chart/timeline format

Current flow (broken):

```
Module loads -> Mock data generated -> Charts/Timeline show fake data
```

Target flow:

```
Simulation completes -> Job result stored -> Results page loads ->
Atoms hydrated with real data -> Charts/Timeline show real data
```

---

## Files to Delete

```
src/hooks/use-sim-results.ts
src/components/rotations/editor/workbench/workbench-dashboard.tsx
src/components/rotations/editor/workbench/index.ts
src/components/rotations/editor/workbench/cards/configuration-card.tsx
src/components/rotations/editor/workbench/cards/quick-actions-card.tsx
src/components/rotations/editor/workbench/cards/recent-experiments-card.tsx
src/components/rotations/editor/workbench/cards/variables-card.tsx
src/components/rotations/editor/workbench/cards/index.ts
src/atoms/workbench/state.ts
src/atoms/workbench/index.ts
src/atoms/ui/sortable-state.ts
src/lib/supabase-app-layer.ts
```

## Files to Review for Deletion or Wiring Up

```
src/components/auth/sign-out-button.tsx
src/components/account/user-profile.tsx
src/components/stats/stat-card.tsx
src/components/stats/index.ts
```
