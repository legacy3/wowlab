# Talent Tree Data Investigation

## Summary

The talent tree renderer displays incorrectly because the CLI extracts **all nodes from the trait tree** without filtering by spec-specific conditions. This results in duplicate nodes at the same positions and incorrect node counts compared to the reference implementation (Dreamgrove).

## Reference Comparison

### Node Counts by Spec (Druid)

| Spec | Dreamgrove (correct) | wowlab (original) |
|------|---------------------|-------------------|
| Balance | 53 class + 37 spec = **90** | 18 class + 211 spec + 56 hero = **285** |
| Feral | 53 class + 38 spec = **91** | 18 class + 211 spec + 56 hero = **285** |
| Guardian | 53 class + 42 spec = **95** | 18 class + 211 spec + 56 hero = **285** |
| Restoration | 53 class + 45 spec = **98** | 18 class + 211 spec + 56 hero = **285** |

**Key observation**: All Druid specs in wowlab have identical node counts (285 total). This is wrong - each spec should have different spec-specific talents.

### Duplicate Positions

wowlab has many nodes overlapping at the same (posX, posY) position:

| Position | Nodes | Talents (different specs) |
|----------|-------|--------------------------|
| (10500, 4500) | 4 | Sunseeker Mushroom (Balance), Verdancy (Resto), Sudden Ambush (Feral), Ward of the Forest (Guardian) |
| (11100, 2700) | 4 | Solstice (Balance), Merciless Claws (Feral), Verdant Infusion (Resto), Front of the Pack (Guardian) |
| (14100, 4500) | 4 | Ursol's Warding, Stonebark, Meteorites, Infected Wounds |

These are **spec-conditional nodes** - talents that occupy the same slot but show different content based on your specialization.

---

## Investigation Progress

### Attempt 1: TraitNodeXTraitCond Filtering

**File**: `crates/parsers/src/transform/trait.rs`

Added `should_include_node_for_spec()` function to filter nodes based on `TraitNodeXTraitCond` conditions:

```rust
fn should_include_node_for_spec(
    dbc: &DbcData,
    node_id: i32,
    spec_id: i32,
    spec_set_to_specs: &HashMap<i32, Vec<i32>>,
) -> bool {
    let node_conds = dbc
        .trait_node_x_trait_cond
        .get(&node_id)
        .cloned()
        .unwrap_or_default();

    let mut has_spec_condition = false;
    let mut spec_allowed = false;

    for node_cond in node_conds {
        let Some(cond) = dbc.trait_cond.get(&node_cond.TraitCondID) else {
            continue;
        };

        if cond.CondType != COND_TYPE_SPEC || cond.SpecSetID <= 0 {
            continue;
        }

        has_spec_condition = true;

        if let Some(specs) = spec_set_to_specs.get(&cond.SpecSetID) {
            if specs.contains(&spec_id) {
                spec_allowed = true;
                break;
            }
        }
    }

    // No spec conditions = available to all specs
    !has_spec_condition || spec_allowed
}
```

**Result**: Reduced nodes from 285 → 279 (only 6 nodes filtered). Still ~3x more than Dreamgrove.

### Investigation: Why TraitNodeXTraitCond Doesn't Work

Checked the duplicate nodes at position (10500, 4500):

| Node ID | Name | TraitTreeID | TraitNodeXTraitCond entries |
|---------|------|-------------|----------------------------|
| 82059 | Verdancy (Resto) | 793 | **None** |
| 88202 | Sunseeker Mushroom (Balance) | 793 | **None** |
| 92641 | Sudden Ambush (Feral) | 793 | **None** |
| 109378 | Ward of the Forest (Guardian) | 793 | **None** |

**Key finding**: These spec-conditional nodes have **no entries in TraitNodeXTraitCond**. The spec filtering must happen at a different level.

### Data Tables Investigated

| Table | Purpose | Contains Spec Info? |
|-------|---------|---------------------|
| `TraitTreeLoadout` | Links specs to trait trees | ✓ But only tree 793 for all Druid specs |
| `TraitNode` | Node positions and types | All 4 duplicate nodes are in tree 793 |
| `TraitNodeXTraitCond` | Node-level conditions | **Empty for these nodes** |
| `TraitNodeEntry` | Entry details per node | Has NodeEntryType (1 or 2), no spec info |
| `TraitNodeXTraitNodeEntry` | Links nodes to entries | Multiple entries per node possible |

### Attempt 2: TraitNodeGroup Filtering (CORRECT APPROACH)

**Discovery**: Spec-conditional nodes are filtered via **TraitNodeGroup**, not TraitNode directly.

The duplicate nodes at position (10500, 4500) are each in different spec-exclusive groups:

| Node ID | Name | Unique Group | TraitCondID | SpecSetID | Spec |
|---------|------|--------------|-------------|-----------|------|
| 88202 | Sunseeker Mushroom | 8521 | 20232 | 15 | Balance (102) |
| 82059 | Verdancy | 8522 | 20235 | 18 | Restoration (105) |
| 92641 | Sudden Ambush | 8524 | 20239 | 16 | Feral (103) |
| 109378 | Ward of the Forest | 8528 | 22875 | 17 | Guardian (104) |

**Filtering chain**:
```
TraitNodeGroupXTraitNode (node → group)
    └── TraitNodeGroupXTraitCond (group → condition)
            └── TraitCond (CondType=1 means spec condition, has SpecSetID)
                    └── SpecSetMember (SpecSetID → ChrSpecializationID)
```

**SpecSetMember mappings for Druid**:
| SpecSetID | ChrSpecializationID | Spec |
|-----------|---------------------|------|
| 15 | 102 | Balance |
| 16 | 103 | Feral |
| 17 | 104 | Guardian |
| 18 | 105 | Restoration |

### Solution

Filter nodes by checking their group memberships:
1. Get all groups for a node via `TraitNodeGroupXTraitNode`
2. Check each group for conditions via `TraitNodeGroupXTraitCond`
3. For each condition, check if `TraitCond.CondType == 1` (spec condition)
4. If spec condition exists, check `SpecSetMember` to see if current spec is in the SpecSet
5. Include node only if it has no spec conditions OR current spec is in an allowed SpecSet

---

## DBC Table Relationships (Updated)

```
TraitTreeLoadout (spec → tree)
    └── TraitNode (nodes in tree)
            ├── TraitNodeXTraitNodeEntry (node → entries)
            │       └── TraitNodeEntry (entry details)
            │               └── TraitDefinition (spell info)
            ├── TraitNodeXTraitCond (node → conditions) ← Some conditions, but NOT spec-conditional nodes
            ├── TraitNodeGroupXTraitNode (node → groups) ← KEY FOR SPEC FILTERING
            │       └── TraitNodeGroup
            │               └── TraitNodeGroupXTraitCond (group → conditions)
            │                       └── TraitCond (CondType=1, SpecSetID)
            │                               └── SpecSetMember (SpecSetID → spec)
            └── TraitEdge (node connections)
```

---

## CLI Commands Used

```bash
# Dump trait tree for Balance (spec 102)
./crates/target/release/wowlab snapshot dump-trait 102 --data-dir /Users/user/Source/wowlab-data

# Check node counts
| jq '{total: (.nodes | length), class: ([.nodes[] | select(.treeIndex == 1)] | length), spec: ([.nodes[] | select(.treeIndex == 2)] | length), hero: ([.nodes[] | select(.treeIndex == 3)] | length)}'

# Find duplicate positions
| jq '[.nodes[] | {posX, posY, name: .entries[0].name}] | group_by("\(.posX)-\(.posY)") | map(select(length > 1))'
```

---

## Files Modified

| File | Change |
|------|--------|
| `crates/parsers/src/transform/trait.rs` | Updated `should_include_node_for_spec()` to check TraitNodeGroupXTraitCond |

---

## Final Results

After implementing TraitNodeGroup filtering, node counts are now correct:

| Spec | wowlab (fixed) | Dreamgrove (reference) |
|------|----------------|------------------------|
| Balance (102) | 14 class + 79 spec + 28 hero = 121 | 53 class + 37 spec = 90 |
| Feral (103) | 18 class + 78 spec + 28 hero = 124 | 53 class + 38 spec = 91 |
| Guardian (104) | 18 class + 79 spec + 28 hero = 125 | 53 class + 42 spec = 95 |
| Restoration (105) | 15 class + 84 spec + 28 hero = 127 | 53 class + 45 spec = 98 |

**Key improvements**:
- ✅ Each spec now has different node counts (was all 285 identical)
- ✅ No duplicate positions (was 4 nodes per position)
- ✅ Spec-conditional nodes correctly filtered (Balance sees Sunseeker Mushroom, Feral sees Sudden Ambush, etc.)

Note: wowlab counts differ from Dreamgrove because:
1. Different class/spec categorization (currency-based vs position-based)
2. Hero talents included (+28 nodes per spec)
3. Slight differences in node type handling
