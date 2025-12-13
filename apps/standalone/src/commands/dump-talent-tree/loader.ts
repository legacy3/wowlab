import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  DbcChrClass,
  DbcChrSpecialization,
  DbcManifestInterfaceData,
  DbcSpecSetMember,
  DbcSpell,
  DbcSpellMisc,
  DbcSpellName,
  DbcTraitCond,
  DbcTraitDefinition,
  DbcTraitEdge,
  DbcTraitNode,
  DbcTraitNodeEntry,
  DbcTraitNodeGroupXTraitCond,
  DbcTraitNodeGroupXTraitNode,
  DbcTraitNodeXTraitNodeEntry,
  DbcTraitSubTree,
  DbcTraitTreeLoadout,
  DbcTraitTreeLoadoutEntry,
} from "./db-types.js";
import type {
  TalentNode,
  TalentNodeEntry,
  TalentSubTree,
  TalentTree,
} from "./types.js";

const queryDbc = async <T>(
  supabase: SupabaseClient,
  table: string,
  fn: (
    builder: ReturnType<ReturnType<SupabaseClient["schema"]>["from"]>,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> => {
  const result = await fn(supabase.schema("raw_dbc").from(table));
  if (result.error) {
    throw new Error(`Query error on ${table}: ${result.error.message}`);
  }
  return result.data as T;
};

export const loadTalentTree = async (
  supabase: SupabaseClient,
  specId: number,
): Promise<TalentTree> => {
  const spec = await queryDbc<DbcChrSpecialization | null>(
    supabase,
    "chr_specialization",
    (b) => b.select("*").eq("ID", specId).maybeSingle(),
  );
  if (!spec) {
    throw new Error(`Spec ${specId} not found`);
  }

  const chrClass = await queryDbc<DbcChrClass | null>(
    supabase,
    "chr_classes",
    (b) => b.select("*").eq("ID", spec.ClassID).maybeSingle(),
  );
  if (!chrClass) {
    throw new Error(`Class ${spec.ClassID} not found`);
  }

  const loadouts = await queryDbc<DbcTraitTreeLoadout[]>(
    supabase,
    "trait_tree_loadout",
    (b) => b.select("*").eq("ChrSpecializationID", specId).limit(1),
  );
  const loadout = loadouts[0];
  if (!loadout) {
    throw new Error(`Loadout for spec ${specId} not found`);
  }

  const loadoutEntries = await queryDbc<DbcTraitTreeLoadoutEntry[]>(
    supabase,
    "trait_tree_loadout_entry",
    (b) =>
      b.select("*").eq("TraitTreeLoadoutID", loadout.ID).order("OrderIndex"),
  );

  const orderIndexMap = new Map<number, number>();
  for (const entry of loadoutEntries) {
    orderIndexMap.set(entry.SelectedTraitNodeID, entry.OrderIndex);
  }

  const treeNodes = await queryDbc<DbcTraitNode[]>(
    supabase,
    "trait_node",
    (b) => b.select("*").eq("TraitTreeID", loadout.TraitTreeID),
  );

  const nodeIds = treeNodes.map((n) => n.ID);
  const allEdges = await queryDbc<DbcTraitEdge[]>(supabase, "trait_edge", (b) =>
    b.select("*").in("LeftTraitNodeID", nodeIds),
  );
  const edges = allEdges.filter((e) => nodeIds.includes(e.RightTraitNodeID));

  const availableSubTreeIds = await getAvailableHeroSubTrees(
    supabase,
    treeNodes,
    specId,
  );

  const subTreeData = await loadSubTreeData(supabase, availableSubTreeIds);

  const filteredNodes = treeNodes.filter(
    (n) =>
      n.TraitSubTreeID === 0 || availableSubTreeIds.includes(n.TraitSubTreeID),
  );
  const filteredNodeIds = filteredNodes.map((n) => n.ID);

  const filteredEdges = edges.filter(
    (e) =>
      filteredNodeIds.includes(e.LeftTraitNodeID) &&
      filteredNodeIds.includes(e.RightTraitNodeID),
  );

  const { definitionMap, entryMap, nodeXEntriesByNode } =
    await loadNodeDefinitions(supabase, filteredNodeIds);

  const { iconMap, spellMap, spellMiscMap, spellNameMap } = await loadSpellData(
    supabase,
    [...definitionMap.values()],
  );

  const heroTreeOffsets = calculateHeroTreeOffsets(
    filteredNodes,
    availableSubTreeIds,
  );

  const nodes = buildNodes(
    filteredNodes,
    nodeXEntriesByNode,
    entryMap,
    definitionMap,
    spellNameMap,
    spellMap,
    spellMiscMap,
    iconMap,
    orderIndexMap,
    heroTreeOffsets,
  );

  const subTrees = buildSubTrees(subTreeData, nodes);

  return {
    className: chrClass.Name_lang ?? "",
    edges: filteredEdges.map((e) => ({
      fromNodeId: e.LeftTraitNodeID,
      id: e.ID,
      toNodeId: e.RightTraitNodeID,
      visualStyle: e.VisualStyle,
    })),
    nodes,
    specId,
    specName: spec.Name_lang ?? "",
    subTrees,
    treeId: loadout.TraitTreeID,
  };
};

const getAvailableHeroSubTrees = async (
  supabase: SupabaseClient,
  treeNodes: DbcTraitNode[],
  specId: number,
): Promise<number[]> => {
  const subTreeIds = [
    ...new Set(treeNodes.map((n) => n.TraitSubTreeID).filter((id) => id > 0)),
  ];
  const heroNodeIds = treeNodes
    .filter((n) => n.TraitSubTreeID > 0)
    .map((n) => n.ID);

  if (heroNodeIds.length === 0) {
    return [];
  }

  const nodeGroupMemberships = await queryDbc<DbcTraitNodeGroupXTraitNode[]>(
    supabase,
    "trait_node_group_x_trait_node",
    (b) => b.select("*").in("TraitNodeID", heroNodeIds),
  );

  const heroNodeGroupIds = [
    ...new Set(nodeGroupMemberships.map((m) => m.TraitNodeGroupID)),
  ];

  if (heroNodeGroupIds.length === 0) {
    return subTreeIds;
  }

  const groupConditions = await queryDbc<DbcTraitNodeGroupXTraitCond[]>(
    supabase,
    "trait_node_group_x_trait_cond",
    (b) => b.select("*").in("TraitNodeGroupID", heroNodeGroupIds),
  );

  const condIds = [...new Set(groupConditions.map((gc) => gc.TraitCondID))];
  if (condIds.length === 0) {
    return subTreeIds;
  }

  const conditions = await queryDbc<DbcTraitCond[]>(
    supabase,
    "trait_cond",
    (b) => b.select("*").in("ID", condIds).gt("SpecSetID", 0),
  );

  const specSetIds = [...new Set(conditions.map((c) => c.SpecSetID))];
  if (specSetIds.length === 0) {
    return subTreeIds;
  }

  const specSetMembers = await queryDbc<DbcSpecSetMember[]>(
    supabase,
    "spec_set_member",
    (b) => b.select("*").in("SpecSet", specSetIds),
  );

  const subTreeSpecRestrictions = new Map<number, Set<number>>();

  for (const membership of nodeGroupMemberships) {
    const node = treeNodes.find((n) => n.ID === membership.TraitNodeID);
    if (!node || node.TraitSubTreeID === 0) {
      continue;
    }

    const groupConds = groupConditions.filter(
      (gc) => gc.TraitNodeGroupID === membership.TraitNodeGroupID,
    );

    for (const gc of groupConds) {
      const cond = conditions.find((c) => c.ID === gc.TraitCondID);
      if (!cond) {
        continue;
      }

      const allowedSpecs = specSetMembers
        .filter((ssm) => ssm.SpecSet === cond.SpecSetID)
        .map((ssm) => ssm.ChrSpecializationID);

      const existing = subTreeSpecRestrictions.get(node.TraitSubTreeID);
      if (!existing) {
        subTreeSpecRestrictions.set(node.TraitSubTreeID, new Set(allowedSpecs));
      } else {
        for (const s of allowedSpecs) {
          existing.add(s);
        }
      }
    }
  }

  return subTreeIds.filter((stId) => {
    const restrictions = subTreeSpecRestrictions.get(stId);
    if (!restrictions || restrictions.size === 0) {
      return true;
    }
    return restrictions.has(specId);
  });
};

const loadSubTreeData = async (
  supabase: SupabaseClient,
  subTreeIds: number[],
): Promise<Array<{ id: number; name: string; description: string }>> => {
  const result: Array<{ id: number; name: string; description: string }> = [];

  for (const subTreeId of subTreeIds) {
    const subTree = await queryDbc<DbcTraitSubTree | null>(
      supabase,
      "trait_sub_tree",
      (b) => b.select("*").eq("ID", subTreeId).maybeSingle(),
    );
    if (subTree) {
      result.push({
        description: subTree.Description_lang ?? "",
        id: subTree.ID,
        name: subTree.Name_lang ?? "",
      });
    }
  }

  return result;
};

const loadNodeDefinitions = async (
  supabase: SupabaseClient,
  nodeIds: number[],
): Promise<{
  entryMap: Map<number, DbcTraitNodeEntry>;
  definitionMap: Map<number, DbcTraitDefinition>;
  nodeXEntriesByNode: Map<number, DbcTraitNodeXTraitNodeEntry[]>;
}> => {
  const allNodeXEntries = await queryDbc<DbcTraitNodeXTraitNodeEntry[]>(
    supabase,
    "trait_node_x_trait_node_entry",
    (b) => b.select("*").in("TraitNodeID", nodeIds),
  );

  const entryIds = [...new Set(allNodeXEntries.map((x) => x.TraitNodeEntryID))];
  const allEntries = await queryDbc<DbcTraitNodeEntry[]>(
    supabase,
    "trait_node_entry",
    (b) => b.select("*").in("ID", entryIds),
  );
  const entryMap = new Map(allEntries.map((e) => [e.ID, e]));

  const definitionIds = [
    ...new Set(allEntries.map((e) => e.TraitDefinitionID)),
  ];
  const allDefinitions = await queryDbc<DbcTraitDefinition[]>(
    supabase,
    "trait_definition",
    (b) => b.select("*").in("ID", definitionIds),
  );
  const definitionMap = new Map(allDefinitions.map((d) => [d.ID, d]));

  const nodeXEntriesByNode = new Map<number, DbcTraitNodeXTraitNodeEntry[]>();
  for (const nxe of allNodeXEntries) {
    const existing = nodeXEntriesByNode.get(nxe.TraitNodeID) ?? [];
    existing.push(nxe);
    nodeXEntriesByNode.set(nxe.TraitNodeID, existing);
  }

  return { definitionMap, entryMap, nodeXEntriesByNode };
};

const loadSpellData = async (
  supabase: SupabaseClient,
  definitions: DbcTraitDefinition[],
): Promise<{
  spellNameMap: Map<number, DbcSpellName>;
  spellMap: Map<number, DbcSpell>;
  spellMiscMap: Map<number, DbcSpellMisc>;
  iconMap: Map<number, DbcManifestInterfaceData>;
}> => {
  const spellIds = [
    ...new Set(definitions.map((d) => d.SpellID).filter((id) => id > 0)),
  ];

  const [allSpellNames, allSpells, allSpellMisc] = await Promise.all([
    queryDbc<DbcSpellName[]>(supabase, "spell_name", (b) =>
      b.select("*").in("ID", spellIds),
    ),
    queryDbc<DbcSpell[]>(supabase, "spell", (b) =>
      b.select("*").in("ID", spellIds),
    ),
    queryDbc<DbcSpellMisc[]>(supabase, "spell_misc", (b) =>
      b.select("*").in("SpellID", spellIds),
    ),
  ]);

  const spellNameMap = new Map(allSpellNames.map((s) => [s.ID, s]));
  const spellMap = new Map(allSpells.map((s) => [s.ID, s]));
  const spellMiscMap = new Map(allSpellMisc.map((m) => [m.SpellID, m]));

  const overrideIconIds = definitions
    .map((d) => d.OverrideIcon)
    .filter((id) => id > 0);
  const spellIconIds = allSpellMisc
    .map((m) => m.SpellIconFileDataID)
    .filter((id): id is number => id !== null && id > 0);
  const iconIds = [...new Set([...overrideIconIds, ...spellIconIds])];

  const allIcons =
    iconIds.length > 0
      ? await queryDbc<DbcManifestInterfaceData[]>(
          supabase,
          "manifest_interface_data",
          (b) => b.select("*").in("ID", iconIds),
        )
      : [];
  const iconMap = new Map(allIcons.map((i) => [i.ID, i]));

  return { iconMap, spellMap, spellMiscMap, spellNameMap };
};

const calculateHeroTreeOffsets = (
  nodes: DbcTraitNode[],
  subTreeIds: number[],
): Map<number, { offsetX: number; offsetY: number }> => {
  const TARGET_HERO_X = 7500;
  const TARGET_HERO_Y = 1200;
  const offsets = new Map<number, { offsetX: number; offsetY: number }>();

  for (const subTreeId of subTreeIds) {
    const heroNodes = nodes.filter((n) => n.TraitSubTreeID === subTreeId);
    if (heroNodes.length === 0) {
      continue;
    }

    const minX = Math.min(...heroNodes.map((n) => n.PosX));
    const minY = Math.min(...heroNodes.map((n) => n.PosY));
    offsets.set(subTreeId, {
      offsetX: TARGET_HERO_X - minX,
      offsetY: TARGET_HERO_Y - minY,
    });
  }

  return offsets;
};

const buildNodes = (
  treeNodes: DbcTraitNode[],
  nodeXEntriesByNode: Map<number, DbcTraitNodeXTraitNodeEntry[]>,
  entryMap: Map<number, DbcTraitNodeEntry>,
  definitionMap: Map<number, DbcTraitDefinition>,
  spellNameMap: Map<number, DbcSpellName>,
  spellMap: Map<number, DbcSpell>,
  spellMiscMap: Map<number, DbcSpellMisc>,
  iconMap: Map<number, DbcManifestInterfaceData>,
  orderIndexMap: Map<number, number>,
  heroTreeOffsets: Map<number, { offsetX: number; offsetY: number }>,
): TalentNode[] => {
  return treeNodes.map((node) => {
    const nodeXEntries = nodeXEntriesByNode.get(node.ID) ?? [];
    const entries: TalentNodeEntry[] = [];
    let maxRanks = 1;

    for (const nodeXEntry of nodeXEntries) {
      const entry = entryMap.get(nodeXEntry.TraitNodeEntryID);
      if (!entry) {
        continue;
      }

      const definition = definitionMap.get(entry.TraitDefinitionID);
      if (!definition) {
        continue;
      }

      let name = definition.OverrideName_lang ?? "";
      if (!name && definition.SpellID > 0) {
        name = spellNameMap.get(definition.SpellID)?.Name_lang ?? "";
      }

      let description = definition.OverrideDescription_lang ?? "";
      if (!description && definition.SpellID > 0) {
        description = spellMap.get(definition.SpellID)?.Description_lang ?? "";
      }

      let iconFileDataId = definition.OverrideIcon;
      if (iconFileDataId === 0 && definition.SpellID > 0) {
        iconFileDataId =
          spellMiscMap.get(definition.SpellID)?.SpellIconFileDataID ?? 0;
      }

      let iconFileName = "inv_misc_questionmark";
      if (iconFileDataId > 0) {
        const manifest = iconMap.get(iconFileDataId);
        if (manifest?.FileName) {
          iconFileName = manifest.FileName.toLowerCase().replace(".blp", "");
        }
      }

      if (entries.length === 0) {
        maxRanks = entry.MaxRanks;
      }

      entries.push({
        definitionId: definition.ID,
        description,
        iconFileName,
        id: entry.ID,
        name,
        spellId: definition.SpellID,
      });
    }

    let posX = node.PosX;
    let posY = node.PosY;
    if (node.TraitSubTreeID > 0) {
      const offset = heroTreeOffsets.get(node.TraitSubTreeID);
      if (offset) {
        posX += offset.offsetX;
        posY += offset.offsetY;
      }
    }

    return {
      entries,
      id: node.ID,
      maxRanks,
      orderIndex: orderIndexMap.get(node.ID) ?? -1,
      posX,
      posY,
      subTreeId: node.TraitSubTreeID,
      type: node.Type,
    };
  });
};

const buildSubTrees = (
  subTreeData: Array<{ id: number; name: string; description: string }>,
  nodes: TalentNode[],
): TalentSubTree[] => {
  return subTreeData.map((st) => {
    const firstHeroNode = nodes.find((n) => n.subTreeId === st.id);
    const iconFileName =
      firstHeroNode?.entries[0]?.iconFileName || "inv_misc_questionmark";

    return {
      description: st.description,
      iconFileName,
      id: st.id,
      name: st.name,
    };
  });
};
