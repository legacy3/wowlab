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
  const orderedNodes = [...tree.nodes].sort((a, b) => a.id - b.id);

  let lastIndex = -1;
  for (let i = 0; i < orderedNodes.length; i++) {
    if (selections.has(orderedNodes[i]!.id)) {
      lastIndex = i;
    }
  }

  const nodes =
    lastIndex >= 0
      ? orderedNodes.slice(0, lastIndex + 1).map((node) => {
          const sel = selections.get(node.id);
          const selected = !!sel?.selected;
          const ranksPurchased = sel?.ranksPurchased ?? 0;
          const isChoiceNode = node.type === 2 && node.entries.length > 1;

          return {
            selected,
            purchased: selected && ranksPurchased > 0,
            partiallyRanked:
              selected && node.maxRanks > 1 && ranksPurchased < node.maxRanks,
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
