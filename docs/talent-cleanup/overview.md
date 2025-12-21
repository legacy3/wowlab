# Talent Cleanup — Big Picture

Goal: make talent rendering maintainable by separating **domain rules** (shared) from **UI rendering** (portal).
No new package; use existing ones:
- `packages/wowlab-services` for talent domain rules + deterministic transforms
- `packages/wowlab-parsers` for talent string encoding/decoding
- `packages/wowlab-core` for shared types only if needed
- `apps/portal` for UI + interaction state

## What’s Good (keep and build on it)
- Konva tree rendering is performant and already layered (nodes/edges).
- `useTalentTree` and `useTalentTreeWithSelections` are good data boundaries.
- Calculator handles initial/invalid/loading/error/loaded states correctly.
- Preview hover link UX is valuable and should remain.

## Root Problems
- Domain logic is mixed into UI code (hard to reason about).
- App owns rules that should be shared.
- UI depends on raw schema details, making schema changes costly.
- No normalized view model for rendering.
- Two different render paths drift (main tree vs hover preview).
- URL sync and selection updates are coupled in page logic.
- No targeted tests for critical logic.

## Target Architecture
- **Domain rules and transforms** live in `wowlab-services`.
- **Talent string encoding/decoding** lives in `wowlab-parsers`.
- **UI components** in portal use a **single view model**.
- `TalentTree` becomes: Controller (state) + Renderer (pure view model).
- Preview uses the same view model pipeline as the main tree.

## Phased Plan (overview)
1) Move domain logic to `wowlab-services`.
2) Move encoding helpers to `wowlab-parsers`.
3) Add view‑model builder in `wowlab-services`.
4) Split `TalentTree` into controller + renderer.
5) Add calculator controller for URL sync + encoding.
6) Unify preview rendering using the shared view model.
7) Add minimal tests for core logic.

## Success Criteria
- No talent domain logic left in `apps/portal` (only rendering + interaction).
- UI components accept a normalized view model, not raw schema.
- Main tree + preview are consistent and share a single pipeline.
- Critical rules have unit tests.
