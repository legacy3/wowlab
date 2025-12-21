# Phase 1 — Move Domain Logic to `wowlab-services`

## Goal
Remove talent rules/math from `apps/portal` and centralize in `packages/wowlab-services`.

## New/Updated Modules
Create `packages/wowlab-services/src/talents/` with:
- `selection.ts`
- `graph.ts`
- `layout.ts`

## Move Functions (from portal)
From `apps/portal/src/components/talents/talent-utils.ts`:
- `calculatePointsSpent`
- `calculateSelectionCost`
- `wouldExceedPointLimit`
- `wouldExceedPointLimitWithPrereqs`
- `buildTalentEdgeIndex`
- `collectTalentDependentIds`
- `collectTalentPrerequisiteIds`
- `computeVisibleNodes`
- `filterByHeroTree`
- `deriveSelectedHeroId`
- `computeTalentLayout`

## Update Imports
- Replace portal imports to use `@wowlab/services` (new exports).
- Keep portal code behavior identical for now.

## Exit Criteria
- `apps/portal/src/components/talents/talent-utils.ts` is gone or reduced to UI-only helpers.
- Domain logic is available from `@wowlab/services`.
