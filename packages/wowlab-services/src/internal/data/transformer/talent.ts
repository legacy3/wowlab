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

    // 4. Get all nodes and edges in parallel (batching enabled)
    const [treeNodes, edges] = yield* Effect.all(
      [
        dbc.getTraitNodesForTree(loadout.TraitTreeID),
        dbc.getTraitEdgesForTree(loadout.TraitTreeID),
      ],
      { batching: true },
    );

    // 5. Get unique subTreeIds for hero talents (batched)
    const subTreeIds = [
      ...new Set(treeNodes.map((n) => n.TraitSubTreeID).filter((id) => id > 0)),
    ];

    const subTreeResults = yield* Effect.forEach(
      subTreeIds,
      (subTreeId) => dbc.getTraitSubTree(subTreeId),
      { batching: true },
    );

    const subTrees: Talent.TalentSubTree[] = subTreeResults
      .filter((st): st is NonNullable<typeof st> => st != null)
      .map((subTree) => ({
        description: subTree.Description_lang ?? "",
        id: subTree.ID,
        name: subTree.Name_lang ?? "",
      }));

    // 6. Get all nodeXEntries for all nodes in one batched operation
    const allNodeXEntries = yield* Effect.forEach(
      treeNodes,
      (node) => dbc.getTraitNodeXTraitNodeEntries(node.ID),
      { batching: true },
    );

    // 7. Collect all entry IDs we need to fetch
    const allEntryIds = allNodeXEntries.flat().map((x) => x.TraitNodeEntryID);

    // 8. Batch fetch all trait node entries
    const allEntries = yield* Effect.forEach(
      allEntryIds,
      (entryId) => dbc.getTraitNodeEntry(entryId),
      { batching: true },
    );

    // Create a map for quick lookup
    const entryMap = new Map<
      number,
      NonNullable<(typeof allEntries)[number]>
    >();
    for (const entry of allEntries) {
      if (entry) {
        entryMap.set(entry.ID, entry);
      }
    }

    // 9. Collect all definition IDs we need
    const allDefinitionIds = [
      ...new Set(
        allEntries
          .filter((e): e is NonNullable<typeof e> => e != null)
          .map((e) => e.TraitDefinitionID),
      ),
    ];

    // 10. Batch fetch all trait definitions
    const allDefinitions = yield* Effect.forEach(
      allDefinitionIds,
      (defId) => dbc.getTraitDefinition(defId),
      { batching: true },
    );

    // Create a map for quick lookup
    const definitionMap = new Map<
      number,
      NonNullable<(typeof allDefinitions)[number]>
    >();
    for (const def of allDefinitions) {
      if (def) {
        definitionMap.set(def.ID, def);
      }
    }

    // 11. Extract names, descriptions, and icons for all definitions (batched)
    const definitionsWithExtras = yield* Effect.forEach(
      [...definitionMap.values()],
      (definition) =>
        Effect.all(
          {
            definition: Effect.succeed(definition),
            description: extractor.extractTalentDescription(definition),
            iconFileName: extractor.extractTalentIcon(definition),
            name: extractor.extractTalentName(definition),
          },
          { batching: true },
        ),
      { batching: true },
    );

    // Create a map for quick lookup
    const extractedMap = new Map<
      number,
      { name: string; description: string; iconFileName: string }
    >();
    for (const item of definitionsWithExtras) {
      extractedMap.set(item.definition.ID, {
        description: item.description,
        iconFileName: item.iconFileName,
        name: item.name,
      });
    }

    // 12. Assemble the nodes using the pre-fetched data
    const nodes: Talent.TalentNode[] = treeNodes.map((node, nodeIndex) => {
      const nodeXEntries = allNodeXEntries[nodeIndex];
      const entries: Talent.TalentNodeEntry[] = [];
      let maxRanks = 1;

      for (const nodeXEntry of nodeXEntries) {
        const entry = entryMap.get(nodeXEntry.TraitNodeEntryID);
        if (!entry) {
          continue;
        }

        const definition = definitionMap.get(entry.TraitDefinitionID);
        if (!definition) continue;

        const extracted = extractedMap.get(definition.ID);
        if (!extracted) {
          continue;
        }

        if (entries.length === 0) {
          maxRanks = entry.MaxRanks;
        }

        entries.push({
          definitionId: definition.ID,
          description: extracted.description,
          iconFileName: extracted.iconFileName,
          id: entry.ID,
          name: extracted.name,
          spellId: definition.SpellID,
        });
      }

      return {
        entries,
        id: node.ID,
        maxRanks,
        orderIndex: orderIndexMap.get(node.ID) ?? -1,
        posX: node.PosX,
        posY: node.PosY,
        subTreeId: node.TraitSubTreeID,
        type: node.Type,
      };
    });

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
