# Phase 3 — Shared View Model Builder

## Goal

UI consumes a normalized **view model** instead of raw schema objects.

## Consolidates Duplicate Code

Currently layout logic exists in two places:

- `talent-utils.ts:computeTalentLayout()` — returns scale/offset only
- `use-talent-layout.ts` — full position calculation with node/edge positions

The view model builder replaces both with a single, complete implementation.

## Add in `wowlab-services`

Create `packages/wowlab-services/src/internal/talents/view-model.ts`

### View Model Types

```ts
export interface TalentNodePosition {
  id: number;
  x: number;
  y: number;
  node: {
    id: number;
    type: number;
    maxRanks: number;
    subTreeId: number;
    entries: Array<{
      id: number;
      name: string;
      description: string;
      iconFileName: string;
      spellId: number;
    }>;
  };
  selection?: {
    selected: boolean;
    ranksPurchased: number;
    choiceIndex?: number;
  };
  isHero: boolean;
}

export interface TalentEdgePosition {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromSelected: boolean;
  toSelected: boolean;
}

export interface TalentViewModel {
  // Positioned elements for rendering
  nodes: TalentNodePosition[];
  edges: TalentEdgePosition[];

  // Point totals and limits
  pointsSpent: TalentPointsSpent; // { class, spec, hero }
  pointLimits: TalentPointLimits; // { class, spec, hero }

  // Hero tree state
  selectedHeroId: number | null;
  availableHeroTrees: Array<{ id: number; name: string; iconFileName: string }>;

  // Layout metadata
  layout: {
    scale: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
}

export interface BuildTalentViewModelOptions {
  width: number;
  height: number;
  selectedHeroId?: number | null;
  padding?: number; // default: 20
}
```

### Builder Function

```ts
export function buildTalentViewModel(
  tree: TalentTree,
  selections: Map<number, DecodedTalentSelection>,
  options: BuildTalentViewModelOptions,
): TalentViewModel;
```

### Implementation Notes

1. Call `computeVisibleNodes` to filter nodes
2. If `options.selectedHeroId` is `undefined`, call `deriveSelectedHeroId(tree.subTrees, visibleNodes, selections)`
3. Call `filterByHeroTree` with the resolved `selectedHeroId`
4. Call `buildTalentEdgeIndex` for edge lookup
5. Calculate layout scale/offset (consolidate from both existing implementations)
6. Map nodes to positions with selection state
7. Map edges to positions with connection state
8. Call `calculatePointsSpent` for totals
9. Call `getTalentPointLimits(tree)` for limits
10. Return complete view model

## View Model Boundary Note

The view model is the **only** schema boundary the UI consumes. It may contain fields that originate from schema
(e.g. `type`, `subTreeId`), but UI components must only depend on the view model contract, not raw schemas.

## Portal Hook

Add `apps/portal/src/hooks/use-talent-view-model.ts`:

```ts
import { useMemo } from "react";
import {
  buildTalentViewModel,
  type TalentViewModel,
} from "@wowlab/services/Talents";

export function useTalentViewModel(
  tree: TalentTree | null,
  selections: Map<number, DecodedTalentSelection>,
  options: { width: number; height: number; selectedHeroId?: number | null },
): TalentViewModel | null {
  return useMemo(() => {
    if (!tree) return null;
    return buildTalentViewModel(tree, selections, options);
  }, [tree, selections, options.width, options.height, options.selectedHeroId]);
}
```

## Delete After Migration

- `apps/portal/src/hooks/use-talent-layout.ts` — replaced by `useTalentViewModel`
- `computeTalentLayout` in services — absorbed into `buildTalentViewModel`

## Exit Criteria

- [ ] `TalentViewModel` type exported from `@wowlab/services/Talents`
- [ ] `buildTalentViewModel` function exported from `@wowlab/services/Talents`
- [ ] `useTalentViewModel` hook in portal
- [ ] `use-talent-layout.ts` deleted
- [ ] UI components receive `TalentViewModel`, not raw `TalentTree`
- [ ] No direct imports from `@wowlab/core/Schemas` in rendering components
