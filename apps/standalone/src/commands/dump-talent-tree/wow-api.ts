/**
 * WoW API Mirror - C_Traits, C_ClassTalents, C_SpecializationInfo
 *
 * Exact mirror of WoW API functions and return types.
 * See: Interface/AddOns/Blizzard_APIDocumentationGenerated/SharedTraitsDocumentation.lua
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TalentEdge,
  TalentEntry,
  TalentGate,
  TalentNode,
  TalentSubTree,
  TalentTree,
} from "./types.js";

// =============================================================================
// Enums - Exact WoW enums
// =============================================================================

export enum TraitConditionType {
  Available = 0,
  DisplayError = 4,
  Granted = 2,
  Increased = 3,
  RanksAllowed = 5,
  Visible = 1,
}

export enum TraitEdgeType {
  DeprecatedRankConnection = 1,
  DeprecatedSelectionOption = 5,
  MutuallyExclusive = 4,
  RequiredForAvailability = 3,
  SufficientForAvailability = 2,
  VisualOnly = 0,
}

export enum TraitEdgeVisualStyle {
  None = 0,
  Straight = 1,
}

export enum TraitNodeEntryType {
  ArmorSet = 11,
  DeprecatedSelect = 4,
  DragAndDrop = 5,
  ProfPath = 7,
  ProfPathUnlock = 9,
  ProfPerk = 8,
  RedButton = 10,
  SpendCircle = 2,
  SpendDiamond = 6,
  SpendHex = 0,
  SpendInfinite = 12,
  SpendSmallCircle = 3,
  SpendSquare = 1,
}

export enum TraitNodeType {
  Selection = 2,
  Single = 0,
  SubTreeSelection = 3,
  Tiered = 1,
}

// =============================================================================
// Types - Exact WoW API return types
// =============================================================================

/** ClassInfo - custom type for class data */
export interface ClassInfo {
  classID: number;
  name: string;
}

/** SpecializationInfo - custom type for spec data */
export interface SpecializationInfo {
  classID: number;
  name: string;
  specID: number;
}

/** SpellInfo - custom type for spell data */
export interface SpellInfo {
  description: string | null;
  iconFileDataID: number;
  name: string;
  spellID: number;
}

/** TraitCondInfo from WoW API */
export interface TraitCondInfo {
  condID: number;
  isAlwaysMet: boolean;
  isGate: boolean;
  isMet: boolean;
  isSufficient: boolean;
  playerLevel: number | null;
  questID: number | null;
  ranksGranted: number | null;
  specSetID: number | null;
  spentAmountRequired: number | null;
  traitCurrencyID: number | null;
  type: TraitConditionType;
}

/** TraitDefinitionInfo from WoW API */
export interface TraitDefinitionInfo {
  overriddenSpellID: number | null;
  overrideDescription: string | null;
  overrideIcon: number | null;
  overrideName: string | null;
  overrideSubtext: string | null;
  spellID: number | null;
}

/** TraitEntryInfo from WoW API */
export interface TraitEntryInfo {
  conditionIDs: number[];
  definitionID: number | null;
  isAvailable: boolean;
  maxRanks: number;
  subTreeID: number | null;
  type: TraitNodeEntryType;
}

/** TraitGateInfo from WoW API */
export interface TraitGateInfo {
  conditionID: number;
  topLeftNodeID: number;
}

/** TraitNodeInfo from WoW API */
export interface TraitNodeInfo {
  activeRank: number;
  conditionIDs: number[];
  entryIDs: number[];
  flags: number;
  groupIDs: number[];
  ID: number;
  isAvailable: boolean;
  isVisible: boolean;
  maxRanks: number;
  meetsEdgeRequirements: boolean;
  posX: number;
  posY: number;
  ranksPurchased: number;
  subTreeID: number | null;
  type: TraitNodeType;
  visibleEdges: TraitOutEdgeInfo[];
}

/** TraitOutEdgeInfo from WoW API */
export interface TraitOutEdgeInfo {
  isActive: boolean;
  targetNode: number;
  type: TraitEdgeType;
  visualStyle: TraitEdgeVisualStyle;
}

/** TraitSubTreeInfo from WoW API */
export interface TraitSubTreeInfo {
  description: string | null;
  iconElementID: string | null;
  ID: number;
  isActive: boolean;
  name: string | null;
  posX: number;
  posY: number;
  subTreeSelectionNodeIDs: number[];
  traitCurrencyID: number | null;
}

/** TraitTreeInfo from WoW API */
export interface TraitTreeInfo {
  gates: TraitGateInfo[];
  hideSingleRankNumbers: boolean;
  ID: number;
}

// =============================================================================
// Helper
// =============================================================================

/**
 * Get all classes (custom - not exact WoW API)
 */
export async function GetAllClasses(
  supabase: SupabaseClient,
): Promise<ClassInfo[]> {
  const classes = await query<Array<{ ID: number; Name_lang: string }>>(
    supabase,
    "chr_classes",
    (b) => b.select("ID, Name_lang").not("ID", "in", "(14,15)"),
  );

  return classes.map((c) => ({
    classID: c.ID,
    name: c.Name_lang,
  }));
}

// =============================================================================
// C_SpecializationInfo
// =============================================================================

/**
 * Get all specializations (custom - not exact WoW API)
 */
export async function GetAllSpecializations(
  supabase: SupabaseClient,
): Promise<SpecializationInfo[]> {
  const specs = await query<
    Array<{ ID: number; Name_lang: string; ClassID: number }>
  >(supabase, "chr_specialization", (b) =>
    b.select("ID, Name_lang, ClassID").neq("Name_lang", "Initial"),
  );

  return specs.map((s) => ({
    classID: s.ClassID,
    name: s.Name_lang,
    specID: s.ID,
  }));
}

/**
 * Get available subtrees for a spec (from SubTreeSelection nodes visible to this spec)
 */
export async function GetAvailableSubTreesForSpec(
  supabase: SupabaseClient,
  treeID: number,
  specID: number,
): Promise<number[]> {
  // Get SubTreeSelection nodes (Type=3) in this tree
  const { data: selectionNodes } = await supabase
    .schema("raw_dbc")
    .from("trait_node")
    .select("ID")
    .eq("TraitTreeID", treeID)
    .eq("Type", 3);

  if (!selectionNodes || selectionNodes.length === 0) return [];

  const nodeIDs = selectionNodes.map((n: { ID: number }) => n.ID);

  // Get visibility conditions for these nodes
  const { data: nodeConds } = await supabase
    .schema("raw_dbc")
    .from("trait_node_x_trait_cond")
    .select("TraitNodeID, TraitCondID")
    .in("TraitNodeID", nodeIDs);

  if (!nodeConds || nodeConds.length === 0) return [];

  const condIDs = [
    ...new Set(nodeConds.map((nc: { TraitCondID: number }) => nc.TraitCondID)),
  ];

  // Get conditions
  const { data: conds } = await supabase
    .schema("raw_dbc")
    .from("trait_cond")
    .select("ID, SpecSetID")
    .eq("TraitTreeID", treeID)
    .eq("CondType", 1)
    .in("ID", condIDs);

  if (!conds || conds.length === 0) return [];

  // Get spec sets that contain our spec
  const specSetIDs = [
    ...new Set(
      conds
        .map((c: { SpecSetID: number }) => c.SpecSetID)
        .filter((id: number) => id > 0),
    ),
  ];

  const { data: specSets } = await supabase
    .schema("raw_dbc")
    .from("spec_set_member")
    .select("SpecSet")
    .eq("ChrSpecializationID", specID)
    .in("SpecSet", specSetIDs);

  const validSpecSets = new Set(
    (specSets ?? []).map((s: { SpecSet: number }) => s.SpecSet),
  );

  // Find nodes visible to this spec
  const visibleCondIDs = new Set(
    conds
      .filter((c: { SpecSetID: number }) => validSpecSets.has(c.SpecSetID))
      .map((c: { ID: number }) => c.ID),
  );

  const visibleNodeIDs = new Set(
    nodeConds
      .filter((nc: { TraitCondID: number }) =>
        visibleCondIDs.has(nc.TraitCondID),
      )
      .map((nc: { TraitNodeID: number }) => nc.TraitNodeID),
  );

  if (visibleNodeIDs.size === 0) return [];

  // Get entries from visible nodes
  const { data: nodeEntries } = await supabase
    .schema("raw_dbc")
    .from("trait_node_x_trait_node_entry")
    .select("TraitNodeEntryID")
    .in("TraitNodeID", [...visibleNodeIDs]);

  const entryIDs = (nodeEntries ?? []).map(
    (ne: { TraitNodeEntryID: number }) => ne.TraitNodeEntryID,
  );

  if (entryIDs.length === 0) return [];

  // Get subtree IDs from entries
  const { data: entries } = await supabase
    .schema("raw_dbc")
    .from("trait_node_entry")
    .select("TraitSubTreeID")
    .in("ID", entryIDs);

  return (entries ?? [])
    .map((e: { TraitSubTreeID: number | null }) => e.TraitSubTreeID)
    .filter((id: number | null): id is number => id !== null && id > 0);
}

// =============================================================================
// C_ClassTalents
// =============================================================================

/**
 * C_Traits.GetConditionInfo(configID, condID)
 */
export async function GetConditionInfo(
  supabase: SupabaseClient,
  condID: number,
): Promise<TraitCondInfo | null> {
  const { data: cond, error } = await supabase
    .schema("raw_dbc")
    .from("trait_cond")
    .select(
      "ID, CondType, Flags, SpecSetID, SpentAmountRequired, TraitCurrencyID, RequiredLevel",
    )
    .eq("ID", condID)
    .single();

  if (error || !cond) return null;

  return {
    condID: cond.ID,
    isAlwaysMet: false,
    isGate: (cond.Flags & 1) !== 0,
    isMet: true,
    isSufficient: false,
    playerLevel: cond.RequiredLevel > 0 ? cond.RequiredLevel : null,
    questID: null,
    ranksGranted: null,
    specSetID: cond.SpecSetID > 0 ? cond.SpecSetID : null,
    spentAmountRequired:
      cond.SpentAmountRequired > 0 ? cond.SpentAmountRequired : null,
    traitCurrencyID: cond.TraitCurrencyID > 0 ? cond.TraitCurrencyID : null,
    type: cond.CondType as TraitConditionType,
  };
}

// =============================================================================
// C_Traits
// =============================================================================

/**
 * C_Traits.GetDefinitionInfo(definitionID)
 */
export async function GetDefinitionInfo(
  supabase: SupabaseClient,
  definitionID: number,
): Promise<TraitDefinitionInfo | null> {
  const { data: def, error } = await supabase
    .schema("raw_dbc")
    .from("trait_definition")
    .select(
      "ID, SpellID, OverridesSpellID, VisibleSpellID, OverrideName_lang, OverrideSubtext_lang, OverrideDescription_lang, OverrideIcon",
    )
    .eq("ID", definitionID)
    .single();

  if (error || !def) return null;

  return {
    overriddenSpellID: def.OverridesSpellID > 0 ? def.OverridesSpellID : null,
    overrideDescription: def.OverrideDescription_lang,
    overrideIcon: def.OverrideIcon > 0 ? def.OverrideIcon : null,
    overrideName: def.OverrideName_lang,
    overrideSubtext: def.OverrideSubtext_lang,
    spellID: def.SpellID > 0 ? def.SpellID : null,
  };
}

/**
 * C_Traits.GetEntryInfo(configID, entryID)
 */
export async function GetEntryInfo(
  supabase: SupabaseClient,
  entryID: number,
): Promise<TraitEntryInfo | null> {
  const { data: entry, error } = await supabase
    .schema("raw_dbc")
    .from("trait_node_entry")
    .select("ID, TraitDefinitionID, MaxRanks, NodeEntryType, TraitSubTreeID")
    .eq("ID", entryID)
    .single();

  if (error || !entry) return null;

  // Get conditions
  const { data: condMappings } = await supabase
    .schema("raw_dbc")
    .from("trait_node_entry_x_trait_cond")
    .select("TraitCondID")
    .eq("TraitNodeEntryID", entryID);

  const conditionIDs = (condMappings ?? []).map(
    (c: { TraitCondID: number }) => c.TraitCondID,
  );

  return {
    conditionIDs,
    definitionID: entry.TraitDefinitionID,
    isAvailable: true,
    maxRanks: entry.MaxRanks ?? 1,
    subTreeID: entry.TraitSubTreeID > 0 ? entry.TraitSubTreeID : null,
    type: (entry.NodeEntryType ?? 0) as TraitNodeEntryType,
  };
}

/**
 * C_Traits.GetNodeInfo(configID, nodeID)
 */
export async function GetNodeInfo(
  supabase: SupabaseClient,
  nodeID: number,
): Promise<TraitNodeInfo | null> {
  // Get node
  const { data: node, error: nodeErr } = await supabase
    .schema("raw_dbc")
    .from("trait_node")
    .select("ID, PosX, PosY, Type, Flags, TraitSubTreeID, TraitTreeID")
    .eq("ID", nodeID)
    .single();

  if (nodeErr || !node) return null;

  // Get entries
  const { data: entryMappings } = await supabase
    .schema("raw_dbc")
    .from("trait_node_x_trait_node_entry")
    .select("TraitNodeEntryID, _Index")
    .eq("TraitNodeID", nodeID)
    .order("_Index", { ascending: true });

  const entryIDs = (entryMappings ?? []).map(
    (e: { TraitNodeEntryID: number }) => e.TraitNodeEntryID,
  );

  // Get maxRanks from entries
  let maxRanks = 1;
  if (entryIDs.length > 0) {
    const { data: entries } = await supabase
      .schema("raw_dbc")
      .from("trait_node_entry")
      .select("MaxRanks")
      .in("ID", entryIDs);
    if (entries) {
      maxRanks = Math.max(
        ...entries.map((e: { MaxRanks: number }) => e.MaxRanks ?? 1),
      );
    }
  }

  // Get edges (visibleEdges)
  const { data: edges } = await supabase
    .schema("raw_dbc")
    .from("trait_edge")
    .select("RightTraitNodeID, Type, VisualStyle")
    .eq("LeftTraitNodeID", nodeID);

  const visibleEdges: TraitOutEdgeInfo[] = (edges ?? []).map(
    (e: { RightTraitNodeID: number; Type: number; VisualStyle: number }) => ({
      isActive: true,
      targetNode: e.RightTraitNodeID,
      type: e.Type as TraitEdgeType,
      visualStyle: e.VisualStyle as TraitEdgeVisualStyle,
    }),
  );

  // Get conditions
  const { data: condMappings } = await supabase
    .schema("raw_dbc")
    .from("trait_node_x_trait_cond")
    .select("TraitCondID")
    .eq("TraitNodeID", nodeID);

  const conditionIDs = (condMappings ?? []).map(
    (c: { TraitCondID: number }) => c.TraitCondID,
  );

  // Get groups
  const { data: groupMappings } = await supabase
    .schema("raw_dbc")
    .from("trait_node_group_x_trait_node")
    .select("TraitNodeGroupID")
    .eq("TraitNodeID", nodeID);

  const groupIDs = (groupMappings ?? []).map(
    (g: { TraitNodeGroupID: number }) => g.TraitNodeGroupID,
  );

  return {
    activeRank: 0,
    conditionIDs,
    entryIDs,
    flags: node.Flags ?? 0,
    groupIDs,
    ID: node.ID,
    isAvailable: true,
    isVisible: true,
    maxRanks,
    meetsEdgeRequirements: true,
    posX: node.PosX,
    posY: node.PosY,
    ranksPurchased: 0,
    subTreeID: node.TraitSubTreeID > 0 ? node.TraitSubTreeID : null,
    type: node.Type as TraitNodeType,
    visibleEdges,
  };
}

/**
 * GetSpellInfo - Get spell name, description, and icon
 */
export async function GetSpellInfo(
  supabase: SupabaseClient,
  spellID: number,
): Promise<SpellInfo | null> {
  // Get name
  const { data: nameData } = await supabase
    .schema("raw_dbc")
    .from("spell_name")
    .select("Name_lang")
    .eq("ID", spellID)
    .single();

  if (!nameData) return null;

  // Get icon
  const { data: miscData } = await supabase
    .schema("raw_dbc")
    .from("spell_misc")
    .select("SpellIconFileDataID")
    .eq("SpellID", spellID)
    .eq("DifficultyID", 0)
    .single();

  return {
    description: null,
    iconFileDataID: miscData?.SpellIconFileDataID ?? 0,
    name: nameData.Name_lang,
    spellID,
  };
}

/**
 * C_Traits.GetSubTreeInfo(configID, subTreeID)
 */
export async function GetSubTreeInfo(
  supabase: SupabaseClient,
  subTreeID: number,
): Promise<TraitSubTreeInfo | null> {
  const { data: subTree, error } = await supabase
    .schema("raw_dbc")
    .from("trait_sub_tree")
    .select(
      "ID, Name_lang, Description_lang, UiTextureAtlasElementID, TraitTreeID",
    )
    .eq("ID", subTreeID)
    .single();

  if (error || !subTree) return null;

  // Get icon atlas name
  let iconElementID: string | null = null;
  if (subTree.UiTextureAtlasElementID > 0) {
    const { data: atlas } = await supabase
      .schema("raw_dbc")
      .from("ui_texture_atlas_element")
      .select("Name")
      .eq("ID", subTree.UiTextureAtlasElementID)
      .single();
    if (atlas) {
      iconElementID = atlas.Name.toLowerCase();
    }
  }

  // Get nodes in this subtree to calculate posX/posY
  const { data: nodes } = await supabase
    .schema("raw_dbc")
    .from("trait_node")
    .select("PosX, PosY")
    .eq("TraitSubTreeID", subTreeID);

  let posX = 0;
  let posY = 0;
  if (nodes && nodes.length > 0) {
    const xs = nodes.map((n: { PosX: number }) => n.PosX);
    const ys = nodes.map((n: { PosY: number }) => n.PosY);
    posX = (Math.min(...xs) + Math.max(...xs)) / 2;
    posY = Math.min(...ys);
  }

  // Get SubTreeSelection nodes that reference this subtree
  const { data: selectionEntries } = await supabase
    .schema("raw_dbc")
    .from("trait_node_entry")
    .select("ID")
    .eq("TraitSubTreeID", subTreeID);

  const entryIDs = (selectionEntries ?? []).map((e: { ID: number }) => e.ID);
  let subTreeSelectionNodeIDs: number[] = [];

  if (entryIDs.length > 0) {
    const { data: nodeMappings } = await supabase
      .schema("raw_dbc")
      .from("trait_node_x_trait_node_entry")
      .select("TraitNodeID")
      .in("TraitNodeEntryID", entryIDs);
    subTreeSelectionNodeIDs = [
      ...new Set(
        (nodeMappings ?? []).map((m: { TraitNodeID: number }) => m.TraitNodeID),
      ),
    ];
  }

  return {
    description: subTree.Description_lang,
    iconElementID,
    ID: subTree.ID,
    isActive: false,
    name: subTree.Name_lang,
    posX,
    posY,
    subTreeSelectionNodeIDs,
    traitCurrencyID: null,
  };
}

/**
 * C_ClassTalents.GetTraitTreeForSpec(specID)
 */
export async function GetTraitTreeForSpec(
  supabase: SupabaseClient,
  specID: number,
): Promise<number | null> {
  const { data: loadouts } = await supabase
    .schema("raw_dbc")
    .from("trait_tree_loadout")
    .select("TraitTreeID")
    .eq("ChrSpecializationID", specID);

  if (!loadouts || loadouts.length === 0) return null;

  const treeIDs = [
    ...new Set(loadouts.map((l: { TraitTreeID: number }) => l.TraitTreeID)),
  ];

  const { data: trees } = await supabase
    .schema("raw_dbc")
    .from("trait_tree")
    .select("ID, TraitSystemID")
    .in("ID", treeIDs);

  const mainTree = (trees ?? []).find(
    (t: { TraitSystemID: number }) => t.TraitSystemID === 0,
  );
  return mainTree?.ID ?? null;
}

/**
 * C_Traits.GetTreeInfo(configID, treeID)
 */
export async function GetTreeInfo(
  supabase: SupabaseClient,
  treeID: number,
): Promise<TraitTreeInfo | null> {
  const { data: tree, error } = await supabase
    .schema("raw_dbc")
    .from("trait_tree")
    .select("ID, Flags")
    .eq("ID", treeID)
    .single();

  if (error || !tree) return null;

  // Get gates (conditions with SpentAmountRequired > 0)
  const { data: conds } = await supabase
    .schema("raw_dbc")
    .from("trait_cond")
    .select("ID, TraitNodeGroupID, SpentAmountRequired")
    .eq("TraitTreeID", treeID)
    .gt("SpentAmountRequired", 0);

  const gates: TraitGateInfo[] = [];

  for (const cond of conds ?? []) {
    if (cond.TraitNodeGroupID > 0) {
      // Get nodes in this group
      const { data: groupNodes } = await supabase
        .schema("raw_dbc")
        .from("trait_node_group_x_trait_node")
        .select("TraitNodeID")
        .eq("TraitNodeGroupID", cond.TraitNodeGroupID)
        .order("_Index", { ascending: true })
        .limit(1);

      if (groupNodes && groupNodes.length > 0) {
        gates.push({
          conditionID: cond.ID,
          topLeftNodeID: groupNodes[0].TraitNodeID,
        });
      }
    }
  }

  return {
    gates,
    hideSingleRankNumbers: false,
    ID: tree.ID,
  };
}

/**
 * C_Traits.GetTreeNodes(treeID)
 *
 * Returns a list of nodeIDs, sorted ascending, for a given treeID.
 * Contains nodes for ALL class specializations.
 */
export async function GetTreeNodes(
  supabase: SupabaseClient,
  treeID: number,
): Promise<number[]> {
  const { data, error } = await supabase
    .schema("raw_dbc")
    .from("trait_node")
    .select("ID")
    .eq("TraitTreeID", treeID)
    .order("ID", { ascending: true });

  if (error) throw new Error(`GetTreeNodes: ${error.message}`);
  return (data ?? []).map((r: { ID: number }) => r.ID);
}

// =============================================================================
// Spell Info (custom helpers)
// =============================================================================

/**
 * Get all SubTrees for a tree
 */
export async function GetTreeSubTrees(
  supabase: SupabaseClient,
  treeID: number,
): Promise<number[]> {
  const { data, error } = await supabase
    .schema("raw_dbc")
    .from("trait_sub_tree")
    .select("ID")
    .eq("TraitTreeID", treeID);

  if (error) throw new Error(`GetTreeSubTrees: ${error.message}`);
  return (data ?? []).map((r: { ID: number }) => r.ID);
}

/**
 * Get nodes that are visible to a specific spec
 */
export async function GetVisibleNodesForSpec(
  supabase: SupabaseClient,
  treeID: number,
  specID: number,
): Promise<Set<number>> {
  // Get all nodes in tree
  const allNodeIDs = await GetTreeNodes(supabase, treeID);
  const visibleNodes = new Set<number>(allNodeIDs);

  // Get visibility conditions (CondType=1) for this tree
  const { data: conds } = await supabase
    .schema("raw_dbc")
    .from("trait_cond")
    .select("ID, SpecSetID")
    .eq("TraitTreeID", treeID)
    .eq("CondType", 1);

  if (!conds || conds.length === 0) return visibleNodes;

  // Get spec sets that contain our spec
  const specSetIDs = [
    ...new Set(
      conds
        .filter((c: { SpecSetID: number }) => c.SpecSetID > 0)
        .map((c: { SpecSetID: number }) => c.SpecSetID),
    ),
  ];

  const { data: specSets } = await supabase
    .schema("raw_dbc")
    .from("spec_set_member")
    .select("SpecSet")
    .eq("ChrSpecializationID", specID)
    .in("SpecSet", specSetIDs);

  const validSpecSets = new Set(
    (specSets ?? []).map((s: { SpecSet: number }) => s.SpecSet),
  );

  // Find conditions that hide nodes from this spec
  const hidingCondIDs = new Set(
    conds
      .filter(
        (c: { ID: number; SpecSetID: number }) =>
          c.SpecSetID > 0 && !validSpecSets.has(c.SpecSetID),
      )
      .map((c: { ID: number }) => c.ID),
  );

  if (hidingCondIDs.size === 0) return visibleNodes;

  // Get node groups with hiding conditions
  const { data: groupConds } = await supabase
    .schema("raw_dbc")
    .from("trait_node_group_x_trait_cond")
    .select("TraitNodeGroupID, TraitCondID");

  const hidingGroupIDs = new Set(
    (groupConds ?? [])
      .filter((gc: { TraitCondID: number }) =>
        hidingCondIDs.has(gc.TraitCondID),
      )
      .map((gc: { TraitNodeGroupID: number }) => gc.TraitNodeGroupID),
  );

  if (hidingGroupIDs.size === 0) return visibleNodes;

  // Get nodes in hiding groups
  const { data: groupNodes } = await supabase
    .schema("raw_dbc")
    .from("trait_node_group_x_trait_node")
    .select("TraitNodeID")
    .in("TraitNodeGroupID", [...hidingGroupIDs]);

  for (const gn of groupNodes ?? []) {
    visibleNodes.delete(gn.TraitNodeID);
  }

  return visibleNodes;
}

// =============================================================================
// Visibility helpers (spec filtering)
// =============================================================================

/**
 * Check if a spec is in a spec set
 */
export async function IsSpecInSpecSet(
  supabase: SupabaseClient,
  specID: number,
  specSetID: number,
): Promise<boolean> {
  const { data } = await supabase
    .schema("raw_dbc")
    .from("spec_set_member")
    .select("ChrSpecializationID")
    .eq("SpecSet", specSetID)
    .eq("ChrSpecializationID", specID)
    .single();

  return data !== null;
}

/**
 * Load a complete talent tree for a spec using WoW API functions.
 */
export async function LoadTalentTree(
  supabase: SupabaseClient,
  specID: number,
  specName: string,
  classID: number,
  className: string,
): Promise<TalentTree | null> {
  // C_ClassTalents.GetTraitTreeForSpec
  const treeID = await GetTraitTreeForSpec(supabase, specID);
  if (!treeID) return null;

  console.log(`  Loading tree ${treeID}...`);

  // Get visible nodes and available subtrees for this spec
  const [visibleNodeIDs, availableSubTreeIDs] = await Promise.all([
    GetVisibleNodesForSpec(supabase, treeID, specID),
    GetAvailableSubTreesForSpec(supabase, treeID, specID),
  ]);

  const availableSubTreeSet = new Set(availableSubTreeIDs);

  // C_Traits.GetTreeNodes - get all nodes, then filter
  const allNodeIDs = await GetTreeNodes(supabase, treeID);

  // Build nodes using C_Traits.GetNodeInfo
  const nodes: TalentNode[] = [];
  const allEdges: TalentEdge[] = [];
  const nodeIDsInTree = new Set<number>();

  for (const nodeID of allNodeIDs) {
    // Skip nodes not visible to this spec (unless in available subtree)
    const nodeInfo = await GetNodeInfo(supabase, nodeID);
    if (!nodeInfo) continue;

    const isInAvailableSubTree =
      nodeInfo.subTreeID !== null &&
      availableSubTreeSet.has(nodeInfo.subTreeID);

    // Filter: visible OR in available subtree
    if (!visibleNodeIDs.has(nodeID) && !isInAvailableSubTree) continue;

    // Skip nodes in subtrees not available to this spec
    if (
      nodeInfo.subTreeID !== null &&
      availableSubTreeIDs.length > 0 &&
      !availableSubTreeSet.has(nodeInfo.subTreeID)
    ) {
      continue;
    }

    nodeIDsInTree.add(nodeID);

    // Build entries using C_Traits.GetEntryInfo and C_Traits.GetDefinitionInfo
    const entries: TalentEntry[] = [];
    for (const entryID of nodeInfo.entryIDs) {
      const entryInfo = await GetEntryInfo(supabase, entryID);
      if (!entryInfo) continue;

      let name: string | null = null;
      let description: string | null = null;
      let iconFileName: string | null = null;
      let spellID: number | null = null;

      if (entryInfo.definitionID) {
        const defInfo = await GetDefinitionInfo(
          supabase,
          entryInfo.definitionID,
        );
        if (defInfo) {
          name = defInfo.overrideName;
          description = defInfo.overrideDescription;
          spellID = defInfo.spellID;

          // Resolve icon
          if (defInfo.overrideIcon) {
            iconFileName = await ResolveIconFileName(
              supabase,
              defInfo.overrideIcon,
            );
          }

          // Fall back to spell info
          if (defInfo.spellID && (!name || !iconFileName)) {
            const spellInfo = await GetSpellInfo(supabase, defInfo.spellID);
            if (spellInfo) {
              if (!name) name = spellInfo.name;
              if (!iconFileName && spellInfo.iconFileDataID) {
                iconFileName = await ResolveIconFileName(
                  supabase,
                  spellInfo.iconFileDataID,
                );
              }
            }
          }
        }
      }

      entries.push({
        definitionId: entryInfo.definitionID,
        description,
        iconFileName,
        id: entryID,
        maxRanks: entryInfo.maxRanks,
        name,
        spellId: spellID,
        subTreeId: entryInfo.subTreeID,
        type: entryInfo.type,
      });
    }

    // Convert position (Blizzard uses 10x scale, Y is inverted)
    const pixelX = nodeInfo.posX / 10;
    const pixelY = -nodeInfo.posY / 10;

    nodes.push({
      entries,
      flags: nodeInfo.flags,
      id: nodeID,
      pixelX,
      pixelY,
      subTreeId: nodeInfo.subTreeID,
      type: nodeInfo.type,
    });

    // Collect edges from visibleEdges
    for (const edge of nodeInfo.visibleEdges) {
      allEdges.push({
        sourceNodeId: nodeID,
        targetNodeId: edge.targetNode,
        type: edge.type,
        visualStyle: edge.visualStyle,
      });
    }
  }

  // Filter edges to only include those between nodes in tree
  const edges = allEdges.filter(
    (e) =>
      nodeIDsInTree.has(e.sourceNodeId) && nodeIDsInTree.has(e.targetNodeId),
  );

  // Build subtrees using C_Traits.GetSubTreeInfo
  const subTrees: TalentSubTree[] = [];
  for (const subTreeID of availableSubTreeIDs) {
    const subTreeInfo = await GetSubTreeInfo(supabase, subTreeID);
    if (!subTreeInfo) continue;

    const nodeIds = nodes
      .filter((n) => n.subTreeId === subTreeID)
      .map((n) => n.id);

    // Get icon - try atlas first, fall back to first node's icon
    let iconFileName = subTreeInfo.iconElementID;
    if (!iconFileName && nodeIds.length > 0) {
      const firstNode = nodes.find((n) => n.id === nodeIds[0]);
      if (firstNode && firstNode.entries.length > 0) {
        iconFileName = firstNode.entries[0].iconFileName;
      }
    }

    subTrees.push({
      description: subTreeInfo.description,
      iconFileName,
      id: subTreeID,
      name: subTreeInfo.name,
      nodeIds,
    });
  }

  // Build gates using C_Traits.GetTreeInfo
  const gates: TalentGate[] = [];
  const treeInfo = await GetTreeInfo(supabase, treeID);
  if (treeInfo) {
    for (const gate of treeInfo.gates) {
      const condInfo = await GetConditionInfo(supabase, gate.conditionID);
      if (condInfo && condInfo.spentAmountRequired) {
        gates.push({
          conditionId: gate.conditionID,
          spentAmountRequired: condInfo.spentAmountRequired,
          topLeftNodeId: gate.topLeftNodeID,
        });
      }
    }
  }

  // Calculate bounds
  const xs = nodes.map((n) => n.pixelX);
  const ys = nodes.map((n) => n.pixelY);

  const bounds = {
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
  };

  return {
    bounds,
    classId: classID,
    className,
    edges,
    gates,
    nodes,
    specId: specID,
    specName,
    subTrees,
    treeId: treeID,
  };
}

/**
 * ResolveIconFileName - Convert FileDataID to icon filename
 */
export async function ResolveIconFileName(
  supabase: SupabaseClient,
  fileDataID: number,
): Promise<string | null> {
  if (fileDataID <= 0) return null;

  const { data } = await supabase
    .schema("raw_dbc")
    .from("manifest_interface_data")
    .select("FileName")
    .eq("ID", fileDataID)
    .single();

  if (!data) return null;

  // Extract filename without path and extension, lowercase
  return data.FileName.toLowerCase().split("/").pop()?.split(".")[0] ?? null;
}

// =============================================================================
// LoadTalentTree - Build TalentTree using WoW API functions
// =============================================================================

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
