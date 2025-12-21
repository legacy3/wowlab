# Talent Cleanup — Big Picture

Goal: make talent rendering maintainable by separating **domain rules** (shared) from **UI rendering** (portal).
No new package; use existing ones:
- `packages/wowlab-services` for talent domain rules + deterministic transforms
- `packages/wowlab-parsers` for talent string encoding/decoding
- `packages/wowlab-core` for shared types only if needed
- `apps/portal` for UI + interaction state

## Existing Code (build on this)

### Already in `wowlab-services`
- `packages/wowlab-services/src/internal/data/transformer/talent.ts`
  - `transformTalentTree` — fetches and assembles talent tree from DBC
  - `applyDecodedTalents` — applies decoded loadout to tree, returns selections
- Exported via `@wowlab/services/Data`

### Already in `wowlab-parsers`
- `packages/wowlab-parsers/src/internal/simc/talents.ts`
  - `encodeTalentLoadout` — encodes loadout to talent string
  - `decodeTalentLoadout` — decodes talent string to loadout
  - `DecodedTalentLoadout`, `DecodedTalentNode` types
- Exported via `@wowlab/parsers`

### In portal (to be refactored)
- `apps/portal/src/components/talents/talent-utils.ts` — domain logic mixed with UI
- `apps/portal/src/components/talents/calculator/talent-encoding.ts` — encoding helpers
- `apps/portal/src/hooks/use-talent-layout.ts` — layout calculation

## What's Good (keep and build on it)
- Konva tree rendering is performant and already layered (nodes/edges).
- `useTalentTree` and `useTalentTreeWithSelections` are good data boundaries.
- Calculator handles initial/invalid/loading/error/loaded states correctly.
- Preview hover link UX is valuable and should remain.
- Separate component files: `talent-node.tsx`, `talent-edge.tsx`, `talent-tooltip.tsx`, `talent-controls.tsx`.

## Root Problems
- Domain logic is mixed into UI code (hard to reason about).
- App owns rules that should be shared.
- UI depends on raw schema details, making schema changes costly.
- No normalized view model for rendering.
- Two different render paths drift (main tree vs hover preview).
- URL sync and selection updates are coupled in page logic.
- No targeted tests for critical logic.
- Duplicate layout logic in `computeTalentLayout` and `useTalentLayout`.

## Target Architecture
- **Domain rules and transforms** live in `wowlab-services/internal/talents/`.
- **Talent string encoding/decoding** lives in `wowlab-parsers`.
- **UI components** in portal use a **single view model**.
- `TalentTree` becomes: Controller (state) + Renderer (pure view model).
- Preview uses the same view model pipeline as the main tree.

## Phased Plan (overview)
1) Move domain logic to `wowlab-services` (integrate with existing transformer).
2) Move encoding helper to `wowlab-parsers` (only `encodeSelectionsToTalentString`).
3) Add view‑model builder in `wowlab-services`.
4) Split `TalentTree` into controller + renderer.
5) Add calculator controller for URL sync + encoding.
6) Unify preview rendering using the shared view model.
7) Add targeted tests for core logic.

## Success Criteria
- `talent-utils.ts` exports only `searchTalentNodes` (UI-specific, uses Fuse.js).
- UI components don't import from `@wowlab/core/Schemas` directly — only view model types.
- `TalentTreeRenderer` has no `useState` for data state — only DOM refs.
- Main tree + preview share `buildTalentViewModel` pipeline.
- Critical rules have unit tests with specific edge cases.
