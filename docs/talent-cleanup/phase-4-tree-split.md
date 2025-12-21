# Phase 4 — Split `TalentTree` into Controller + Renderer

## Goal
Make rendering pure and stateful logic explicit.

## Changes
- Create `TalentTreeController` to own:
  - selections state
  - hover/tooltip state
  - pan/zoom
  - search
  - export triggers
- Create `TalentTreeRenderer` that only receives:
  - view model data
  - event handlers

## File Structure Suggestion (portal)
```
apps/portal/src/components/talents/tree/
  controller.tsx
  renderer.tsx
  nodes.tsx
  edges.tsx
  tooltip.tsx
  controls.tsx
```

## Exit Criteria
- Renderer is stateless and view‑model driven.
- Controller is the single place for interaction state.
