import {
  encodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import { applyDecodedTalents } from "@wowlab/services/Data";
import type { Talent } from "@wowlab/core/Schemas";

export function createHeaderOnlyTalentString(specId: number): string {
  const zeroHash = new Uint8Array(16);
  return encodeTalentLoadout({
    version: 1,
    specId,
    treeHash: zeroHash,
    nodes: [],
  });
}

export function deriveInitialSelectionsFromDecoded(
  tree: Talent.TalentTree,
  decoded: DecodedTalentLoadout,
): Map<number, Talent.DecodedTalentSelection> {
  return applyDecodedTalents(tree, decoded).selections;
}

export function encodeSelectionsToTalentString(params: {
  tree: Talent.TalentTree;
  decoded: DecodedTalentLoadout;
  selections: Map<number, Talent.DecodedTalentSelection>;
}): string {
  const { tree, decoded, selections } = params;

  // Build a map from node ID to node data for lookups
  const nodeById = new Map(tree.nodes.map((n) => [n.id, n]));

  // Use allNodeIds which contains ALL node IDs in sorted order (including filtered nodes like type 3)
  // This matches the order expected by the loadout string encoding
  const allNodeIds = tree.allNodeIds;

  let lastIndex = -1;
  for (let i = 0; i < allNodeIds.length; i++) {
    if (selections.has(allNodeIds[i]!)) {
      lastIndex = i;
    }
  }

  const nodes =
    lastIndex >= 0
      ? allNodeIds.slice(0, lastIndex + 1).map((nodeId) => {
          const node = nodeById.get(nodeId);
          const sel = selections.get(nodeId);
          const selected = !!sel?.selected;
          const ranksPurchased = sel?.ranksPurchased ?? 0;
          const isChoiceNode =
            node && node.type === 2 && node.entries.length > 1;
          const maxRanks = node?.maxRanks ?? 1;

          return {
            selected,
            purchased: selected && ranksPurchased > 0,
            partiallyRanked:
              selected && maxRanks > 1 && ranksPurchased < maxRanks,
            ranksPurchased,
            choiceNode: selected && isChoiceNode,
            choiceIndex: sel?.choiceIndex,
          };
        })
      : [];

  return encodeTalentLoadout({
    version: decoded.version,
    specId: decoded.specId,
    treeHash: decoded.treeHash,
    nodes,
  });
}
