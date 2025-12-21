# Phase 3 — Shared View Model Builder

## Goal
UI consumes a normalized **view model** instead of raw schema objects.

## Add in `wowlab-services`
Create `packages/wowlab-services/src/talents/view-model.ts`:
- `buildTalentViewModel(tree, selections, options)`
  - Inputs: tree, selections, width/height, search query, hero selection
  - Output: nodes/edges with positions + render state + totals

## Portal Hook
Add `apps/portal/src/hooks/use-talent-view-model.ts`:
- Thin wrapper calling `buildTalentViewModel` in `useMemo`.

## Exit Criteria
- UI components can render using the view model alone.
- Renderer no longer needs direct access to schema details.
