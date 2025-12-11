# Talent System Implementation Plan

## Overview

Build infrastructure to extract, transform, and render talent trees similar to Raidbots. This involves extending the existing DBC service pattern used for spells/items.

## Phase 1: Schema & Types

### 1.1 Add Row Schemas (DONE)

Already created in `packages/wowlab-core/src/internal/schemas/dbc/`:

- `TraitTreeSchema.ts`
- `TraitNodeSchema.ts`
- `TraitEdgeSchema.ts`
- `TraitTreeLoadoutSchema.ts`
- `TraitTreeLoadoutEntrySchema.ts`

### 1.2 Add Output Types

Create `packages/wowlab-core/src/internal/schemas/talent/` with:

```typescript
// TalentNode - fully resolved node for rendering
interface TalentNode {
  id: number;
  posX: number;
  posY: number;
  type: number; // 0 = normal, 2 = choice
  subTreeId: number; // 0 = class/spec, >0 = hero tree
  orderIndex: number; // position in talent string encoding
  maxRanks: number;
  entries: TalentNodeEntry[]; // 1 for normal, 2 for choice nodes
}

interface TalentNodeEntry {
  id: number;
  definitionId: number;
  spellId: number;
  name: string;
  description: string;
  iconFileName: string; // e.g. "ability_hunter_killcommand"
}

// TalentEdge - connection between nodes
interface TalentEdge {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  visualStyle: number;
}

// TalentTree - complete tree structure
interface TalentTree {
  specId: number;
  specName: string;
  className: string;
  treeId: number;
  nodes: TalentNode[];
  edges: TalentEdge[];
  subTrees: TalentSubTree[]; // hero talent trees
}

interface TalentSubTree {
  id: number;
  name: string;
  description: string;
}

// DecodedTalentSelection - result of applying decoded string to tree
interface DecodedTalentSelection {
  nodeId: number;
  selected: boolean;
  ranksPurchased: number;
  choiceIndex?: number; // for choice nodes
}
```

## Phase 2: DbcService Extension

### 2.1 Add Interface Methods

In `packages/wowlab-services/src/internal/data/dbc/DbcService.ts`:

```typescript
// Trait Tree
readonly getTraitTree: (id: number) => Effect.Effect<TraitTreeRow | undefined, DbcError>;
readonly getTraitTreesForSpec: (specId: number) => Effect.Effect<ReadonlyArray<TraitTreeRow>, DbcError>;

// Trait Node
readonly getTraitNode: (id: number) => Effect.Effect<TraitNodeRow | undefined, DbcError>;
readonly getTraitNodesForTree: (treeId: number) => Effect.Effect<ReadonlyArray<TraitNodeRow>, DbcError>;

// Trait Edge
readonly getTraitEdgesForTree: (treeId: number) => Effect.Effect<ReadonlyArray<TraitEdgeRow>, DbcError>;

// Trait Tree Loadout
readonly getTraitTreeLoadout: (specId: number) => Effect.Effect<TraitTreeLoadoutRow | undefined, DbcError>;
readonly getTraitTreeLoadoutEntries: (loadoutId: number) => Effect.Effect<ReadonlyArray<TraitTreeLoadoutEntryRow>, DbcError>;

// Trait Node Entry & Definition (already have trait_node_entry, trait_definition)
readonly getTraitNodeEntry: (id: number) => Effect.Effect<TraitNodeEntryRow | undefined, DbcError>;
readonly getTraitDefinition: (id: number) => Effect.Effect<TraitDefinitionRow | undefined, DbcError>;
readonly getTraitNodeXTraitNodeEntries: (nodeId: number) => Effect.Effect<ReadonlyArray<TraitNodeXTraitNodeEntryRow>, DbcError>;

// Trait Sub Tree
readonly getTraitSubTree: (id: number) => Effect.Effect<TraitSubTreeRow | undefined, DbcError>;
```

### 2.2 Implement in InMemoryDbcService

Add implementations that query Supabase `raw_dbc` schema.

## Phase 3: Extractor Service

### 3.1 Add Talent Extractors

In `packages/wowlab-services/src/internal/data/transformer/extractors.ts`:

```typescript
const extractTalentIcon = (
  traitDefinition: TraitDefinitionRow,
): Effect.Effect<string, DbcError> =>
  Effect.gen(function* () {
    // Use OverrideIcon if set, otherwise get from spell
    const iconFileDataId =
      traitDefinition.OverrideIcon > 0
        ? traitDefinition.OverrideIcon
        : yield* getSpellIconFileDataId(traitDefinition.SpellID);

    if (iconFileDataId === 0) {
      return "inv_misc_questionmark";
    }

    const manifest = yield* dbcService.getManifestInterfaceData(iconFileDataId);
    if (!manifest) {
      return "inv_misc_questionmark";
    }

    return manifest.FileName.toLowerCase().replace(".blp", "");
  });

const extractTalentName = (
  traitDefinition: TraitDefinitionRow,
): Effect.Effect<string, DbcError> =>
  Effect.gen(function* () {
    // Use OverrideName if set, otherwise get from spell
    if (traitDefinition.OverrideName_lang) {
      return traitDefinition.OverrideName_lang;
    }

    if (traitDefinition.SpellID === 0) {
      return "Unknown Talent";
    }

    const spellName = yield* dbcService.getSpellName(traitDefinition.SpellID);
    return spellName?.Name_lang ?? `Spell ${traitDefinition.SpellID}`;
  });

const extractTalentDescription = (
  traitDefinition: TraitDefinitionRow,
): Effect.Effect<string, DbcError> =>
  Effect.gen(function* () {
    if (traitDefinition.OverrideDescription_lang) {
      return traitDefinition.OverrideDescription_lang;
    }

    if (traitDefinition.SpellID === 0) {
      return "";
    }

    const spell = yield* dbcService.getSpell(traitDefinition.SpellID);
    return spell?.Description_lang ?? "";
  });
```

## Phase 4: Talent Transformer

### 4.1 Create Talent Transformer

New file: `packages/wowlab-services/src/internal/data/transformer/talent.ts`

```typescript
export const transformTalentTree = (
  specId: number,
): Effect.Effect<TalentTree, DbcError, DbcService | ExtractorService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    // 1. Get spec info
    const spec = yield* dbc.getChrSpecialization(specId);
    const chrClass = yield* dbc.getChrClass(spec.ClassID);

    // 2. Get loadout for ordering
    const loadout = yield* dbc.getTraitTreeLoadout(specId);
    const loadoutEntries = yield* dbc.getTraitTreeLoadoutEntries(loadout.ID);

    // 3. Build orderIndex map: nodeId -> orderIndex
    const orderIndexMap = new Map<number, number>();
    for (const entry of loadoutEntries) {
      orderIndexMap.set(entry.SelectedTraitNodeID, entry.OrderIndex);
    }

    // 4. Get all nodes for this tree
    const treeNodes = yield* dbc.getTraitNodesForTree(loadout.TraitTreeID);

    // 5. Get all edges
    const edges = yield* dbc.getTraitEdgesForTree(loadout.TraitTreeID);

    // 6. Get unique subTreeIds for hero talents
    const subTreeIds = [
      ...new Set(treeNodes.map((n) => n.TraitSubTreeID).filter((id) => id > 0)),
    ];
    const subTrees: TalentSubTree[] = [];
    for (const subTreeId of subTreeIds) {
      const subTree = yield* dbc.getTraitSubTree(subTreeId);
      if (subTree) {
        subTrees.push({
          id: subTree.ID,
          name: subTree.Name_lang ?? "",
          description: subTree.Description_lang ?? "",
        });
      }
    }

    // 7. Resolve each node
    const nodes: TalentNode[] = [];
    for (const node of treeNodes) {
      const nodeEntries = yield* dbc.getTraitNodeXTraitNodeEntries(node.ID);

      const entries: TalentNodeEntry[] = [];
      for (const nodeEntry of nodeEntries) {
        const entry = yield* dbc.getTraitNodeEntry(nodeEntry.TraitNodeEntryID);
        const definition = yield* dbc.getTraitDefinition(
          entry.TraitDefinitionID,
        );

        const name = yield* extractor.extractTalentName(definition);
        const description =
          yield* extractor.extractTalentDescription(definition);
        const iconFileName = yield* extractor.extractTalentIcon(definition);

        entries.push({
          id: entry.ID,
          definitionId: definition.ID,
          spellId: definition.SpellID,
          name,
          description,
          iconFileName,
        });
      }

      nodes.push({
        id: node.ID,
        posX: node.PosX,
        posY: node.PosY,
        type: node.Type,
        subTreeId: node.TraitSubTreeID,
        orderIndex: orderIndexMap.get(node.ID) ?? -1,
        maxRanks: entries[0]?.maxRanks ?? 1,
        entries,
      });
    }

    return {
      specId,
      specName: spec.Name_lang,
      className: chrClass.Name_lang,
      treeId: loadout.TraitTreeID,
      nodes,
      edges: edges.map((e) => ({
        id: e.ID,
        fromNodeId: e.LeftTraitNodeID,
        toNodeId: e.RightTraitNodeID,
        visualStyle: e.VisualStyle,
      })),
      subTrees,
    };
  });
```

## Phase 5: Apply Decoded Talents

### 5.1 Talent String Application

```typescript
export const applyDecodedTalents = (
  tree: TalentTree,
  decoded: DecodedTalentLoadout,
): TalentTreeWithSelections => {
  const selections = new Map<number, DecodedTalentSelection>();

  // Sort nodes by orderIndex
  const orderedNodes = [...tree.nodes]
    .filter((n) => n.orderIndex >= 0)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // Map decoded nodes to tree nodes
  for (let i = 0; i < decoded.nodes.length && i < orderedNodes.length; i++) {
    const decodedNode = decoded.nodes[i];
    const treeNode = orderedNodes[i];

    selections.set(treeNode.id, {
      nodeId: treeNode.id,
      selected: decodedNode.selected,
      ranksPurchased:
        decodedNode.ranksPurchased ??
        (decodedNode.purchased ? treeNode.maxRanks : 0),
      choiceIndex: decodedNode.choiceIndex,
    });
  }

  return {
    ...tree,
    selections,
  };
};
```

## Phase 6: Portal Integration

### 6.1 API Route / Hook

Create `apps/portal/src/hooks/use-talent-tree.ts`:

```typescript
export function useTalentTree(specId: number) {
  return useQuery({
    queryKey: ["talent-tree", specId],
    queryFn: () => fetchTalentTree(specId),
    staleTime: Infinity, // Tree structure doesn't change
  });
}
```

### 6.2 Canvas/D3 Renderer Component

Create `apps/portal/src/components/talents/`:

- `talent-tree.tsx` - Main container
- `talent-tree-canvas.tsx` - Canvas renderer (or D3)
- `talent-node.tsx` - Individual node rendering
- `talent-edge.tsx` - Edge/connection rendering

Key rendering considerations:

```typescript
// Position scaling
const SCALE_FACTOR = 0.01; // Convert PosX/PosY (0-9000) to pixels

// Node dimensions
const NODE_SIZE = 40;
const CHOICE_NODE_SIZE = 44;

// Colors
const SELECTED_COLOR = "#ffcc00";
const UNSELECTED_COLOR = "#666666";
const HERO_TREE_COLORS = {
  42: "#8b0000", // Dark Ranger
  43: "#228b22", // Pack Leader
  44: "#4169e1", // Sentinel
};
```

## Phase 7: Quick Sim Integration

### 7.1 Update Character Import Flow

In `apps/portal/src/components/simulate/quick-sim-content.tsx`:

1. After parsing SimC profile, decode talents
2. Fetch talent tree for detected specId
3. Apply decoded talents to tree
4. Render talent tree preview below equipment

```typescript
const talentString = simcProfile.talents.encoded;
const decoded = decodeTalentLoadout(talentString);
const tree = useTalentTree(decoded.specId);
const treeWithSelections = applyDecodedTalents(tree, decoded);
```

## File Structure

```
packages/wowlab-core/src/internal/schemas/
├── dbc/
│   ├── TraitTreeSchema.ts (DONE)
│   ├── TraitNodeSchema.ts (DONE)
│   ├── TraitEdgeSchema.ts (DONE)
│   ├── TraitTreeLoadoutSchema.ts (DONE)
│   └── TraitTreeLoadoutEntrySchema.ts (DONE)
└── talent/
    └── TalentTypes.ts (NEW)

packages/wowlab-services/src/internal/data/
├── dbc/
│   ├── DbcService.ts (EXTEND)
│   └── InMemoryDbcService.ts (EXTEND)
└── transformer/
    ├── extractors.ts (EXTEND)
    └── talent.ts (NEW)

apps/portal/src/
├── hooks/
│   └── use-talent-tree.ts (NEW)
└── components/
    └── talents/
        ├── talent-tree.tsx (NEW)
        ├── talent-tree-canvas.tsx (NEW)
        ├── talent-node.tsx (NEW)
        └── talent-edge.tsx (NEW)
```

## Implementation Order

1. **Phase 1**: Output types in wowlab-core (30 min)
2. **Phase 2**: DbcService interface + implementation (1-2 hours)
3. **Phase 3**: Extractor methods for talent icon/name/description (30 min)
4. **Phase 4**: transformTalentTree function (1 hour)
5. **Phase 5**: applyDecodedTalents function (30 min)
6. **Phase 6**: Portal hook + canvas renderer (2-3 hours)
7. **Phase 7**: Quick sim integration (30 min)

## Open Questions

1. **Renderer choice**: Canvas vs D3.js vs SVG?
   - Canvas: Better performance for many nodes, existing timeline code uses it
   - D3: Better for complex interactions, easier edge drawing with curves
   - SVG: Simpler, but may be slow with many elements

2. **Tree layout**: Use PosX/PosY from data, or compute our own layout?
   - PosX/PosY from data matches game layout
   - Could use dagre/elkjs for automatic layout if needed

3. **Caching**: Cache full tree in localStorage? CDN edge cache?
   - Tree structure is static per patch
   - Could pre-generate and cache as JSON

4. **Hero talent visibility**: Show all 3 hero trees or only selected one?
   - Raidbots shows only selected hero tree
   - Could show all with only selected one highlighted
