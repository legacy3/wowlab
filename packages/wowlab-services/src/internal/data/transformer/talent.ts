import { DbcError, DbcQueryError } from "@wowlab/core/Errors";
import { Talent } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

export const transformTalentTree = (
  specId: number,
): Effect.Effect<Talent.TalentTree, DbcError, DbcService | ExtractorService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    // 1. Get spec info
    const spec = yield* dbc.getChrSpecialization(specId);
    if (!spec) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Spec ${specId} not found` }),
      );
    }

    const chrClass = yield* dbc.getChrClass(spec.ClassID!);
    if (!chrClass) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Class ${spec.ClassID} not found` }),
      );
    }

    // 2. Get loadout for ordering
    const loadout = yield* dbc.getTraitTreeLoadout(specId);
    if (!loadout) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Loadout for spec ${specId} not found` }),
      );
    }

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

    const subTrees: Talent.TalentSubTree[] = [];
    for (const subTreeId of subTreeIds) {
      const subTree = yield* dbc.getTraitSubTree(subTreeId);

      if (subTree) {
        subTrees.push({
          description: subTree.Description_lang ?? "",
          id: subTree.ID,
          name: subTree.Name_lang ?? "",
        });
      }
    }

    // 7. Resolve each node
    const nodes: Talent.TalentNode[] = [];
    for (const node of treeNodes) {
      const nodeXEntries = yield* dbc.getTraitNodeXTraitNodeEntries(node.ID);

      const entries: Talent.TalentNodeEntry[] = [];
      let maxRanks = 1;

      for (const nodeXEntry of nodeXEntries) {
        const entry = yield* dbc.getTraitNodeEntry(nodeXEntry.TraitNodeEntryID);
        if (!entry) {
          continue;
        }

        const definition = yield* dbc.getTraitDefinition(
          entry.TraitDefinitionID,
        );
        if (!definition) {
          continue;
        }

        const name = yield* extractor.extractTalentName(definition);
        const description =
          yield* extractor.extractTalentDescription(definition);
        const iconFileName = yield* extractor.extractTalentIcon(definition);

        // Track max ranks from first entry
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

      nodes.push({
        entries,
        id: node.ID,
        maxRanks,
        orderIndex: orderIndexMap.get(node.ID) ?? -1,
        posX: node.PosX,
        posY: node.PosY,
        subTreeId: node.TraitSubTreeID,
        type: node.Type,
      });
    }

    return {
      className: chrClass.Name_lang ?? "",
      edges: edges.map((e) => ({
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
  });

export const applyDecodedTalents = (
  tree: Talent.TalentTree,
  decoded: {
    nodes: Array<{
      selected: boolean;
      purchased?: boolean;
      ranksPurchased?: number;
      choiceIndex?: number;
    }>;
  },
): Talent.TalentTreeWithSelections => {
  const selections = new Map<number, Talent.DecodedTalentSelection>();

  // Sort nodes by orderIndex
  const orderedNodes = [...tree.nodes]
    .filter((n) => n.orderIndex >= 0)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // Map decoded nodes to tree nodes
  for (let i = 0; i < decoded.nodes.length && i < orderedNodes.length; i++) {
    const decodedNode = decoded.nodes[i];
    const treeNode = orderedNodes[i];

    selections.set(treeNode.id, {
      choiceIndex: decodedNode.choiceIndex,
      nodeId: treeNode.id,
      ranksPurchased:
        decodedNode.ranksPurchased ??
        (decodedNode.purchased ? treeNode.maxRanks : 0),
      selected: decodedNode.selected,
    });
  }

  return {
    ...tree,
    selections,
  };
};
