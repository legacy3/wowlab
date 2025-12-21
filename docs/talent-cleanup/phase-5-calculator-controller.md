# Phase 5 — Calculator Controller Hook

## Goal
Unify URL sync, decoding, and selection updates in one place.

## Add
`apps/portal/src/components/talents/calculator/controller.ts`:
- `useTalentCalculatorController`
  - owns `talents` query param
  - decodes talent string
  - derives initial selections
  - syncs selection changes back to URL

## Simplify
- `TalentCalculatorContent` becomes mostly layout + wiring.

## Exit Criteria
- URL sync logic no longer sprawls across the component.
- One controller controls encode/decode and selection propagation.
