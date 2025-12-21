# Phase 1 — Move Domain Logic to `wowlab-services`

## Goal
Remove talent rules/math from `apps/portal` and centralize in `packages/wowlab-services`.

## Integration with Existing Code
There's already talent code in services:
- `packages/wowlab-services/src/internal/data/transformer/talent.ts`
  - `transformTalentTree` — DBC-based tree assembly
  - `applyDecodedTalents` — applies decoded loadout to tree

New modules should follow the existing pattern and live alongside the transformer.

## New Modules
Create `packages/wowlab-services/src/internal/talents/` with:
- `selection.ts` — point calculations and limit checks
- `graph.ts` — edge index, prerequisite/dependent traversal
- `layout.ts` — position/scale calculations for rendering
- `index.ts` — barrel export

Add barrel export: `packages/wowlab-services/src/Talents.ts`

## Types to Move
From `apps/portal/src/components/talents/talent-utils.ts`:
```ts
interface TalentPointsSpent {
  class: number;
  spec: number;
  hero: number;
}

interface TalentEdgeIndex {
  parentsByNodeId: Map<number, Set<number>>;
  childrenByNodeId: Map<number, Set<number>>;
  neighborsByNodeId: Map<number, Set<number>>;
  edgeIdByPair: Map<string, number>;
}
```

## Functions to Move (with dependencies)

### Move Order (respect dependencies)

**Step 1: Graph utilities (standalone)**
- `buildTalentEdgeIndex` → `graph.ts`

**Step 2: Traversal (uses edge index)**
- `collectTalentPrerequisiteIds` → `graph.ts`
- `collectTalentDependentIds` → `graph.ts`

**Step 3: Point calculations (uses traversal)**
- `calculatePointsSpent` → `selection.ts`
- `calculateSelectionCost` → `selection.ts`

**Step 4: Limit checks (uses point calculations)**
- `wouldExceedPointLimit` → `selection.ts`
- `wouldExceedPointLimitWithPrereqs` → `selection.ts`

**Step 5: Visibility/filtering (graph helpers)**
- `computeVisibleNodes` → `graph.ts`
- `filterByHeroTree` → `graph.ts`
- `deriveSelectedHeroId` → `graph.ts`

**Step 6: Layout (standalone)**
- `computeTalentLayout` → `layout.ts`

## Functions to Keep in Portal
- `searchTalentNodes` — UI-specific, uses Fuse.js fuzzy search library

## Duplicate Code to Consolidate
- `computeTalentLayout` in `talent-utils.ts` and similar logic in `use-talent-layout.ts`
- Phase 3 will replace both with `buildTalentViewModel`; for now, move `computeTalentLayout` to services

## Update Imports
- Replace portal imports to use `@wowlab/services/Talents`
- Keep portal code behavior identical for now
- Portal's `talent-utils.ts` becomes a thin re-export or just `searchTalentNodes`

## Exit Criteria
- [ ] `talent-utils.ts` exports only `searchTalentNodes`
- [ ] All point/limit/traversal functions available from `@wowlab/services/Talents`
- [ ] Types `TalentPointsSpent` and `TalentEdgeIndex` exported from services
- [ ] No domain logic duplicated between portal and services
- [ ] Existing `transformTalentTree` and `applyDecodedTalents` unchanged
