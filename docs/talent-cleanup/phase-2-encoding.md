# Phase 2 — Move Encoding Helpers to `wowlab-parsers`

## Goal
Talent string encoding/decoding lives in the parsers package, not in the app.

## Already in Parsers
`packages/wowlab-parsers/src/internal/simc/talents.ts` already has:
- `encodeTalentLoadout` — low-level bit encoding
- `decodeTalentLoadout` — low-level bit decoding
- `DecodedTalentLoadout`, `DecodedTalentNode` types

## Current Portal Functions (analysis)

From `apps/portal/src/components/talents/calculator/talent-encoding.ts`:

| Function | What it does | Action |
|----------|--------------|--------|
| `createHeaderOnlyTalentString` | Calls `encodeTalentLoadout` with empty nodes | **Inline or keep** — trivial wrapper |
| `deriveInitialSelectionsFromDecoded` | Calls `applyDecodedTalents(...).selections` | **Delete** — use `applyDecodedTalents` directly |
| `encodeSelectionsToTalentString` | Maps selections to nodes array, calls `encodeTalentLoadout` | **Move** — rename to `encodeSelectionsToLoadoutString` |

## Function to Move

Only `encodeSelectionsToTalentString` has meaningful logic:
```ts
// This function:
// 1. Maps tree.allNodeIds to selection state
// 2. Determines partiallyRanked, choiceNode flags
// 3. Builds the nodes array for encodeTalentLoadout
```

Move to: `packages/wowlab-parsers/src/internal/simc/talents.ts`

**Rename to:** `encodeSelectionsToLoadoutString` (clearer name)

**Signature (minimal fields required):**
```ts
export function encodeSelectionsToLoadoutString(params: {
  tree: {
    allNodeIds: number[];
    nodes: Array<{
      id: number;
      type: number;
      maxRanks: number;
      entries: Array<{ id: number }>;
    }>;
  };
  decoded: DecodedTalentLoadout;
  selections: Map<number, { selected?: boolean; ranksPurchased?: number; choiceIndex?: number }>;
}): string
```

## Functions to Delete/Inline

### `deriveInitialSelectionsFromDecoded`
Current:
```ts
export function deriveInitialSelectionsFromDecoded(tree, decoded) {
  return applyDecodedTalents(tree, decoded).selections;
}
```
**Action:** Delete. Update call sites to use `applyDecodedTalents(tree, decoded).selections` directly.

### `createHeaderOnlyTalentString`
Current:
```ts
export function createHeaderOnlyTalentString(specId: number): string {
  return encodeTalentLoadout({ version: 1, specId, treeHash: new Uint8Array(16), nodes: [] });
}
```
**Action:** Either:
- Keep inline in portal (it's 3 lines), OR
- Add to parsers as a convenience function

## Update Imports
- Portal imports `encodeSelectionsToLoadoutString` from `@wowlab/parsers`
- Portal calls `applyDecodedTalents` directly (already imported from `@wowlab/services/Data`)

## Exit Criteria
- [ ] `encodeSelectionsToLoadoutString` exported from `@wowlab/parsers`
- [ ] `deriveInitialSelectionsFromDecoded` deleted from portal
- [ ] `talent-encoding.ts` either deleted or contains only `createHeaderOnlyTalentString`
- [ ] Calculator uses `applyDecodedTalents` directly for deriving selections
- [ ] No duplicate encoding logic between portal and parsers
