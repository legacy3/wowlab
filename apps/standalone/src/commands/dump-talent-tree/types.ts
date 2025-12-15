/**
 * Blizzard Talent Tree Types
 *
 * These types mirror Blizzard's internal data structures as closely as possible.
 * Based on analysis of the official WoW UI source code.
 */

// =============================================================================
// Enumerations (from TraitConstantsDocumentation.lua)
// =============================================================================

/**
 * Condition type for gates and requirements.
 */
export enum TraitConditionType {
  Available = 0,
  DisplayError = 4,
  Granted = 2,
  Increased = 3,
  RanksAllowed = 5,
  Visible = 1,
}

/**
 * Edge type determines how nodes are connected.
 */
export enum TraitEdgeType {
  /** Visual only, no gameplay effect */
  VisualOnly = 0,
  /** Deprecated */
  DeprecatedRankConnection = 1,
  /** One of multiple paths (OR logic) */
  SufficientForAvailability = 2,
  /** Must be purchased (AND logic) */
  RequiredForAvailability = 3,
  /** Cannot both be selected */
  MutuallyExclusive = 4,
  /** Deprecated */
  DeprecatedSelectionOption = 5,
}

/**
 * Visual style for edge rendering.
 */
export enum TraitEdgeVisualStyle {
  None = 0,
  Straight = 1,
}

/**
 * Entry type determines the visual shape of the talent button.
 */
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

/**
 * Node flags that modify behavior.
 */
export enum TraitNodeFlag {
  ActiveAtFirstRank = 16,
  HideMaxRank = 64,
  HighestChosenRank = 128,
  NeverPurchasable = 2,
  ShowExpandedSelection = 32,
  ShowMultipleIcons = 1,
  TestGridPositioned = 8,
  TestPositionLocked = 4,
}

/**
 * Node type determines the visual and behavioral style of a talent node.
 */
export enum TraitNodeType {
  /** Basic talent node with single entry */
  Single = 0,
  /** Multi-rank node (deprecated, rarely used) */
  Tiered = 1,
  /** Choice between multiple talents */
  Selection = 2,
  /** Hero talent tree selection node */
  SubTreeSelection = 3,
}

// =============================================================================
// Core Data Structures
// =============================================================================

/**
 * Raw trait condition from trait_cond table.
 */
export interface RawTraitCond {
  CondType: number;
  Flags: number;
  ID: number;
  RequiredLevel: number;
  SpecSetID: number;
  SpentAmountRequired: number;
  TraitCurrencyID: number;
  TraitNodeGroupID: number;
  TraitTreeID: number;
}

/**
 * Raw trait definition from trait_definition table.
 */
export interface RawTraitDefinition {
  ID: number;
  OverrideDescription_lang: string | null;
  OverrideIcon: number | null;
  OverrideName_lang: string | null;
  OverridesSpellID: number | null;
  OverrideSubtext_lang: string | null;
  SpellID: number | null;
  VisibleSpellID: number | null;
}

/**
 * Raw trait edge from trait_edge table.
 */
export interface RawTraitEdge {
  ID: number;
  LeftTraitNodeID: number;
  RightTraitNodeID: number;
  Type: number;
  VisualStyle: number;
}

/**
 * Raw trait node from trait_node table.
 */
export interface RawTraitNode {
  Flags: number;
  ID: number;
  PosX: number;
  PosY: number;
  TraitSubTreeID: number;
  TraitTreeID: number;
  Type: number;
}

/**
 * Raw trait node entry from trait_node_entry table.
 */
export interface RawTraitNodeEntry {
  ID: number;
  MaxRanks: number;
  NodeEntryType: number;
  TraitDefinitionID: number | null;
  TraitSubTreeID: number | null;
}

/**
 * Raw trait node group from trait_node_group table.
 */
export interface RawTraitNodeGroup {
  Flags: number;
  ID: number;
  TraitTreeID: number;
}

/**
 * Raw trait sub-tree from trait_sub_tree table.
 */
export interface RawTraitSubTree {
  Description_lang: string | null;
  ID: number;
  Name_lang: string | null;
  TraitTreeID: number | null;
  UiTextureAtlasElementID: number | null;
}

/**
 * Raw trait tree from trait_tree table.
 */
export interface RawTraitTree {
  FirstTraitNodeID: number;
  Flags: number;
  ID: number;
  PlayerConditionID: number;
  TraitSystemID: number;
  TraitTreeID: number;
}

// =============================================================================
// Processed/Output Types
// =============================================================================

/**
 * Edge connecting two nodes.
 */
export interface TalentEdge {
  /** Source node ID */
  sourceNodeId: number;
  /** Target node ID */
  targetNodeId: number;
  /** Edge type */
  type: TraitEdgeType;
  /** Visual style */
  visualStyle: TraitEdgeVisualStyle;
}

/**
 * A single entry within a talent node (for Selection nodes, there are multiple).
 */
export interface TalentEntry {
  /** Definition ID (null for SubTreeSelection) */
  definitionId: number | null;
  /** Description (from definition override or spell) */
  description: string | null;
  /** Icon filename (resolved from manifest_interface_data) */
  iconFileName: string | null;
  /** Entry ID */
  id: number;
  /** Maximum ranks for this entry */
  maxRanks: number;
  /** Name (from definition override or spell) */
  name: string | null;
  /** Spell ID from definition */
  spellId: number | null;
  /** Sub-tree ID if this entry activates a hero tree */
  subTreeId: number | null;
  /** Visual type */
  type: TraitNodeEntryType;
}

/**
 * A gate that blocks access to nodes below it.
 */
export interface TalentGate {
  /** Condition ID */
  conditionId: number;
  /** Currency ID */
  currencyId: number;
  /** Amount of currency that must be spent */
  spentAmountRequired: number;
  /** First node ID after the gate */
  topLeftNodeId: number;
}

/**
 * A talent node in the tree.
 */
export interface TalentNode {
  /** Edges from this node to other nodes */
  edges: TalentEdge[];
  /** Entries for this node (1 for Single, 2+ for Selection) */
  entries: TalentEntry[];
  /** Node flags */
  flags: number;
  /** Node ID */
  id: number;
  /** Pixel X position */
  pixelX: number;
  /** Pixel Y position */
  pixelY: number;
  /** Raw X position (divide by 10 for pixels) */
  posX: number;
  /** Raw Y position (negate and divide by 10 for pixels) */
  posY: number;
  /** Row index calculated from position */
  row: number;
  /** Sub-tree ID if part of a hero talent tree */
  subTreeId: number | null;
  /** Node type */
  type: TraitNodeType;
}

/**
 * A hero talent sub-tree.
 */
export interface TalentSubTree {
  /** Center X position of all nodes */
  centerX: number;
  /** Description */
  description: string | null;
  /** Icon filename (resolved from ui_texture_atlas_element) */
  iconFileName: string | null;
  /** Sub-tree ID */
  id: number;
  /** Display name */
  name: string | null;
  /** Nodes in this sub-tree */
  nodeIds: number[];
  /** Topmost Y position of all nodes */
  topY: number;
}

/**
 * Complete talent tree for a specialization.
 */
export interface TalentTree {
  /** Bounding box */
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  /** Class ID */
  classId: number;
  /** Class name */
  className: string;
  /** All edges in the tree */
  edges: TalentEdge[];
  /** Gates in the tree */
  gates: TalentGate[];
  /** All nodes in the tree */
  nodes: TalentNode[];
  /** Specialization ID */
  specId: number;
  /** Specialization name */
  specName: string;
  /** Hero talent sub-trees */
  subTrees: TalentSubTree[];
  /** Tree ID */
  treeId: number;
}

// =============================================================================
// Position Calculation Constants (from Blizzard UI)
// =============================================================================

/**
 * Constants for position/row calculations.
 * From Blizzard_ClassTalentsFrame.lua
 */
export const POSITION_CONSTANTS = {
  /** Base Y offset for row 0 */
  BASE_Y_OFFSET: 1500,
  /** Height of each row */
  BASE_ROW_HEIGHT: 600,
  /** Position divisor (raw positions are 10x actual pixels) */
  POSITION_DIVISOR: 10,
} as const;

/**
 * Calculate pixel position from raw position.
 */
export function calculatePixelPosition(
  rawX: number,
  rawY: number,
): { x: number; y: number } {
  return {
    x: rawX / POSITION_CONSTANTS.POSITION_DIVISOR,
    y: -rawY / POSITION_CONSTANTS.POSITION_DIVISOR,
  };
}

/**
 * Calculate row index from raw Y position.
 */
export function calculateRow(rawY: number): number {
  return Math.round(
    (rawY - POSITION_CONSTANTS.BASE_Y_OFFSET) /
      POSITION_CONSTANTS.BASE_ROW_HEIGHT,
  );
}

/**
 * Normalize a sub-tree node position relative to the sub-tree origin.
 */
export function normalizeSubTreePosition(
  nodeX: number,
  nodeY: number,
  subTreeCenterX: number,
  subTreeTopY: number,
): { x: number; y: number } {
  return {
    x: nodeX - subTreeCenterX,
    y: nodeY - subTreeTopY,
  };
}
