import type { SupabaseClient } from "@supabase/supabase-js";

import {
  calculatePixelPosition,
  calculateRow,
  type RawTraitCond,
  type RawTraitDefinition,
  type RawTraitEdge,
  type RawTraitNode,
  type RawTraitNodeEntry,
  type RawTraitSubTree,
  type TalentEdge,
  type TalentEntry,
  type TalentGate,
  type TalentNode,
  type TalentSubTree,
  type TalentTree,
  type TraitEdgeType,
  type TraitEdgeVisualStyle,
  type TraitNodeType,
} from "./types.js";

const CHUNK_SIZE = 500;

/**
 * Get all specializations.
 */
export async function getAllSpecs(
  supabase: SupabaseClient,
): Promise<Array<{ specId: number; specName: string; classId: number }>> {
  const specs = await query<
    Array<{ ID: number; Name_lang: string; ClassID: number }>
  >(supabase, "chr_specialization", (b) =>
    b.select("ID, Name_lang, ClassID").neq("Name_lang", "Initial"),
  );

  return specs.map((s) => ({
    classId: s.ClassID,
    specId: s.ID,
    specName: s.Name_lang,
  }));
}

/**
 * Get class names.
 */
export async function getClasses(
  supabase: SupabaseClient,
): Promise<Map<number, string>> {
  const classes = await query<Array<{ ID: number; Name_lang: string }>>(
    supabase,
    "chr_classes",
    (b) => b.select("ID, Name_lang").not("ID", "in", "(14,15)"),
  );

  return new Map(classes.map((c) => [c.ID, c.Name_lang]));
}

/**
 * Get tree ID for a specialization.
 */
export async function getTreeIdForSpec(
  supabase: SupabaseClient,
  specId: number,
): Promise<number | null> {
  const loadouts = await query<Array<{ TraitTreeID: number }>>(
    supabase,
    "trait_tree_loadout",
    (b) => b.select("TraitTreeID").eq("ChrSpecializationID", specId),
  );

  if (loadouts.length === 0) {
    return null;
  }

  // Get trees and filter to main talent trees (TraitSystemID = 0)
  const treeIds = [...new Set(loadouts.map((l) => l.TraitTreeID))];
  const trees = await query<Array<{ ID: number; TraitSystemID: number }>>(
    supabase,
    "trait_tree",
    (b) => b.select("ID, TraitSystemID").in("ID", treeIds),
  );

  const mainTree = trees.find((t) => t.TraitSystemID === 0);

  return mainTree?.ID ?? null;
}

/**
 * Get available sub-tree IDs for a spec.
 * This finds the SubTreeSelection node visible to the spec and returns the sub-tree IDs from its entries.
 *
 * Data flow (verified from DB):
 * - SubTreeSelection nodes (Type=3) have visibility conditions via trait_node_x_trait_cond
 * - Each condition references a SpecSetID which maps to specs via spec_set_member
 * - For Mage tree 658:
 *   - Node 99828 → SpecSet 22 → Frost (64) → SubTrees 41, 40
 *   - Node 99829 → SpecSet 23 → Fire (63) → SubTrees 41, 39
 *   - Node 99830 → SpecSet 21 → Arcane (62) → SubTrees 40, 39
 */
async function getAvailableSubTreeIds(
  supabase: SupabaseClient,
  treeId: number,
  specId: number,
): Promise<number[]> {
  // Use raw SQL to find SubTreeSelection nodes visible to this spec
  // Supabase nested selects don't work without FK relationships
  const { data: nodeResult, error: nodeError } = await supabase.rpc(
    "get_visible_subtree_selection_nodes",
    { p_tree_id: treeId, p_spec_id: specId },
  );

  // Fallback if RPC doesn't exist - use direct SQL
  let subTreeSelectionNodeIds: number[] = [];

  if (nodeError || !nodeResult) {
    // Manual join approach
    const { data: nodes } = await supabase
      .schema("raw_dbc")
      .from("trait_node")
      .select("ID")
      .eq("TraitTreeID", treeId)
      .eq("Type", 3);

    if (!nodes || nodes.length === 0) {
      return [];
    }

    const allNodeIds = nodes.map((n: { ID: number }) => n.ID);

    // Get conditions linked to these nodes
    const { data: nodeConds } = await supabase
      .schema("raw_dbc")
      .from("trait_node_x_trait_cond")
      .select("TraitNodeID, TraitCondID")
      .in("TraitNodeID", allNodeIds);

    if (!nodeConds || nodeConds.length === 0) {
      return [];
    }

    const condIds = [
      ...new Set(
        nodeConds.map((nc: { TraitCondID: number }) => nc.TraitCondID),
      ),
    ];

    // Get visibility conditions for this tree
    const { data: conds } = await supabase
      .schema("raw_dbc")
      .from("trait_cond")
      .select("ID, SpecSetID")
      .eq("TraitTreeID", treeId)
      .eq("CondType", 1)
      .in("ID", condIds);

    if (!conds || conds.length === 0) {
      return [];
    }

    // Get spec sets that contain our spec
    const specSetIds = [
      ...new Set(conds.map((c: { SpecSetID: number }) => c.SpecSetID)),
    ];
    const { data: specSets } = await supabase
      .schema("raw_dbc")
      .from("spec_set_member")
      .select("SpecSet")
      .eq("ChrSpecializationID", specId)
      .in("SpecSet", specSetIds);

    if (!specSets || specSets.length === 0) {
      return [];
    }

    const validSpecSets = new Set(
      specSets.map((s: { SpecSet: number }) => s.SpecSet),
    );
    const validCondIds = new Set(
      conds
        .filter((c: { SpecSetID: number }) => validSpecSets.has(c.SpecSetID))
        .map((c: { ID: number }) => c.ID),
    );

    subTreeSelectionNodeIds = nodeConds
      .filter((nc: { TraitCondID: number }) => validCondIds.has(nc.TraitCondID))
      .map((nc: { TraitNodeID: number }) => nc.TraitNodeID);
  } else {
    subTreeSelectionNodeIds = nodeResult.map(
      (r: { node_id: number }) => r.node_id,
    );
  }

  if (subTreeSelectionNodeIds.length === 0) {
    return [];
  }

  // Get entries from these nodes
  const nodeEntries = await query<
    Array<{ TraitNodeID: number; TraitNodeEntryID: number }>
  >(supabase, "trait_node_x_trait_node_entry", (b) =>
    b
      .select("TraitNodeID, TraitNodeEntryID")
      .in("TraitNodeID", subTreeSelectionNodeIds),
  );

  const entryIds = nodeEntries.map((ne) => ne.TraitNodeEntryID);

  if (entryIds.length === 0) {
    return [];
  }

  // Get the sub-tree IDs from these entries
  const entries = await query<
    Array<{ ID: number; TraitSubTreeID: number | null }>
  >(supabase, "trait_node_entry", (b) =>
    b.select("ID, TraitSubTreeID").in("ID", entryIds),
  );

  return entries
    .map((e) => e.TraitSubTreeID)
    .filter((id): id is number => id !== null && id > 0);
}

/**
 * Get node IDs that should be hidden for a spec based on node group visibility conditions.
 *
 * Spec-specific talents are filtered via node groups:
 * - trait_node → trait_node_group_x_trait_node → trait_node_group
 * - trait_node_group → trait_node_group_x_trait_cond → trait_cond (CondType=1, SpecSetID)
 * - If SpecSetID doesn't contain our spec, the node is hidden
 *
 * For example, Aimed Shot (node 103982) is in group 8352 with SpecSetID=14 → Marksmanship only
 */
async function getHiddenNodeIdsForSpec(
  supabase: SupabaseClient,
  treeId: number,
  specId: number,
): Promise<Set<number>> {
  const hiddenNodeIds = new Set<number>();

  // 1. Get all node groups for this tree with visibility conditions (CondType=1)
  const { data: groupConds } = await supabase
    .schema("raw_dbc")
    .from("trait_node_group_x_trait_cond")
    .select("TraitNodeGroupID, TraitCondID");

  if (!groupConds || groupConds.length === 0) {
    return hiddenNodeIds;
  }

  const allCondIds = [
    ...new Set(groupConds.map((gc: { TraitCondID: number }) => gc.TraitCondID)),
  ];

  // 2. Get visibility conditions (CondType=1) for this tree
  const { data: conds } = await supabase
    .schema("raw_dbc")
    .from("trait_cond")
    .select("ID, SpecSetID")
    .eq("TraitTreeID", treeId)
    .eq("CondType", 1)
    .in("ID", allCondIds);

  if (!conds || conds.length === 0) {
    return hiddenNodeIds;
  }

  // 3. Get spec sets that contain our spec
  const specSetIds = [
    ...new Set(
      conds
        .map((c: { SpecSetID: number }) => c.SpecSetID)
        .filter((id: number) => id > 0),
    ),
  ];

  if (specSetIds.length === 0) {
    return hiddenNodeIds;
  }

  const { data: specSets } = await supabase
    .schema("raw_dbc")
    .from("spec_set_member")
    .select("SpecSet")
    .eq("ChrSpecializationID", specId)
    .in("SpecSet", specSetIds);

  const validSpecSets = new Set(
    (specSets ?? []).map((s: { SpecSet: number }) => s.SpecSet),
  );

  // 4. Find conditions that have a SpecSetID that does NOT contain our spec
  // These are visibility conditions that hide nodes from our spec
  const hidingCondIds = new Set(
    conds
      .filter(
        (c: { ID: number; SpecSetID: number }) =>
          c.SpecSetID > 0 && !validSpecSets.has(c.SpecSetID),
      )
      .map((c: { ID: number }) => c.ID),
  );

  if (hidingCondIds.size === 0) {
    return hiddenNodeIds;
  }

  // 5. Find node groups that use these hiding conditions
  const hidingGroupIds = new Set(
    groupConds
      .filter((gc: { TraitCondID: number }) => hidingCondIds.has(gc.TraitCondID))
      .map((gc: { TraitNodeGroupID: number }) => gc.TraitNodeGroupID),
  );

  if (hidingGroupIds.size === 0) {
    return hiddenNodeIds;
  }

  // 6. Get all nodes in these hiding groups
  const { data: nodeGroupMappings } = await supabase
    .schema("raw_dbc")
    .from("trait_node_group_x_trait_node")
    .select("TraitNodeGroupID, TraitNodeID")
    .in("TraitNodeGroupID", [...hidingGroupIds]);

  if (nodeGroupMappings) {
    for (const mapping of nodeGroupMappings) {
      hiddenNodeIds.add(mapping.TraitNodeID);
    }
  }

  return hiddenNodeIds;
}

/**
 * Load a complete talent tree for a specialization.
 */
export async function loadTalentTree(
  supabase: SupabaseClient,
  specId: number,
  specName: string,
  classId: number,
  className: string,
): Promise<TalentTree | null> {
  // 1. Get tree ID
  const treeId = await getTreeIdForSpec(supabase, specId);

  if (!treeId) {
    return null;
  }

  console.log(`  Loading tree ${treeId}...`);

  // 2. Load raw data (including available sub-tree IDs and hidden nodes for this spec)
  const [
    rawNodes,
    rawSubTreesUnfiltered,
    rawGateConds,
    availableSubTreeIds,
    hiddenNodeIds,
  ] = await Promise.all([
    loadNodes(supabase, treeId),
    loadSubTrees(supabase, treeId),
    loadGates(supabase, treeId),
    getAvailableSubTreeIds(supabase, treeId, specId),
    getHiddenNodeIdsForSpec(supabase, treeId, specId),
  ]);

  // Filter sub-trees to only those available for this spec
  // If no SubTreeSelection node found (e.g., class doesn't have hero talents), keep all
  const rawSubTrees =
    availableSubTreeIds.length > 0
      ? rawSubTreesUnfiltered.filter((st) => availableSubTreeIds.includes(st.ID))
      : rawSubTreesUnfiltered;

  const nodeIds = rawNodes.map((n) => n.ID);

  // 3. Load edges and entry mappings
  const [rawEdges, nodeEntryMappings] = await Promise.all([
    loadEdges(supabase, nodeIds),
    loadNodeEntryMappings(supabase, nodeIds),
  ]);

  // 4. Get all entry IDs and load entries
  const allEntryIds = [...new Set([...nodeEntryMappings.values()].flat())];
  const entries = await loadEntries(supabase, allEntryIds);

  // 5. Get all definition IDs and load definitions
  const definitionIds = [...entries.values()]
    .map((e) => e.TraitDefinitionID)
    .filter((id): id is number => id !== null);
  const definitions = await loadDefinitions(supabase, definitionIds);

  // 6. Get all spell IDs and load spell info
  const spellIds = [...definitions.values()]
    .map((d) => d.SpellID)
    .filter((id): id is number => id !== null && id > 0);
  const spellInfo = await loadSpellInfo(supabase, spellIds);

  // 7. Collect all icon FileDataIDs and resolve to filenames
  const iconFileDataIds: number[] = [];

  // From definition overrides
  for (const def of definitions.values()) {
    if (def.OverrideIcon && def.OverrideIcon > 0) {
      iconFileDataIds.push(def.OverrideIcon);
    }
  }

  // From spell info
  for (const spell of spellInfo.values()) {
    if (spell.iconFileDataId > 0) {
      iconFileDataIds.push(spell.iconFileDataId);
    }
  }

  const iconFilenames = await resolveIconFilenames(supabase, iconFileDataIds);

  // 8. Load atlas element names for subtree icons
  const atlasElementIds = rawSubTrees
    .map((st) => st.UiTextureAtlasElementID)
    .filter((id): id is number => id !== null && id > 0);
  const atlasElementNames = await loadAtlasElementNames(
    supabase,
    atlasElementIds,
  );

  // 9. Load gate node group mappings
  const gateGroupIds = rawGateConds
    .map((c) => c.TraitNodeGroupID)
    .filter((id) => id > 0);
  const nodeGroupNodes = await loadNodeGroupNodes(supabase, gateGroupIds);

  // 8. Build edge map (from source node to edges)
  const edgeMap = new Map<number, TalentEdge[]>();

  for (const edge of rawEdges) {
    const talentEdge: TalentEdge = {
      sourceNodeId: edge.LeftTraitNodeID,
      targetNodeId: edge.RightTraitNodeID,
      type: edge.Type as TraitEdgeType,
      visualStyle: edge.VisualStyle as TraitEdgeVisualStyle,
    };

    if (!edgeMap.has(edge.LeftTraitNodeID)) {
      edgeMap.set(edge.LeftTraitNodeID, []);
    }

    edgeMap.get(edge.LeftTraitNodeID)!.push(talentEdge);
  }

  // 11. Build nodes (filtering out nodes from unavailable sub-trees and hidden spec nodes)
  const availableSubTreeIdSet = new Set(availableSubTreeIds);
  const nodes: TalentNode[] = [];

  for (const rawNode of rawNodes) {
    // Skip nodes that belong to a sub-tree not available for this spec
    if (
      rawNode.TraitSubTreeID > 0 &&
      availableSubTreeIds.length > 0 &&
      !availableSubTreeIdSet.has(rawNode.TraitSubTreeID)
    ) {
      continue;
    }

    // Skip nodes that are hidden for this spec via node group visibility conditions
    // BUT don't filter nodes that are part of an available sub-tree (hero talents)
    const isInAvailableSubTree =
      rawNode.TraitSubTreeID > 0 && availableSubTreeIdSet.has(rawNode.TraitSubTreeID);
    if (!isInAvailableSubTree && hiddenNodeIds.has(rawNode.ID)) {
      continue;
    }

    const entryIds = nodeEntryMappings.get(rawNode.ID) ?? [];
    const nodeEntries = processEntries(
      entryIds,
      entries,
      definitions,
      spellInfo,
      iconFilenames,
    );
    // Filter edges to only include those to nodes that will be in the output
    const nodeEdges = (edgeMap.get(rawNode.ID) ?? []).filter((edge) => {
      // Check if target node is hidden for this spec
      if (hiddenNodeIds.has(edge.targetNodeId)) return false;

      // Check if target node is included (not filtered out due to sub-tree)
      const targetNode = rawNodes.find((n) => n.ID === edge.targetNodeId);
      if (!targetNode) return true;
      if (targetNode.TraitSubTreeID <= 0) return true;
      if (availableSubTreeIds.length === 0) return true;
      return availableSubTreeIdSet.has(targetNode.TraitSubTreeID);
    });
    const pixelPos = calculatePixelPosition(rawNode.PosX, rawNode.PosY);

    nodes.push({
      edges: nodeEdges,
      entries: nodeEntries,
      flags: rawNode.Flags ?? 0,
      id: rawNode.ID,
      pixelX: pixelPos.x,
      pixelY: pixelPos.y,
      posX: rawNode.PosX,
      posY: rawNode.PosY,
      row: calculateRow(rawNode.PosY),
      subTreeId: rawNode.TraitSubTreeID > 0 ? rawNode.TraitSubTreeID : null,
      type: rawNode.Type as TraitNodeType,
    });
  }

  // 10. Build all edges list (filtering out edges to/from unavailable sub-tree nodes)
  const includedNodeIds = new Set(nodes.map((n) => n.id));
  const allEdges: TalentEdge[] = rawEdges
    .filter(
      (e) =>
        includedNodeIds.has(e.LeftTraitNodeID) &&
        includedNodeIds.has(e.RightTraitNodeID),
    )
    .map((e) => ({
      sourceNodeId: e.LeftTraitNodeID,
      targetNodeId: e.RightTraitNodeID,
      type: e.Type as TraitEdgeType,
      visualStyle: e.VisualStyle as TraitEdgeVisualStyle,
    }));

  // 11. Build gates
  const gates: TalentGate[] = [];

  for (const cond of rawGateConds) {
    // Gate conditions have node groups that contain the nodes below the gate
    const groupNodes = nodeGroupNodes.get(cond.TraitNodeGroupID) ?? [];

    if (groupNodes.length > 0) {
      // Find the topmost-leftmost node in the group (gate position)
      const groupNodesData = nodes.filter((n) => groupNodes.includes(n.id));

      if (groupNodesData.length > 0) {
        // Sort by Y (ascending), then X (ascending) to get top-left
        groupNodesData.sort((a, b) => {
          if (a.posY !== b.posY) return a.posY - b.posY;

          return a.posX - b.posX;
        });

        gates.push({
          conditionId: cond.ID,
          currencyId: cond.TraitCurrencyID,
          spentAmountRequired: cond.SpentAmountRequired,
          topLeftNodeId: groupNodesData[0].id,
        });
      }
    }
  }

  // 14. Build sub-trees
  const subTrees: TalentSubTree[] = rawSubTrees.map((st) => {
    const positions = calculateSubTreePositions(st, rawNodes);
    const subTreeNodeIds = rawNodes
      .filter((n) => n.TraitSubTreeID === st.ID)
      .map((n) => n.ID);

    // Get atlas icon name, fallback to deriving from nodes
    let iconFileName = st.UiTextureAtlasElementID
      ? (atlasElementNames.get(st.UiTextureAtlasElementID) ?? null)
      : null;

    // If no atlas icon, try to derive from first node's entry
    if (!iconFileName && subTreeNodeIds.length > 0) {
      const firstNode = nodes.find((n) => n.id === subTreeNodeIds[0]);
      if (firstNode && firstNode.entries.length > 0) {
        iconFileName = firstNode.entries[0].iconFileName;
      }
    }

    return {
      centerX: positions.centerX,
      description: st.Description_lang,
      iconFileName,
      id: st.ID,
      name: st.Name_lang,
      nodeIds: subTreeNodeIds,
      topY: positions.topY,
    };
  });

  // 13. Calculate bounds
  const xs = nodes.map((n) => n.posX);
  const ys = nodes.map((n) => n.posY);

  const bounds = {
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
  };

  return {
    bounds,
    classId,
    className,
    edges: allEdges,
    gates,
    nodes,
    specId,
    specName,
    subTrees,
    treeId,
  };
}

/**
 * Calculate sub-tree positions (center X and top Y).
 */
function calculateSubTreePositions(
  subTree: RawTraitSubTree,
  nodes: RawTraitNode[],
): { centerX: number; topY: number } {
  const subTreeNodes = nodes.filter((n) => n.TraitSubTreeID === subTree.ID);

  if (subTreeNodes.length === 0) {
    return { centerX: 0, topY: 0 };
  }

  const xs = subTreeNodes.map((n) => n.PosX);
  const ys = subTreeNodes.map((n) => n.PosY);

  return {
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    topY: Math.min(...ys),
  };
}

/**
 * Load UI texture atlas element names (for subtree icons).
 */
async function loadAtlasElementNames(
  supabase: SupabaseClient,
  elementIds: number[],
): Promise<Map<number, string>> {
  if (elementIds.length === 0) return new Map();

  const names = new Map<number, string>();
  const uniqueIds = [...new Set(elementIds.filter((id) => id > 0))];

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ ID: number; Name: string }>>(
      supabase,
      "ui_texture_atlas_element",
      (b) => b.select("ID, Name").in("ID", chunk),
    );

    for (const row of rows) {
      names.set(row.ID, row.Name.toLowerCase());
    }
  }

  return names;
}

/**
 * Load trait definitions.
 */
async function loadDefinitions(
  supabase: SupabaseClient,
  definitionIds: number[],
): Promise<Map<number, RawTraitDefinition>> {
  if (definitionIds.length === 0) return new Map();

  const definitions = new Map<number, RawTraitDefinition>();
  const uniqueIds = [...new Set(definitionIds.filter((id) => id !== null))];

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<RawTraitDefinition[]>(
      supabase,
      "trait_definition",
      (b) =>
        b
          .select(
            "ID, SpellID, OverridesSpellID, VisibleSpellID, OverrideName_lang, OverrideSubtext_lang, OverrideDescription_lang, OverrideIcon",
          )
          .in("ID", chunk),
    );

    for (const row of rows) {
      definitions.set(row.ID, row);
    }
  }

  return definitions;
}

/**
 * Load all edges for a tree (edges between nodes in this tree).
 */
async function loadEdges(
  supabase: SupabaseClient,
  nodeIds: number[],
): Promise<RawTraitEdge[]> {
  if (nodeIds.length === 0) return [];

  const allEdges: RawTraitEdge[] = [];

  for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
    const chunk = nodeIds.slice(i, i + CHUNK_SIZE);
    const edges = await query<RawTraitEdge[]>(supabase, "trait_edge", (b) =>
      b
        .select("ID, VisualStyle, LeftTraitNodeID, RightTraitNodeID, Type")
        .in("LeftTraitNodeID", chunk),
    );

    allEdges.push(...edges);
  }

  return allEdges;
}

/**
 * Load trait node entries.
 */
async function loadEntries(
  supabase: SupabaseClient,
  entryIds: number[],
): Promise<Map<number, RawTraitNodeEntry>> {
  if (entryIds.length === 0) return new Map();

  const entries = new Map<number, RawTraitNodeEntry>();

  for (let i = 0; i < entryIds.length; i += CHUNK_SIZE) {
    const chunk = entryIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<RawTraitNodeEntry[]>(
      supabase,
      "trait_node_entry",
      (b) =>
        b
          .select(
            "ID, TraitDefinitionID, MaxRanks, NodeEntryType, TraitSubTreeID",
          )
          .in("ID", chunk),
    );

    for (const row of rows) {
      entries.set(row.ID, row);
    }
  }

  return entries;
}

/**
 * Load gate conditions for a tree.
 */
async function loadGates(
  supabase: SupabaseClient,
  treeId: number,
): Promise<RawTraitCond[]> {
  // Gates are conditions with CondType=0 (Available) and IsGate flag set (Flags & 1)
  // They have SpentAmountRequired > 0 and are associated with node groups
  return query<RawTraitCond[]>(supabase, "trait_cond", (b) =>
    b
      .select(
        "ID, CondType, Flags, SpecSetID, SpentAmountRequired, TraitCurrencyID, TraitNodeGroupID, TraitTreeID, RequiredLevel",
      )
      .eq("TraitTreeID", treeId)
      .gt("SpentAmountRequired", 0),
  );
}

/**
 * Load node-to-entry mappings.
 */
async function loadNodeEntryMappings(
  supabase: SupabaseClient,
  nodeIds: number[],
): Promise<Map<number, number[]>> {
  if (nodeIds.length === 0) return new Map();

  const mappings = new Map<number, number[]>();

  for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
    const chunk = nodeIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<
      Array<{ TraitNodeID: number; TraitNodeEntryID: number; _Index: number }>
    >(supabase, "trait_node_x_trait_node_entry", (b) =>
      b
        .select("TraitNodeID, TraitNodeEntryID, _Index")
        .in("TraitNodeID", chunk)
        .order("_Index", { ascending: true }),
    );

    for (const row of rows) {
      if (!mappings.has(row.TraitNodeID)) {
        mappings.set(row.TraitNodeID, []);
      }

      mappings.get(row.TraitNodeID)!.push(row.TraitNodeEntryID);
    }
  }

  return mappings;
}

/**
 * Load node group to node mappings.
 */
async function loadNodeGroupNodes(
  supabase: SupabaseClient,
  groupIds: number[],
): Promise<Map<number, number[]>> {
  if (groupIds.length === 0) return new Map();

  const mappings = new Map<number, number[]>();

  for (let i = 0; i < groupIds.length; i += CHUNK_SIZE) {
    const chunk = groupIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<
      Array<{ TraitNodeGroupID: number; TraitNodeID: number; _Index: number }>
    >(supabase, "trait_node_group_x_trait_node", (b) =>
      b
        .select("TraitNodeGroupID, TraitNodeID, _Index")
        .in("TraitNodeGroupID", chunk)
        .order("_Index", { ascending: true }),
    );

    for (const row of rows) {
      if (!mappings.has(row.TraitNodeGroupID)) {
        mappings.set(row.TraitNodeGroupID, []);
      }

      mappings.get(row.TraitNodeGroupID)!.push(row.TraitNodeID);
    }
  }

  return mappings;
}

/**
 * Load all nodes for a tree.
 */
async function loadNodes(
  supabase: SupabaseClient,
  treeId: number,
): Promise<RawTraitNode[]> {
  return query<RawTraitNode[]>(supabase, "trait_node", (b) =>
    b
      .select("ID, TraitTreeID, PosX, PosY, Type, Flags, TraitSubTreeID")
      .eq("TraitTreeID", treeId),
  );
}

/**
 * Load spell names and icons.
 */
async function loadSpellInfo(
  supabase: SupabaseClient,
  spellIds: number[],
): Promise<Map<number, { name: string; iconFileDataId: number }>> {
  if (spellIds.length === 0) return new Map();

  const spellInfo = new Map<number, { name: string; iconFileDataId: number }>();
  const uniqueIds = [
    ...new Set(spellIds.filter((id) => id !== null && id > 0)),
  ];

  // Load spell names
  const names = new Map<number, string>();

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ ID: number; Name_lang: string }>>(
      supabase,
      "spell_name",
      (b) => b.select("ID, Name_lang").in("ID", chunk),
    );

    for (const row of rows) {
      names.set(row.ID, row.Name_lang);
    }
  }

  // Load spell icons (FileDataID)
  const icons = new Map<number, number>();

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<
      Array<{ SpellID: number; SpellIconFileDataID: number }>
    >(supabase, "spell_misc", (b) =>
      b
        .select("SpellID, SpellIconFileDataID")
        .in("SpellID", chunk)
        .eq("DifficultyID", 0),
    );

    for (const row of rows) {
      if (row.SpellIconFileDataID > 0) {
        icons.set(row.SpellID, row.SpellIconFileDataID);
      }
    }
  }

  // Combine
  for (const id of uniqueIds) {
    const name = names.get(id);
    const iconFileDataId = icons.get(id);

    if (name !== undefined) {
      spellInfo.set(id, { iconFileDataId: iconFileDataId ?? 0, name });
    }
  }

  return spellInfo;
}

/**
 * Load sub-trees.
 */
async function loadSubTrees(
  supabase: SupabaseClient,
  treeId: number,
): Promise<RawTraitSubTree[]> {
  return query<RawTraitSubTree[]>(supabase, "trait_sub_tree", (b) =>
    b
      .select(
        "ID, Name_lang, Description_lang, UiTextureAtlasElementID, TraitTreeID",
      )
      .eq("TraitTreeID", treeId),
  );
}

/**
 * Process entries into TalentEntry objects.
 */
function processEntries(
  entryIds: number[],
  entries: Map<number, RawTraitNodeEntry>,
  definitions: Map<number, RawTraitDefinition>,
  spellInfo: Map<number, { name: string; iconFileDataId: number }>,
  iconFilenames: Map<number, string>,
): TalentEntry[] {
  const result: TalentEntry[] = [];

  for (const entryId of entryIds) {
    const entry = entries.get(entryId);

    if (!entry) continue;

    let spellId: number | null = null;
    let iconFileDataId: number | null = null;
    let name: string | null = null;
    let description: string | null = null;

    if (entry.TraitDefinitionID) {
      const def = definitions.get(entry.TraitDefinitionID);

      if (def) {
        spellId = def.SpellID;
        iconFileDataId = def.OverrideIcon ?? null;
        name = def.OverrideName_lang ?? null;
        description = def.OverrideDescription_lang ?? null;

        // Fall back to spell info if no override
        if (def.SpellID && spellInfo.has(def.SpellID)) {
          const spell = spellInfo.get(def.SpellID)!;

          if (!name) name = spell.name;
          if (!iconFileDataId) iconFileDataId = spell.iconFileDataId;
        }
      }
    }

    // Resolve icon filename
    const iconFileName = iconFileDataId
      ? (iconFilenames.get(iconFileDataId) ?? "inv_misc_questionmark")
      : null;

    result.push({
      definitionId: entry.TraitDefinitionID,
      description,
      iconFileName,
      id: entryId,
      maxRanks: entry.MaxRanks ?? 1,
      name,
      spellId,
      subTreeId: entry.TraitSubTreeID,
      type: entry.NodeEntryType ?? 0,
    });
  }

  return result;
}

/**
 * Execute a query against a raw_dbc table.
 */
async function query<T>(
  supabase: SupabaseClient,
  table: string,
  fn: (
    builder: ReturnType<ReturnType<SupabaseClient["schema"]>["from"]>,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const result = await fn(supabase.schema("raw_dbc").from(table));

  if (result.error) {
    throw new Error(`Query error on ${table}: ${result.error.message}`);
  }

  return result.data as T;
}

/**
 * Resolve icon FileDataIDs to filenames via manifest_interface_data.
 */
async function resolveIconFilenames(
  supabase: SupabaseClient,
  fileDataIds: number[],
): Promise<Map<number, string>> {
  if (fileDataIds.length === 0) return new Map();

  const filenames = new Map<number, string>();
  const uniqueIds = [...new Set(fileDataIds.filter((id) => id > 0))];

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
    const rows = await query<Array<{ ID: number; FileName: string }>>(
      supabase,
      "manifest_interface_data",
      (b) => b.select("ID, FileName").in("ID", chunk),
    );

    for (const row of rows) {
      // Extract filename without path and extension, lowercase
      const filename =
        row.FileName.toLowerCase().split("/").pop()?.split(".")[0] ??
        "inv_misc_questionmark";
      filenames.set(row.ID, filename);
    }
  }

  return filenames;
}
