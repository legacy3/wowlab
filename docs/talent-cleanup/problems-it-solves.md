# Problems This Cleanup Solves

This section documents the underlying issues that made the current talent code hard to work on.

## 1) Logic and rendering are tangled
- UI components decide game rules (point limits, prerequisites, selection costs).
- The biggest file (`TalentTree`) has to do everything, which makes reasoning fragile.

## 2) App owns domain rules that should be shared
- Rules and transforms live in `apps/portal`, but other apps/services could need them.
- This blocks reuse and guarantees future duplication.

## 3) Schema coupling makes changes expensive
- UI code depends directly on raw schema fields like `treeIndex`, `subTreeId`.
- Any schema change cascades into rendering, behavior, and state logic.

## 4) No normalized view model
- Rendering components operate on ad hoc derived data.
- There’s no single contract that defines what the UI actually needs.

## 5) Drift between main tree and preview
- The hover preview uses a different rendering path and different assumptions.
- It’s too easy for visuals and selection state to diverge.

## 6) State flow is fragmented
- URL talent string, decoded data, and selection state are synchronized manually.
- This makes subtle bugs easy and refactors slow.

## 7) Tests do not protect the hard parts
- Encoding rules, prerequisites, and point limits are untested.
- Confidence requires manual inspection every time.

## 8) Duplicate layout logic
- `computeTalentLayout` in `talent-utils.ts` returns only scale/offset.
- `useTalentLayout` hook in portal does similar math but returns full positions.
- Both need to stay in sync manually — easy to diverge.

## End Result (what changes)
- Domain rules become shared and reusable.
- UI becomes a pure renderer fed by a view model.
- Preview and main tree share one pipeline.
- Controller hooks own synchronization logic.
- Layout logic consolidated in view model builder.
- Core rules get targeted tests.
