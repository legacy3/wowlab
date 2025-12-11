# Talent System Documentation

This document describes how WoW talent strings are decoded and mapped to the trait tree database structure.

## Talent String Format

Talent strings are base64-encoded binary data that encode a character's talent selections. Example:

```
C0PAAAAAAAAAAAAAAAAAAAAAAYMbDMgBMbsFyYBAAAAAAzM2mxYmBmZYmlZmZmBzYmMjZMDzMMzYGDzMMLDz2yMYDAAAAAAmB
```

### Decoding with `decodeTalentLoadout`

The `@wowlab/parsers` package exports `decodeTalentLoadout(talentString)` which returns:

```typescript
interface DecodedTalentLoadout {
  version: number; // Encoding version (currently 2)
  specId: number; // Specialization ID (e.g., 253 = Beast Mastery)
  treeHash: Uint8Array; // 16-byte hash for validation
  nodes: DecodedTalentNode[];
}

interface DecodedTalentNode {
  selected: boolean; // Whether this node position has a talent
  purchased?: boolean; // Whether points were spent
  partiallyRanked?: boolean; // For multi-rank talents
  ranksPurchased?: number; // Number of ranks (if partially ranked)
  choiceNode?: boolean; // Whether this is a choice node
  choiceIndex?: number; // Which choice was selected (0 or 1)
}
```

### Example Output

```typescript
{
  version: 2,
  specId: 253,  // Beast Mastery Hunter
  treeHash: Uint8Array(16),
  nodes: [
    { selected: false },
    { selected: true, purchased: true, choiceNode: false },
    { selected: true, purchased: true, choiceNode: true, choiceIndex: 1 },
    // ... 200+ more nodes
  ]
}
```

## Database Schema

### Tables Currently in Supabase (`raw_dbc` schema)

| Table                           | Rows   | Description                               |
| ------------------------------- | ------ | ----------------------------------------- |
| `chr_specialization`            | 60     | Spec definitions (ID, ClassID, Name_lang) |
| `trait_definition`              | 16,390 | Trait → Spell mapping                     |
| `trait_node_entry`              | 16,492 | Node entry data (MaxRanks, NodeEntryType) |
| `trait_node_x_trait_node_entry` | 13,827 | Links nodes to entries                    |
| `trait_sub_tree`                | 78     | Hero talent tree definitions              |
| `skill_line_x_trait_tree`       | 131    | Links skill lines to trait trees          |

### Tables Needed (from `wowlab-data/data/tables/`)

| Table                      | Rows   | Purpose                                        |
| -------------------------- | ------ | ---------------------------------------------- |
| `trait_tree`               | 190    | Tree definitions                               |
| `trait_node`               | 11,772 | Node positions and tree membership             |
| `trait_edge`               | 7,230  | Connections between nodes                      |
| `trait_tree_loadout`       | 87     | Maps TraitTreeID → ChrSpecializationID         |
| `trait_tree_loadout_entry` | 5,059  | **Critical**: OrderIndex → TraitNodeID mapping |

### Table Schemas

#### `trait_tree`

```csv
ID,TraitSystemID,TraitTreeID,FirstTraitNodeID,PlayerConditionID,Flags,Field_10_0_0_45697_006,Field_10_0_0_45697_007
```

#### `trait_node`

```csv
ID,TraitTreeID,PosX,PosY,Type,Flags,TraitSubTreeID
```

- `PosX`, `PosY`: Grid position for rendering
- `Type`: 0 = normal, 2 = choice node
- `TraitSubTreeID`: Non-zero for hero talent nodes (42, 43, 44 for Hunter)

#### `trait_edge`

```csv
ID,VisualStyle,LeftTraitNodeID,RightTraitNodeID,Type
```

- Defines prerequisite connections between nodes

#### `trait_tree_loadout`

```csv
ID,TraitTreeID,ChrSpecializationID
```

Example Hunter entries:

- `766,774,255` (Survival)
- `767,774,254` (Marksmanship)
- `768,774,253` (Beast Mastery)

#### `trait_tree_loadout_entry`

```csv
ID,TraitTreeLoadoutID,SelectedTraitNodeID,SelectedTraitNodeEntryID,NumPoints,OrderIndex
```

- `OrderIndex`: Position in the encoded talent string
- `SelectedTraitNodeID`: The actual node ID
- `SelectedTraitNodeEntryID`: For choice nodes, which entry was selected

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TALENT STRING DECODING                          │
└─────────────────────────────────────────────────────────────────────────┘

talent_string: "C0PAAA..."
        │
        ▼
┌───────────────────────┐
│ decodeTalentLoadout() │
└───────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ DecodedTalentLoadout                  │
│   specId: 253 (Beast Mastery)         │
│   nodes[0]: { selected: false }       │
│   nodes[1]: { selected: true, ... }   │
│   nodes[2]: { selected: true, ... }   │
│   ...                                 │
└───────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE MAPPING                                │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Get TraitTreeLoadoutID from specId
─────────────────────────────────────────
SELECT "ID", "TraitTreeID"
FROM trait_tree_loadout
WHERE "ChrSpecializationID" = 253
→ Returns: ID=768, TraitTreeID=774

Step 2: Get node ordering
─────────────────────────
SELECT "SelectedTraitNodeID", "OrderIndex"
FROM trait_tree_loadout_entry
WHERE "TraitTreeLoadoutID" = 768
ORDER BY "OrderIndex"

→ Returns:
   OrderIndex 0 → TraitNodeID 102340
   OrderIndex 1 → TraitNodeID 102341
   OrderIndex 2 → TraitNodeID 102342
   ...

Step 3: Map decoded nodes to database nodes
───────────────────────────────────────────
decoded.nodes[i].selected → trait_tree_loadout_entry.OrderIndex = i
                                        │
                                        ▼
                              SelectedTraitNodeID
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NODE DATA RESOLUTION                            │
└─────────────────────────────────────────────────────────────────────────┘

trait_node (ID = SelectedTraitNodeID)
    │
    ├── PosX, PosY (for rendering position)
    ├── TraitSubTreeID (0 = class/spec tree, 42/43/44 = hero trees)
    │
    ▼
trait_node_x_trait_node_entry (TraitNodeID = trait_node.ID)
    │
    ▼
trait_node_entry (ID = TraitNodeEntryID)
    │
    ├── MaxRanks (1 or 2)
    ├── NodeEntryType (1 = normal, 2 = choice)
    │
    ▼
trait_definition (ID = TraitDefinitionID)
    │
    ├── SpellID
    ├── OverrideName_lang (custom name if any)
    ├── OverrideIcon
    │
    ▼
spell_name (ID = SpellID)
    │
    └── Name_lang (talent display name)

spell_misc (SpellID = SpellID)
    │
    └── SpellIconFileDataID (icon asset ID)
```

## Spec IDs Reference

### Hunter (Class 3)

| Spec          | ID  | TraitTreeID | TraitTreeLoadoutID |
| ------------- | --- | ----------- | ------------------ |
| Beast Mastery | 253 | 774         | 768                |
| Marksmanship  | 254 | 774         | 767                |
| Survival      | 255 | 774         | 766                |

### Hero Talent SubTrees (Hunter)

| SubTreeID | Name        |
| --------- | ----------- |
| 42        | Dark Ranger |
| 43        | Pack Leader |
| 44        | Sentinel    |

## Rendering Considerations

### Tree Layout

- `PosX` and `PosY` in `trait_node` define grid positions
- Typical values: PosX 0-9000, PosY 0-7000
- Scale to fit UI (divide by ~100 for pixel positions)

### Node Types

- **Type 0**: Single talent (may have 1 or 2 ranks)
- **Type 2**: Choice node (2 options, select one)

### Tree Sections

- `TraitSubTreeID = 0`: Class or spec tree nodes
- `TraitSubTreeID > 0`: Hero talent tree nodes

### Edges

- `trait_edge.LeftTraitNodeID` → `trait_edge.RightTraitNodeID`
- Draw lines between connected nodes
- `VisualStyle` determines line appearance

## Example Query: Get All Talents for a Spec

```sql
WITH loadout AS (
  SELECT "ID" as loadout_id, "TraitTreeID"
  FROM raw_dbc.trait_tree_loadout
  WHERE "ChrSpecializationID" = 253  -- Beast Mastery
)
SELECT
  tle."OrderIndex",
  tn."ID" as node_id,
  tn."PosX",
  tn."PosY",
  tn."Type",
  tn."TraitSubTreeID",
  tne."MaxRanks",
  td."SpellID",
  COALESCE(td."OverrideName_lang", sn."Name_lang") as talent_name,
  sm."SpellIconFileDataID" as icon_id
FROM loadout l
JOIN raw_dbc.trait_tree_loadout_entry tle ON tle."TraitTreeLoadoutID" = l.loadout_id
JOIN raw_dbc.trait_node tn ON tn."ID" = tle."SelectedTraitNodeID"
JOIN raw_dbc.trait_node_x_trait_node_entry tnxe ON tnxe."TraitNodeID" = tn."ID"
JOIN raw_dbc.trait_node_entry tne ON tne."ID" = tnxe."TraitNodeEntryID"
JOIN raw_dbc.trait_definition td ON td."ID" = tne."TraitDefinitionID"
LEFT JOIN raw_dbc.spell_name sn ON sn."ID" = td."SpellID"
LEFT JOIN raw_dbc.spell_misc sm ON sm."SpellID" = td."SpellID" AND sm."DifficultyID" = 0
ORDER BY tle."OrderIndex";
```

## Icon Resolution

Spell icons use `SpellIconFileDataID` from `spell_misc`. To get the actual icon URL:

```typescript
// WoW.tools CDN
const iconUrl = `https://wow.zamimg.com/images/wow/icons/large/${iconId}.jpg`;

// Or use manifest_interface_data to get the filename
SELECT "FileName" FROM raw_dbc.manifest_interface_data WHERE "ID" = :iconFileDataId;
```

## Implementation Notes

1. **Performance**: Pre-compute and cache the OrderIndex → NodeID mapping per spec
2. **Choice Nodes**: When `choiceNode: true`, use `choiceIndex` to determine which `TraitNodeEntryID` was selected
3. **Ranks**: For multi-rank talents, `ranksPurchased` indicates current points (or MaxRanks if fully purchased)
4. **Hero Talents**: Filter by `TraitSubTreeID` to separate class/spec talents from hero talents
