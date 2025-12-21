# Phase 6 — Preview Rendering Unification

## Goal
Preview and main tree use the same view‑model pipeline to prevent drift.

## Changes
- `TalentHoverLink` uses `buildTalentViewModel` with smaller width/height.
- Add `TalentTreePreviewRenderer` that consumes the same view model but renders SVG.

## Exit Criteria
- Preview and main tree share the same data transformations.
- Visual differences are purely renderer‑level.
