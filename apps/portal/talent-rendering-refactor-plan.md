# Talent Rendering Refactor Plan (no new package)

This plan uses existing packages only:

- **`packages/wowlab-services`** for talent domain rules + transforms
- **`packages/wowlab-parsers`** for encoding/decoding talent strings
- **`packages/wowlab-core`** for shared types (if needed)
- **`apps/portal`** for UI + interaction state

## What’s Good (keep and build on it)

- `TalentTree` rendering pipeline is performant (memoized layers, Konva, throttled tooltip updates).
- `useTalentTree` + `useTalentTreeWithSelections` is a clean data loading abstraction.
- Calculator flow handles initial/invalid/loading/error/loaded states correctly.
- `talent-encoding.ts` and `talent-utils.ts` centralize critical logic (even if currently mixed).
- `TalentHoverLink` is a good, lightweight read‑only preview.

## Core Problems (why it was detective work)

1. **Rendering + domain logic is interleaved** in `TalentTree` and `talent-utils.ts`.
2. **Portal vs library boundaries are muddy**: domain rules live in the app.
3. **UI tightly coupled to raw schemas** (`treeIndex`, `subTreeId`, raw selections).
4. **No view‑model layer**: renderer handles state + data shaping ad hoc.
5. **Multiple rendering paths drift** (`TalentTree` vs `TalentHoverLink`).
6. **Fragmented state flow** in `TalentCalculatorContent` for URL sync and selection updates.
7. **No focused tests** for the hard logic (limits, prerequisites, encoding).

## Where Things Should Live (with current packages)

### `packages/wowlab-services`

Move **all domain rules and deterministic transforms** here:

- Prerequisite/dependency traversal
- Point limit checks
- Selection cost math
- Visibility filtering
- Layout math that is independent of UI

### `packages/wowlab-parsers`

Move **talent string encoding/decoding helpers** here:

- `encodeSelectionsToLoadoutString`

### `apps/portal`

Keep **UI + interaction state** here:

- Konva renderers, tooltips, controls, export actions
- Pan/zoom, hover, search, zen mode
- URL sync controller for the calculator

## Refactor Plan (incremental)

### Phase 1: Move domain logic to `wowlab-services`

**Goal:** `apps/portal` stops owning rules/math.

Create or extend a module like:

- `packages/wowlab-services/src/talents/`
  - `selection.ts`
  - `graph.ts`
  - `layout.ts`

Move from `apps/portal/src/components/talents/talent-utils.ts`:

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

Then update portal imports to use `@wowlab/services`.

### Phase 2: Move encoding helpers to `wowlab-parsers`

**Goal:** Talent strings are parser‑owned.

Move `encodeSelectionsToLoadoutString` from the portal into:

- `packages/wowlab-parsers/src/internal/simc/talents.ts`

Expose from `@wowlab/parsers` and update portal imports.

### Phase 3: Introduce a view‑model builder in `wowlab-services`

**Goal:** UI consumes a normalized render model.

Add `packages/wowlab-services/src/talents/view-model.ts`:

- `buildTalentViewModel(tree, selections, options)`
  - returns nodes, edges, totals, visibility, layout

Portal adds a tiny hook:

- `apps/portal/src/hooks/use-talent-view-model.ts`
  - calls `buildTalentViewModel` + `useMemo`

### Phase 4: Split `TalentTree` into controller + renderer

**Goal:** Renderer becomes “dumb”.

- `TalentTreeController` owns selection state, pan/zoom, search, hover.
- `TalentTreeRenderer` takes `viewModel` + callbacks only.

### Phase 5: Consolidate calculator state

**Goal:** One controller owns URL sync + encoding.

Create `apps/portal/src/components/talents/calculator/controller.ts`:

- `useTalentCalculatorController` handles:
  - URL `talents` param
  - decode/encode
  - initial selections
  - sync from tree → URL

`TalentCalculatorContent` becomes mostly layout + wiring.

### Phase 6: Unify preview rendering

**Goal:** `TalentHoverLink` uses the same view‑model pipeline.

- Reuse `buildTalentViewModel` with a smaller width/height
- `TalentTreePreviewRenderer` consumes the same view model

### Phase 7: Tests (minimal, but critical)

Add unit tests in `packages/wowlab-services` and `packages/wowlab-parsers`:

- encoding/decoding idempotence
- prerequisite traversal
- point limit enforcement
- visibility filtering
- layout bounds

## Specific Issues (by file)

- `apps/portal/src/components/talents/talent-tree.tsx`
  - Too many responsibilities: selection, point rules, layout, search, tooltip, export.
- `apps/portal/src/components/talents/talent-utils.ts`
  - Mixes domain and rendering logic; should be moved/split.
- `apps/portal/src/components/talents/calculator/talent-encoding.ts`
  - Pure domain logic; should be in `@wowlab/parsers`.
- `apps/portal/src/hooks/use-talent-layout.ts`
  - Should be replaced by `useTalentViewModel`.
- `apps/portal/src/components/talents/talent-hover-link.tsx`
  - Custom render path should use shared view model to prevent drift.
- `apps/portal/src/components/talents/calculator/talent-calculator-content.tsx`
  - Overloaded with URL sync logic; move to controller hook.

## Refactor Order (safe and incremental)

1. Move domain logic into `wowlab-services`.
2. Move encoding helpers into `wowlab-parsers`.
3. Introduce view‑model builder in `wowlab-services`.
4. Split `TalentTree` into controller + renderer.
5. Add calculator controller hook.
6. Update hover preview to use shared view model.
7. Add core tests.
