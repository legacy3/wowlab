# Blizzard Talent Tree UI Analysis

This document provides a comprehensive analysis of how Blizzard implements talent trees in World of Warcraft, based on analysis of the official UI source code.

## Data Hierarchy

```
TraitTree
├── TraitNodes[]
│   ├── TraitEntries[]
│   │   └── TraitDefinition (spellID, icon, name, description)
│   └── visibleEdges[] → targetNode connections
├── SubTrees[] (Hero Talents)
│   └── TraitNodes[] (positioned relative to SubTree)
├── Gates[] (spending requirements)
└── Currencies[] (class points, spec points, hero points)
```

## Core Data Structures

### TraitNodeInfo

```typescript
interface TraitNodeInfo {
  ID: number;
  posX: number; // Raw position (divide by 10 for pixels)
  posY: number; // Raw position (negate and divide by 10)
  flags: number; // TraitNodeFlag bitfield
  type: TraitNodeType; // Single=0, Tiered=1, Selection=2, SubTreeSelection=3
  entryIDs: number[]; // Entries on this node
  visibleEdges: TraitOutEdgeInfo[]; // Connections to other nodes
  maxRanks: number;
  ranksPurchased: number;
  activeRank: number;
  currentRank: number;
  subTreeID?: number; // If part of a Hero Talent subtree
  subTreeActive?: boolean;
  groupIDs: number[];
  conditionIDs: number[];
  isAvailable: boolean;
  isVisible: boolean;
}
```

### TraitEntryInfo

```typescript
interface TraitEntryInfo {
  definitionID?: number; // Nil for SubTreeSelection entries
  subTreeID?: number; // For SubTreeSelection entries
  type: TraitNodeEntryType; // SpendSquare=1, SpendCircle=2, etc.
  maxRanks: number;
  isAvailable: boolean;
  conditionIDs: number[];
}
```

### TraitDefinitionInfo

```typescript
interface TraitDefinitionInfo {
  spellID?: number;
  overrideName?: string;
  overrideSubtext?: string;
  overrideDescription?: string;
  overrideIcon?: number;
  overriddenSpellID?: number;
  subType?: TraitDefinitionSubType;
}
```

### TraitSubTreeInfo (Hero Talents)

```typescript
interface TraitSubTreeInfo {
  ID: number;
  name?: string;
  description?: string;
  iconElementID?: string; // Atlas name for icon
  traitCurrencyID?: number;
  isActive: boolean;
  subTreeSelectionNodeIDs: number[];
  posX: number; // Center X of all subtree nodes
  posY: number; // Topmost Y of all subtree nodes
}
```

### TraitOutEdgeInfo

```typescript
interface TraitOutEdgeInfo {
  targetNode: number; // Node ID this edge points to
  type: TraitEdgeType; // See enum below
  visualStyle: TraitEdgeVisualStyle; // None=0, Straight=1
  isActive: boolean;
}
```

## Enumerations

### TraitNodeType

| Value | Name             | Description                     |
| ----- | ---------------- | ------------------------------- |
| 0     | Single           | Basic talent node               |
| 1     | Tiered           | Multi-rank node                 |
| 2     | Selection        | Choice between multiple talents |
| 3     | SubTreeSelection | Hero talent tree selection      |

### TraitNodeEntryType (Visual Shape)

| Value | Name             | Shape                    |
| ----- | ---------------- | ------------------------ |
| 0     | SpendHex         | Hexagon                  |
| 1     | SpendSquare      | Square (active talents)  |
| 2     | SpendCircle      | Circle (passive talents) |
| 3     | SpendSmallCircle | Small circle             |
| 6     | SpendDiamond     | Diamond                  |
| 10    | RedButton        | Red button               |
| 11    | ArmorSet         | Armor set                |

### TraitEdgeType

| Value | Name                      | Description             |
| ----- | ------------------------- | ----------------------- |
| 0     | VisualOnly                | No gameplay effect      |
| 2     | SufficientForAvailability | One of multiple paths   |
| 3     | RequiredForAvailability   | Must be purchased       |
| 4     | MutuallyExclusive         | Cannot both be selected |

### TraitNodeFlag

| Value | Name                  |
| ----- | --------------------- |
| 1     | ShowMultipleIcons     |
| 2     | NeverPurchasable      |
| 4     | TestPositionLocked    |
| 8     | TestGridPositioned    |
| 16    | ActiveAtFirstRank     |
| 32    | ShowExpandedSelection |
| 64    | HideMaxRank           |
| 128   | HighestChosenRank     |

## Position Calculation

### Raw to Pixel Conversion

The positions in DBC data use raw units that must be converted:

```lua
function TranslateNodePositionsToAnchorPositions(posX, posY, offsetX, offsetY)
    local newX = (posX / 10) - offsetX;
    local newY = (-posY / 10) + offsetY;  -- Y is inverted!
    return newX, newY;
end
```

**Key formula:**

- `pixelX = posX / 10`
- `pixelY = -posY / 10` (Y increases downward in UI, but upward in data)

### Row Calculation

For frame level/z-ordering, rows are calculated:

```lua
local BaseYOffset = 1500;
local BaseRowHeight = 600;

local rowIndex = (posY - BaseYOffset) / BaseRowHeight;
```

This means:

- `posY = 1500` is Row 0
- `posY = 2100` is Row 1
- `posY = 2700` is Row 2
- etc.

### SubTree (Hero Talent) Position Normalization

SubTree nodes have positions relative to their subtree:

```lua
function GetNormalizedSubTreeNodePosition(talentFrame, nodeInfo)
    local tPosX = nodeInfo.posX - subTreeInfo.posX;  -- subTree.posX = center X
    local tPosY = nodeInfo.posY - subTreeInfo.posY;  -- subTree.posY = top Y
    return tPosX, tPosY;
end
```

Where:

- `subTreeInfo.posX` = Center X position of all subtree nodes
- `subTreeInfo.posY` = Topmost Y position of all subtree nodes

## Edge Rendering

### Edge Styles

Edges connect nodes visually:

1. **Arrow Edges** (Class Talents): Lines with arrowheads
   - Calculate angle between buttons
   - Position arrowhead at target button edge
   - Colors: Yellow (active), Gray (inactive), Locked, Red (refund invalid)

2. **Straight Edges**: Simple lines without arrowheads (Hero talents)

### Edge Color Logic

```lua
if isRefundInvalid then
    color = RED_FONT_COLOR
elseif edgeType == MutuallyExclusive then
    color = isGated ? DIM_RED : RED
elseif isActive then
    color = YELLOW_FONT_COLOR
elseif isGated then
    color = (0.1, 0.1, 0.1)  -- Dark gray
else
    color = GRAY_FONT_COLOR
end
```

## Gate System

Gates are spending requirements that block access to lower sections of the tree:

```typescript
interface TraitGateInfo {
  topLeftNodeID: number; // First node after the gate
  conditionID: number; // References TraitCondInfo
}

interface TraitCondInfo {
  condID: number;
  isGate: boolean;
  isMet: boolean;
  traitCurrencyID?: number;
  spentAmountRequired?: number;
  tooltipFormat?: string;
}
```

Gates display text like "Spend 8 points in the Class tree" and prevent purchasing nodes below them until the condition is met.

## Currency System

Each tree has multiple currencies:

```typescript
interface TreeCurrencyInfo {
  traitCurrencyID: number;
  quantity: number; // Available to spend
  maxQuantity?: number;
  spent: number;
}
```

For Class Talents:

- `treeCurrencyInfo[1]` = Class points
- `treeCurrencyInfo[2]` = Spec points

For Hero Talents:

- Each SubTree has its own `traitCurrencyID`

## Visual State Machine

Node visual states determine appearance:

| State         | Description                       |
| ------------- | --------------------------------- |
| Normal        | Standard state                    |
| Gated         | Behind an unmet gate              |
| Disabled      | Cannot be interacted with         |
| Locked        | Requirements not met              |
| Selectable    | Can be purchased                  |
| Maxed         | Fully purchased                   |
| Invisible     | Should not be rendered            |
| RefundInvalid | Cannot refund due to dependencies |
| DisplayError  | Visual warning state              |

## Icon Resolution

Icons are resolved in this order:

1. `definitionInfo.overrideIcon` (if set)
2. `GetSpellTexture(definitionInfo.spellID)` (from spell)

```lua
function GetDefinitionIcon(definitionInfo)
    if definitionInfo.overrideIcon then
        return definitionInfo.overrideIcon;
    elseif definitionInfo.spellID then
        return C_Spell.GetSpellTexture(definitionInfo.spellID);
    end
    return nil;
end
```

## Class-Specific Configuration

Each class has visual configuration for:

- Background texture atlas
- Activation effects
- Pan offset adjustments

```lua
local classVisuals = {
    activationFX = "atlas-name",
    panOffset = { x = number, y = number }
}
```

## Implementation Notes

### Loading a Talent Tree

1. Get `configID` from `C_ClassTalents.GetActiveConfigID()`
2. Get `treeID` from `C_Traits.GetConfigInfo(configID).treeIDs[1]`
3. Get all node IDs: `C_Traits.GetTreeNodes(treeID)`
4. For each node:
   - Get `nodeInfo` from `C_Traits.GetNodeInfo(configID, nodeID)`
   - Get entries from `nodeInfo.entryIDs`
   - For each entry, get `entryInfo` from `C_Traits.GetEntryInfo(configID, entryID)`
   - Get definition from `C_Traits.GetDefinitionInfo(entryInfo.definitionID)`
5. Get gates from `C_Traits.GetTreeInfo(configID, treeID).gates`
6. Get currencies from `C_Traits.GetTreeCurrencyInfo(configID, treeID, false)`
7. Get subtrees by examining nodes with `subTreeID` and calling `C_Traits.GetSubTreeInfo`

### Building the Visual Tree

1. Calculate bounding box from all node positions
2. Apply position transformation: `(posX / 10, -posY / 10)`
3. Apply any class-specific pan offsets
4. For SubTree nodes, normalize positions relative to SubTree center/top
5. Create edges from each node's `visibleEdges`
6. Position gates at their `topLeftNodeID` locations

### Handling Selection Nodes

Selection nodes (type=2) have multiple entries:

- Each entry is a different talent choice
- Only one can be active at a time
- Node shows "choice" visual with multiple icons
- When `ShowExpandedSelection` flag is set, show expanded picker UI
