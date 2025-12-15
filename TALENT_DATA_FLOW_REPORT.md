# Talent Calculator Data Flow vs `talents.md` (apps/portal)

Date: 2025-12-15

## Observed data flow in portal

- Query param `talents` is decoded with `decodeTalentLoadout` (bit parser) to get `version/specId/treeHash/nodes`.
  - File: `apps/portal/src/components/lab/talent-calculator/talent-calculator-content.tsx`.
- Tree fetch: `useTalentTree` → `transformTalentTree` assembles a `TalentTree` directly from DBC tables: spec → class → `TraitTreeLoadout` (OrderIndex) → `TraitNode`/`TraitEdge` → `TraitNodeXTraitNodeEntry` → `TraitNodeEntry` → `TraitDefinition` + extracted text/icon.
  - Sorting: entries by `_Index` if present, else entry ID desc.
  - Hero subtrees filtered by spec-set conditions only for availability; all hero nodes remain in the tree.
  - File: `packages/wowlab-services/src/internal/data/transformer/talent.ts`.
- Rendering: `TalentTree` component builds selection state; enforces prerequisites only via edges (graph traversal).
  - File: `apps/portal/src/components/talents/talent-tree.tsx`.
- Encode back: `encodeSelectionsToTalentString` sorts nodes by ID, truncates to last selected, emits bits with header version/specId/treeHash from the decoded header (or version 1 + zero hash for header-only).
  - File: `apps/portal/src/components/lab/talent-calculator/talent-encoding.ts`.

## Deviations from `talents.md`

1. Missing trait_data prederivations
   - Portal model lacks `req_points`, `id_spec`/`id_spec_starter`, `tree_index`, and canonical `selection_index`; schema only holds id/maxRanks/pos/type/orderIndex.
   - Impact: cannot mirror SimC gating, starter grants, or per-tree currency that `trait_data_t` already encodes.

2. Gating/requirements not enforced
   - `TraitCond`/`TraitCost` are only used to filter hero subtrees; node availability and spend thresholds are never checked when toggling nodes.
   - UI allows selecting talents regardless of points spent, currency, or spec-set gates described in §7 of `talents.md`.

3. Edge semantics dropped
   - Edge `Type` is ignored; all edges are treated as hard prerequisites. Decorative edges (type 0) become blocking, diverging from §6 which gates only on `type=1`.

4. Choice ordering lacks SimC overrides
   - Sorting is `_Index` asc else entry ID desc. SimC’s `sort_node_entries` includes manual fixes (e.g., Voidweaver 117271/117298) that are not replicated, risking mismatched choice order and bitstream desync.

5. Header/version mismatch
   - New header-only strings force `version: 1` and zero hash. `talents.md` (SimC) uses current version (2) and the live `treeHash`. This yields different on-disk strings and may break interoperability.

6. Spec/hero validation and starters absent
   - `applyDecodedTalents` maps decoded nodes to sorted nodes without checking `id_spec`/`id_spec_starter`; starter grants and spec filtering from `trait_data_t` (§5/§7) are not applied, so invalid selections can appear valid.

## Data availability check & needed overrides

Legend:

- **Available (A)**: present in current portal model.
- **Derivable (D)**: available in fetched DBC rows but not exposed; needs pass-through/derivation.
- **Missing/Override (M)**: not fetched or needs hardcoded/extra source.

| Data element (from `trait_data_t` / talents.md)                                                                                             | Status | Notes / Needed action                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id_node`, `id_trait_node_entry`, `max_ranks`, `id_trait_definition`, `id_spell`, `name`, `description`, `iconFileName`, `type` (node_type) | A      | Stored in `TalentNode`/`TalentNodeEntry`.                                                                                                                                          |
| `selection_index` (ordering inside choice)                                                                                                  | D      | Derived during sorting but not stored; SimC overrides (e.g., Voidweaver 117271/117298) not applied. Need manual overrides + persist index if encoding wants it.                    |
| `row`, `col` (rounded layout)                                                                                                               | D      | Can be derived from `PosX/PosY` per talents.md §3/§8; currently not calculated or stored.                                                                                          |
| `tree_index` (CLASS/SPEC/HERO/SELECTION)                                                                                                    | M      | Not in model; would require mapping via `TraitCurrency.flags` / subtree detection.                                                                                                 |
| `id_class`, `id_spec`[], `id_spec_starter`[]                                                                                                | M      | Not exposed. Spec filtering only implicit via loadout fetch; starter grants absent. Need to surface spec arrays and starters from `TraitCond` type=1/2 and loadout data.           |
| `req_points` / gating currency                                                                                                              | D      | `TraitCond.req_points` and `TraitCond.id_trait_currency` are fetchable but ignored. Needs derivation and storage to enforce availability and encode bit ordering correctly.        |
| Edge `type` (prereq vs decorative)                                                                                                          | D      | DBC provides `TraitEdge.Type`; currently dropped. Should be kept to avoid over-gating.                                                                                             |
| Currency mapping (class/spec/hero)                                                                                                          | D      | DBC tables (`TraitTreeXTraitCurrency`, `TraitCurrency.flags`) available but unused; required for spend checks.                                                                     |
| Hero availability per spec                                                                                                                  | D      | Partially used to filter hero subtrees; not stored to enforce after selection.                                                                                                     |
| Starter nodes (`id_spec_starter`)                                                                                                           | D      | `TraitCond.type=2` present but not applied; should pre-mark ranksPurchased=1 and lock.                                                                                             |
| Tree hash (`treeHash`)                                                                                                                      | M      | Not sourced; header-only strings use zero hash. Need live hash (same length as SimC).                                                                                              |
| Bitstream ordering guarantee                                                                                                                | D      | Uses node ID sort; should mirror SimC `generate_tree_nodes` order (map by id, including selection nodes). Confirm loadout OrderIndex vs id ordering; persist explicit order field. |

**Summary of required overrides to match talents.md:**

- Add gating data: carry `TraitCond`/currency fields through to the client and enforce spend/spec gates.
- Preserve edge `Type` to distinguish decorative vs prerequisite.
- Implement SimC choice-order overrides and store `selection_index`.
- Derive and store `row/col`, `tree_index`, and spec/starter arrays.
- Populate real `treeHash` and current `version` in header generation.
- Apply starter grants/spec validation when mapping decoded nodes.

## File pointers

- Portal flow:
  - Decode/drive spec: `apps/portal/src/components/lab/talent-calculator/talent-calculator-content.tsx`
  - Encode: `apps/portal/src/components/lab/talent-calculator/talent-encoding.ts`
  - UI selection logic: `apps/portal/src/components/talents/talent-tree.tsx` and `talent-utils.ts`
- Data transform: `packages/wowlab-services/src/internal/data/transformer/talent.ts`
- Schema: `packages/wowlab-core/src/internal/schemas/talent/TalentTypes.ts`
- Parser/encoder: `packages/wowlab-parsers/src/internal/simc/talents.ts`
