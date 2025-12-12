# Spec Coverage: Missing Tables Analysis

## Problem

The current spec-coverage command reports **identical talent spell counts** for all specs within a class (e.g., all 3 DK specs show 213 talent spells). This is because all specs of a class share the same `TraitTreeID`, and we're not filtering by spec-specific conditions.

## Root Cause

WoW's talent system uses **conditions** to restrict which nodes are available to each spec:

```
TraitTree (750 for DK)
  └── TraitNode (all talents for all specs interleaved)
        └── TraitNodeGroup (groups nodes by spec)
              └── TraitNodeGroupXTraitCond (links groups to conditions)
                    └── TraitCond (contains SpecSetID)
                          └── SpecSetMember (maps SpecSetID to actual spec IDs)
```

## Missing Tables

### 1. `trait_cond`
**Purpose**: Contains conditions that restrict talent access, including `SpecSetID` for spec filtering.

**Key columns**:
- `ID` - Condition ID
- `CondType` - Type of condition (1=visibility, 2=granted ranks)
- `TraitTreeID` - Which tree this condition applies to
- `SpecSetID` - References SpecSetMember to determine which specs can access
- `TraitNodeGroupID` - Optional direct group reference

**CSV location**: `third_party/wowlab-data/data/tables/TraitCond.csv`

### 2. `trait_node_group`
**Purpose**: Defines groups of nodes within a tree.

**Key columns**:
- `ID` - Group ID
- `TraitTreeID` - Which tree this group belongs to
- `Flags` - Group flags

**CSV location**: `third_party/wowlab-data/data/tables/TraitNodeGroup.csv`

### 3. `trait_node_group_x_trait_node`
**Purpose**: Maps which nodes belong to which groups.

**Key columns**:
- `ID` - Row ID
- `TraitNodeGroupID` - The group
- `TraitNodeID` - The node in that group

**CSV location**: `third_party/wowlab-data/data/tables/TraitNodeGroupXTraitNode.csv`

### 4. `trait_node_group_x_trait_cond`
**Purpose**: Links groups to their conditions (including spec restrictions).

**Key columns**:
- `ID` - Row ID
- `TraitCondID` - The condition
- `TraitNodeGroupID` - The group that condition applies to

**CSV location**: `third_party/wowlab-data/data/tables/TraitNodeGroupXTraitCond.csv`

### 5. `spec_set_member`
**Purpose**: Maps abstract SpecSetID values to actual ChrSpecializationID values.

**Key columns**:
- `ID` - Row ID
- `ChrSpecializationID` - The actual spec ID (e.g., 250=Blood, 251=Frost, 252=Unholy)
- `SpecSet` - The SpecSetID referenced in TraitCond

**CSV location**: `third_party/wowlab-data/data/tables/SpecSetMember.csv`

### 6. `trait_node_x_trait_cond` (partially used)
**Purpose**: Links individual nodes to conditions (for gate nodes).

**CSV location**: `third_party/wowlab-data/data/tables/TraitNodeXTraitCond.csv`

## Example: Death Knight

For DK (ClassID=6), the spec mapping is:
| Spec | SpecID | SpecSetID | Spec Group |
|------|--------|-----------|------------|
| Blood | 250 | 5 | 8088 |
| Frost | 251 | 6 | 8095 |
| Unholy | 252 | 7 | 8090 |

Class-shared nodes are in group **8097**.

## How to Verify Data Completeness

Run these SQL queries after uploading the tables:

```sql
-- 1. Check trait_cond exists and has spec conditions
SELECT COUNT(*) as total_conditions,
       COUNT(*) FILTER (WHERE "SpecSetID" > 0) as spec_conditions
FROM raw_dbc.trait_cond;
-- Expected: spec_conditions > 0

-- 2. Check trait_node_group exists for a known tree
SELECT COUNT(*) FROM raw_dbc.trait_node_group WHERE "TraitTreeID" = 750;
-- Expected: > 0 (DK has ~24 groups)

-- 3. Check trait_node_group_x_trait_node has mappings
SELECT COUNT(*) FROM raw_dbc.trait_node_group_x_trait_node;
-- Expected: thousands of rows

-- 4. Check trait_node_group_x_trait_cond links groups to conditions
SELECT COUNT(*) FROM raw_dbc.trait_node_group_x_trait_cond;
-- Expected: hundreds of rows

-- 5. Check spec_set_member has DK specs
SELECT * FROM raw_dbc.spec_set_member WHERE "SpecSet" IN (5, 6, 7);
-- Expected: 3 rows mapping to specs 250, 251, 252

-- 6. Verify spec-filtered node counts for DK
WITH spec_groups AS (
  SELECT
    ssm."ChrSpecializationID" as spec_id,
    tc."ID" as cond_id,
    tgc."TraitNodeGroupID" as group_id
  FROM raw_dbc.spec_set_member ssm
  JOIN raw_dbc.trait_cond tc ON tc."SpecSetID" = ssm."SpecSet"
  JOIN raw_dbc.trait_node_group_x_trait_cond tgc ON tgc."TraitCondID" = tc."ID"
  WHERE tc."TraitTreeID" = 750 AND tc."CondType" = 1
)
SELECT
  sg.spec_id,
  cs."Name_lang" as spec_name,
  COUNT(DISTINCT tgn."TraitNodeID") as node_count
FROM spec_groups sg
JOIN raw_dbc.trait_node_group_x_trait_node tgn ON tgn."TraitNodeGroupID" = sg.group_id
JOIN raw_dbc.chr_specialization cs ON cs."ID" = sg.spec_id
GROUP BY sg.spec_id, cs."Name_lang";
-- Expected: Different node counts per spec (Blood ~43, Frost ~41, Unholy ~39)
```

## Upload Command

To upload these tables, add them to the DBC upload script or run:

```bash
pnpm cli upload-dbc TraitCond TraitNodeGroup TraitNodeGroupXTraitNode TraitNodeGroupXTraitCond SpecSetMember TraitNodeXTraitCond
```

## Updated Spec Coverage Query

Once tables are uploaded, the spec-coverage query should:

1. Get **class tree nodes** (group with no spec condition, e.g., 8097 for DK)
2. Get **spec-specific nodes** by joining through:
   - `spec_set_member` (spec ID → SpecSetID)
   - `trait_cond` (SpecSetID → condition)
   - `trait_node_group_x_trait_cond` (condition → group)
   - `trait_node_group_x_trait_node` (group → nodes)
3. Get **hero talent nodes** (TraitSubTreeID > 0, shared by all specs)
4. Add **specialization_spells** (already working)
5. Deduplicate and count unique spells
