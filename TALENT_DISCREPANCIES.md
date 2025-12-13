# Talent Decoding Discrepancies: wowlab vs SimC

## Screenshots Compared
- wowlab: https://fs.rce.re/UfsdMFoW4urNYRd.png
- Reference (Wowhead): https://fs.rce.re/JfJzQCKggN4oAzQ.png

---

## VISUAL DIFFERENCES OBSERVED

### 1. ~20 BASELINE SPELLS ARE MISSING (ROOT CAUSE)
- **Reference**: Shows ALL nodes including baseline/granted spells
- **wowlab**: Missing ~20 baseline spells entirely
- **Impact**: This breaks the ENTIRE decoding because SimC iterates ALL nodes (including baseline) in ID order. If wowlab is missing nodes, the bitstream index is completely wrong for every node after the first missing one.

**WHERE THE FILTERING HAPPENS:**

File: `apps/portal/src/components/talents/talent-utils.ts` line 23:
```typescript
if (n.orderIndex >= 0 || n.subTreeId > 0) {
```

This excludes nodes with `orderIndex = -1` (baseline nodes not in loadout entries).

**Status:** FIXED - removed orderIndex filter, now includes all nodes

File: `packages/wowlab-services/src/internal/data/transformer/talent.ts` line 372:
```typescript
orderIndex: orderIndexMap.get(node.ID) ?? -1,
```

Nodes not in `TraitTreeLoadoutEntry` get `orderIndex = -1` and are then filtered out.

**SimC behavior**: Iterates ALL nodes from `trait_data_t::data()` including baseline nodes. The bitstream contains a record for EVERY node in the tree, not just "selectable" ones.

### 1b. HERO SUBTREE NODES BEING FILTERED OUT

File: `packages/wowlab-services/src/internal/data/transformer/talent.ts` line 193:
```typescript
const filteredNodes = treeNodes.filter(
  (n) =>
    n.TraitSubTreeID === 0 ||
    availableSubTreeIds.includes(n.TraitSubTreeID),
);
```

This filters out hero subtree nodes that aren't "available" to the spec. But SimC includes ALL hero subtrees' nodes - the bitstream has bits for BOTH hero trees, not just the selected one. The SELECTION node determines which hero tree is active.

**Status:** FIXED - removed hero subtree filter, now includes all nodes

### 1c. SPEC TREE SHOWING WRONG SPEC'S TALENTS

**Symptom:** BM Hunter shows Marksman talents, Resto Shaman shows Elemental talents in the spec tree.

**Status:** INVESTIGATING - The icons come from TraitNodeEntry -> TraitDefinition -> SpellID. Need to verify if the entry/definition data is correct for the spec's tree.

### 1d. HERO TREE ICONS NOT LOADING

**Symptom:** Hero tree selector at top shows "? ? ?" instead of icons.

**Location:** `talent.ts` lines 382-384 - tries to find firstHeroNode and use its entry's icon.

**Status:** INVESTIGATING - Either hero nodes not found in `nodes` array, or entries are empty.

### 2. Layout Structure
- **Reference**: 3 separate panels - "Hunter" (class), "Hero" (Dark Ranger), "Beast Mastery" (spec)
- **wowlab**: 2 combined areas - class tree left, hero tree right
- **Issue**: Where is the spec tree in wowlab? It appears missing or merged incorrectly

### 3. Selection Pattern Mismatch
- The pattern of selected talents in wowlab does NOT match the reference
- Class tree selections appear in different positions
- Number of selected nodes appears different
- THIS IS CAUSED BY MISSING BASELINE NODES - indexes are all off

### 4. Hero Tree
- **Reference**: Clearly labeled "Dark Ranger" with dinosaur artwork
- **wowlab**: Shows hero tree but no label, unclear if correct hero tree is shown

### 5. Spec Tree Missing?
- **Reference**: Has dedicated "Beast Mastery" panel on the right with its own talent selections
- **wowlab**: No visible separate spec tree panel

### 6. Connection Lines
- **Reference**: Clear visible connection lines between talent nodes
- **wowlab**: Connection lines less visible or different style

### 7. Choice Nodes
- Need to verify if choice node selections are displaying correctly
- Reference shows specific choices made, wowlab may not be showing them

---

## Reference Files
- SimC: `engine/player/player.cpp` lines 2770-2860
- wowlab: `packages/wowlab-parsers/src/internal/simc/talents.ts`
- wowlab: `packages/wowlab-services/src/internal/data/transformer/talent.ts`
- wowlab: `apps/portal/src/components/talents/talent-node.tsx`

---

## CRITICAL BUG #1: `hasChoice` bit read outside `purchased` block

**SimC algorithm (CORRECT):**
```
for each node:
  read selected (1 bit)
  if !selected: next node

  read purchased (1 bit)
  if !purchased:
    rank = 1 (granted)
    // NO MORE BITS READ - go to next node

  if purchased:
    read partiallyRanked (1 bit)
    if partiallyRanked:
      read rank (6 bits)
    else:
      rank = maxRanks

    read hasChoice (1 bit)      // <-- INSIDE purchased block
    if hasChoice:
      read choiceIndex (2 bits)
```

**wowlab code (BROKEN):**
```typescript
const purchased = reader.getBits(1) === 1;

if (purchased) {
  partiallyRanked = reader.getBits(1) === 1;
  if (partiallyRanked) {
    ranksPurchased = reader.getBits(6);
  }
}

// BUG: This is OUTSIDE the if(purchased) block!
const choiceNode = reader.getBits(1) === 1;  // WRONG POSITION!
if (choiceNode) {
  choiceIndex = reader.getBits(2);
}
```

**Impact:** For every "granted" (non-purchased) node, the code reads 1-3 extra bits that shouldn't be read. This completely desynchronizes the bitstream, causing ALL subsequent nodes to decode incorrectly.

**Fix location:** `packages/wowlab-parsers/src/internal/simc/talents.ts` lines 85-90

**Status:** FIXED

---

## CRITICAL BUG #2: Node ordering was wrong

**SimC:** Iterates nodes by `id_node` ascending (std::map ordering)

**wowlab (was):** Sorted by `orderIndex` from loadout entries

**Fix location:** `packages/wowlab-services/src/internal/data/transformer/talent.ts` - `applyDecodedTalents()`

**Status:** FIXED - now sorts by `node.id` ascending

---

## BUG #3: Entry ordering may be incorrect

**SimC `sort_node_entries()`:**
```cpp
if (a_idx != -1 && b_idx != -1)
  return a_idx < b_idx;           // ascending by selection_index
else
  return a->id_trait_node_entry > b->id_trait_node_entry;  // descending by entry ID
```

**wowlab (current):**
```typescript
if (aHasIndex && bHasIndex) {
  return a._Index - b._Index;     // ascending by _Index
} else {
  return b.TraitNodeEntryID - a.TraitNodeEntryID;  // descending
}
```

**Status:** FIXED - Logic matches SimC. `_Index` field maps to SimC's `selection_index` (from `TraitNodeXTraitNodeEntry.Index`).

---

## BUG #4: UI doesn't display selected choice in choice nodes

**Current behavior:** `talent-node.tsx` renders choice nodes as split icons showing both options, but does NOT indicate which choice is actually selected.

**Expected behavior:** When a choice node is selected, should visually indicate which of the two options was chosen (via `selection.choiceIndex`).

**Fix location:** `apps/portal/src/components/talents/talent-node.tsx` - use `selection?.choiceIndex` to highlight/show only the selected entry

**Status:** FIXED - Now dims the non-selected choice to 35% opacity

---

## Summary of Fixes Applied

| # | File | Issue | Status |
|---|------|-------|--------|
| 1 | `talents.ts` (parser) | Move `hasChoice` bit read inside `if(purchased)` | FIXED |
| 2 | `talent.ts` (transformer) | Node ordering - sort by ID ascending | FIXED |
| 3 | `talent.ts` (transformer) | Entry ordering - selection_index or entry ID desc | FIXED |
| 4 | `talent-node.tsx` | Show selected choice visually | FIXED |

---

## Test Case

Talent string from screenshots:
```
C0PAAAAAAAAAAAAAAAAAAAAAAYMbDMgBMbsFyYBAAAAAAzM2mxYmBmZYmlZmZmBzYmMjZMDzMMzYGGDzMMLDz2yMYDAAAAAAmB
```

Expected decode (from trace doc):
- version: 2
- specId: 253 (Beast Mastery Hunter)
- Hero tree: Dark Ranger (subtree 44)
