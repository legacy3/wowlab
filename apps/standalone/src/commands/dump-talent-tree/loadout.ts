/**
 * Talent Loadout String Parser
 *
 * Based on:
 * - Interface/AddOns/Blizzard_PlayerSpells/ClassTalents/Blizzard_ClassTalentImportExport.lua
 * - Interface/AddOns/Blizzard_SharedXMLBase/ExportUtil.lua
 *
 * Key insight from Blizzard source (line 30):
 * "The order of the nodes is determined by C_Traits.GetTreeNodes API.
 *  It returns all nodes for a class tree, including nodes from all class
 *  specializations, ordered in ascending order by the nodeID."
 */

// =============================================================================
// Types
// =============================================================================

/** Parsed loadout header */
export interface LoadoutHeader {
  specId: number;
  treeHash: number[];
  version: number;
}

/** Parsed node state from loadout */
export interface LoadoutNodeInfo {
  choiceEntryIndex: number;
  isChoiceNode: boolean;
  isNodeGranted: boolean;
  isNodeSelected: boolean;
  isPartiallyRanked: boolean;
  ranksPurchased: number;
}

// =============================================================================
// Constants from Blizzard source
// =============================================================================

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const BITS_PER_CHAR = 6;
const BIT_WIDTH_CHOICE_INDEX = 2;
const BIT_WIDTH_RANKS_PURCHASED = 6;
const BIT_WIDTH_SPEC_ID = 16;
const BIT_WIDTH_TREE_HASH = 128;
const BIT_WIDTH_VERSION = 8;

// =============================================================================
// ImportDataStream - matches ImportDataStreamMixin from ExportUtil.lua
// =============================================================================

class ImportDataStream {
  private currentExtractedBits: number;
  private currentIndex: number;
  private currentRemainingValue: number;
  private dataValues: number[];

  constructor(exportString: string) {
    this.dataValues = [];
    for (const char of exportString) {
      const value = BASE64_CHARS.indexOf(char);
      if (value === -1) {
        throw new Error(`Invalid base64 character: ${char}`);
      }
      this.dataValues.push(value);
    }

    this.currentExtractedBits = 0;
    this.currentIndex = 0;
    this.currentRemainingValue = this.dataValues[0] ?? 0;
  }

  extractValue(bitWidth: number): number {
    if (this.currentIndex >= this.dataValues.length) {
      return 0;
    }

    let bitsNeeded = bitWidth;
    let extractedBits = 0;
    let value = 0;

    while (bitsNeeded > 0) {
      const remainingBits = BITS_PER_CHAR - this.currentExtractedBits;
      const bitsToExtract = Math.min(remainingBits, bitsNeeded);
      this.currentExtractedBits += bitsToExtract;

      const maxStorableValue = 1 << bitsToExtract;
      const remainder = this.currentRemainingValue % maxStorableValue;
      this.currentRemainingValue = this.currentRemainingValue >> bitsToExtract;

      value = value + (remainder << extractedBits);
      extractedBits += bitsToExtract;
      bitsNeeded -= bitsToExtract;

      if (bitsToExtract < remainingBits) {
        break;
      } else if (bitsToExtract >= remainingBits) {
        this.currentIndex++;
        this.currentExtractedBits = 0;
        this.currentRemainingValue = this.dataValues[this.currentIndex] ?? 0;
      }
    }

    return value;
  }

  getNumberOfBits(): number {
    return BITS_PER_CHAR * this.dataValues.length;
  }
}

// =============================================================================
// Private Helpers
// =============================================================================

/**
 * Apply parsed loadout to get final talent states.
 *
 * @param selectedNodes - Map from parseLoadoutString
 * @param nodeMaxRanks - Map of nodeId -> maxRanks
 * @returns Map of nodeId -> { ranks, choiceEntryIndex }
 */
export function applyLoadoutToTree(
  selectedNodes: Map<number, LoadoutNodeInfo>,
  nodeMaxRanks: Map<number, number>,
): Map<number, { choiceEntryIndex: number | null; ranks: number }> {
  const result = new Map<
    number,
    { choiceEntryIndex: number | null; ranks: number }
  >();

  for (const [nodeId, info] of selectedNodes) {
    const maxRanks = nodeMaxRanks.get(nodeId) ?? 1;

    let ranks: number;
    if (info.isNodeGranted) {
      ranks = 1;
    } else if (info.isPartiallyRanked) {
      ranks = info.ranksPurchased;
    } else {
      ranks = maxRanks;
    }

    result.set(nodeId, {
      choiceEntryIndex: info.isChoiceNode ? info.choiceEntryIndex : null,
      ranks,
    });
  }

  return result;
}

/**
 * Parse a talent loadout export string.
 *
 * @param exportString - Base64-encoded talent loadout string
 * @param allNodeIds - ALL node IDs from C_Traits.GetTreeNodes(treeID), sorted ascending
 * @returns Parsed header and map of nodeId -> node info for selected nodes
 */
export function parseLoadoutString(
  exportString: string,
  allNodeIds: number[],
): {
  header: LoadoutHeader;
  selectedNodes: Map<number, LoadoutNodeInfo>;
} {
  const stream = new ImportDataStream(exportString);

  const header = parseHeader(stream);
  if (!header) {
    throw new Error("Invalid loadout header");
  }

  const selectedNodes = new Map<number, LoadoutNodeInfo>();

  for (let i = 0; i < allNodeIds.length; i++) {
    const nodeInfo = parseNodeInfo(stream);

    if (nodeInfo.isNodeSelected) {
      selectedNodes.set(allNodeIds[i], nodeInfo);
    }
  }

  return { header, selectedNodes };
}

// =============================================================================
// Public API
// =============================================================================

function parseHeader(stream: ImportDataStream): LoadoutHeader | null {
  const headerBitWidth =
    BIT_WIDTH_VERSION + BIT_WIDTH_SPEC_ID + BIT_WIDTH_TREE_HASH;

  if (stream.getNumberOfBits() < headerBitWidth) {
    return null;
  }

  const version = stream.extractValue(BIT_WIDTH_VERSION);
  const specId = stream.extractValue(BIT_WIDTH_SPEC_ID);

  const treeHash: number[] = [];
  for (let i = 0; i < 16; i++) {
    treeHash.push(stream.extractValue(8));
  }

  return { specId, treeHash, version };
}

function parseNodeInfo(stream: ImportDataStream): LoadoutNodeInfo {
  const isNodeSelected = stream.extractValue(1) === 1;

  if (!isNodeSelected) {
    return {
      choiceEntryIndex: 0,
      isChoiceNode: false,
      isNodeGranted: false,
      isNodeSelected: false,
      isPartiallyRanked: false,
      ranksPurchased: 0,
    };
  }

  const isNodePurchased = stream.extractValue(1) === 1;

  if (!isNodePurchased) {
    return {
      choiceEntryIndex: 0,
      isChoiceNode: false,
      isNodeGranted: true,
      isNodeSelected: true,
      isPartiallyRanked: false,
      ranksPurchased: 0,
    };
  }

  const isPartiallyRanked = stream.extractValue(1) === 1;
  let ranksPurchased = 0;

  if (isPartiallyRanked) {
    ranksPurchased = stream.extractValue(BIT_WIDTH_RANKS_PURCHASED);
  }

  const isChoiceNode = stream.extractValue(1) === 1;
  let choiceEntryIndex = 0;

  if (isChoiceNode) {
    choiceEntryIndex = stream.extractValue(BIT_WIDTH_CHOICE_INDEX);
  }

  return {
    choiceEntryIndex,
    isChoiceNode,
    isNodeGranted: false,
    isNodeSelected: true,
    isPartiallyRanked,
    ranksPurchased,
  };
}
