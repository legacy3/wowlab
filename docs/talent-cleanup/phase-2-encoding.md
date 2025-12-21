# Phase 2 — Move Encoding Helpers to `wowlab-parsers`

## Goal
Talent string encoding/decoding lives in the parsers package, not in the app.

## Move Functions
From `apps/portal/src/components/talents/calculator/talent-encoding.ts` to:
- `packages/wowlab-parsers/src/talents/encoding.ts`

Functions:
- `createHeaderOnlyTalentString`
- `deriveInitialSelectionsFromDecoded`
- `encodeSelectionsToTalentString`

## Update Imports
- Update portal to import from `@wowlab/parsers`.

## Exit Criteria
- No encoding helpers in `apps/portal`.
- Parser exports used by calculator and any other consumers.
