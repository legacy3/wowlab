import { DbcError, DbcQueryError } from "@wowlab/core/Errors";
import { Talent } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

const TARGET_HERO_X = 7500;
const TARGET_HERO_Y = 1200;

const calculateHeroTreeOffsets = (
  nodes: ReadonlyArray<{ PosX: number; PosY: number; TraitSubTreeID: number }>,
  subTreeIds: ReadonlyArray<number>,
): Map<number, { offsetX: number; offsetY: number }> => {
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

    const loadoutEntriesUnsorted = yield* dbc.getTraitTreeLoadoutEntries(
      loadout.ID,
    );

    // Sort by OrderIndex to ensure correct node order
    const loadoutEntries = [...loadoutEntriesUnsorted].sort(
      (a, b) => a.OrderIndex - b.OrderIndex,
    );

    // 3. Build orderIndex map: nodeId -> orderIndex
    const orderIndexMap = new Map<number, number>();
    for (const entry of loadoutEntries) {
      orderIndexMap.set(entry.SelectedTraitNodeID, entry.OrderIndex);
    }

    // 4. Get all nodes and edges in parallel (batching enabled)
    const [treeNodes, allEdges] = yield* Effect.all(
      [
        dbc.getTraitNodesForTree(loadout.TraitTreeID),
        dbc.getTraitEdgesForTree(loadout.TraitTreeID),
      ],
      { batching: true },
    );

    // 5. Get unique subTreeIds for hero talents
    const allSubTreeIds = [
      ...new Set(treeNodes.map((n) => n.TraitSubTreeID).filter((id) => id > 0)),
    ];

    // 6. Filter hero subtrees to only those available for this spec
    const heroNodeIds = treeNodes
      .filter((n) => n.TraitSubTreeID > 0)
      .map((n) => n.ID);

    let availableSubTreeIds = allSubTreeIds;

    if (heroNodeIds.length > 0) {
      // Get node group memberships for hero nodes
      const nodeGroupMemberships =
        yield* dbc.getTraitNodeGroupXTraitNodes(heroNodeIds);

      const heroNodeGroupIds = [
        ...new Set(nodeGroupMemberships.map((m) => m.TraitNodeGroupID)),
      ];

      if (heroNodeGroupIds.length > 0) {
        // Get conditions for those groups
        const groupConditions =
          yield* dbc.getTraitNodeGroupXTraitConds(heroNodeGroupIds);
        const condIds = [
          ...new Set(groupConditions.map((gc) => gc.TraitCondID)),
        ];

        if (condIds.length > 0) {
          // Get the actual conditions
          const conditions = yield* dbc.getTraitConds(condIds);
          const conditionsWithSpecSet = conditions.filter(
            (c) => c.SpecSetID > 0,
          );
          const specSetIds = [
            ...new Set(conditionsWithSpecSet.map((c) => c.SpecSetID)),
          ];

          if (specSetIds.length > 0) {
            // Get spec set members
            const specSetMembers = yield* dbc.getSpecSetMembers(specSetIds);

            // Build map of subTreeId -> allowed specIds
            const subTreeSpecRestrictions = new Map<number, Set<number>>();

            for (const membership of nodeGroupMemberships) {
              const node = treeNodes.find(
                (n) => n.ID === membership.TraitNodeID,
              );

              if (!node || node.TraitSubTreeID === 0) {
                continue;
              }

              const groupConds = groupConditions.filter(
                (gc) => gc.TraitNodeGroupID === membership.TraitNodeGroupID,
              );

              for (const gc of groupConds) {
                const cond = conditionsWithSpecSet.find(
                  (c) => c.ID === gc.TraitCondID,
                );

                if (!cond) {
                  continue;
                }

                const allowedSpecs = specSetMembers
                  .filter((ssm) => ssm.SpecSet === cond.SpecSetID)
                  .map((ssm) => ssm.ChrSpecializationID);

                const existing = subTreeSpecRestrictions.get(
                  node.TraitSubTreeID,
                );

                if (!existing) {
                  subTreeSpecRestrictions.set(
                    node.TraitSubTreeID,
                    new Set(allowedSpecs),
                  );
                } else {
                  for (const s of allowedSpecs) {
                    existing.add(s);
                  }
                }
              }
            }

            // Filter to available subtrees
            availableSubTreeIds = allSubTreeIds.filter((stId) => {
              const restrictions = subTreeSpecRestrictions.get(stId);
              if (!restrictions || restrictions.size === 0) {
                return true;
              }

              return restrictions.has(specId);
            });
          }
        }
      }
    }

    // 7. Include ALL nodes - don't filter by hero subtree availability
    // SimC includes nodes from ALL hero subtrees, the bitstream has bits for all of them
    // The SELECTION node determines which hero tree is active
    const filteredNodes = treeNodes;
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.ID));

    // 8. Filter edges to only include filtered nodes
    const filteredEdges = allEdges.filter(
      (e) =>
        filteredNodeIds.has(e.LeftTraitNodeID) &&
        filteredNodeIds.has(e.RightTraitNodeID),
    );

    // 9. Calculate hero tree offsets for available subtrees
    const heroTreeOffsets = calculateHeroTreeOffsets(
      filteredNodes,
      availableSubTreeIds,
    );

    // 10. Get subtree data
    const subTreeResults = yield* Effect.forEach(
      availableSubTreeIds,
      (subTreeId) => dbc.getTraitSubTree(subTreeId),
      { batching: true },
    );

    // TODO Again not sure about this
    const uiTextureAtlasElementNameById = new Map<number, string>();
    const uiTextureAtlasElementIds = [
      ...new Set(
        subTreeResults
          .filter((st): st is NonNullable<typeof st> => st != null)
          .map((st) => st.UiTextureAtlasElementID)
          .filter((id) => id > 0),
      ),
    ];

    const uiTextureAtlasElements = yield* Effect.forEach(
      uiTextureAtlasElementIds,
      (id) => dbc.getUiTextureAtlasElement(id),
      { batching: true },
    );

    for (const element of uiTextureAtlasElements) {
      if (element) {
        uiTextureAtlasElementNameById.set(element.ID, element.Name);
      }
    }

    // 11. Get all nodeXEntries for filtered nodes
    const allNodeXEntries = yield* Effect.forEach(
      filteredNodes,
      (node) => dbc.getTraitNodeXTraitNodeEntries(node.ID),
      { batching: true },
    );

    // 12. Collect all entry IDs we need to fetch
    const allEntryIds = allNodeXEntries.flat().map((x) => x.TraitNodeEntryID);

    // 13. Batch fetch all trait node entries
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

    // 14. Collect all definition IDs we need
    const allDefinitionIds = [
      ...new Set(
        allEntries
          .filter((e): e is NonNullable<typeof e> => e != null)
          .map((e) => e.TraitDefinitionID),
      ),
    ];

    // 15. Batch fetch all trait definitions
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

    // 16. Extract names, descriptions, and icons for all definitions (batched)
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

    // 17. Assemble the nodes using the pre-fetched data
    const nodes: Talent.TalentNode[] = filteredNodes.map((node, nodeIndex) => {
      // Sort entries to match SimC's sort_node_entries() logic:
      // - If both have selection_index != -1: sort ascending by selection_index
      // - Otherwise: sort descending by id_trait_node_entry (entry ID)
      // The _Index field corresponds to selection_index in SimC's trait_data
      const nodeXEntries = [...allNodeXEntries[nodeIndex]].sort((a, b) => {
        // _Index of -1 means "no selection index"
        // In DBC, this might also be represented differently, but we treat
        // any negative value as "no index"
        const aHasIndex = a._Index >= 0;
        const bHasIndex = b._Index >= 0;

        if (aHasIndex && bHasIndex) {
          // Both have valid indices - sort ascending by _Index
          return a._Index - b._Index;
        } else {
          // Fallback: sort descending by entry ID (higher ID first)
          return b.TraitNodeEntryID - a.TraitNodeEntryID;
        }
      });
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

      // Apply hero tree offset if this node belongs to a hero subtree
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

    // 18. Build subtrees with icons derived from their nodes
    const subTrees: Talent.TalentSubTree[] = subTreeResults
      .filter((st): st is NonNullable<typeof st> => st != null)
      .map((subTree) => {
        // TODO Imo just derive should work or a proper lookup, but the fallback shouldnt be needed
        const iconFileName =
          uiTextureAtlasElementNameById.get(subTree.UiTextureAtlasElementID) ??
          deriveSubTreeIconFileName(nodes, subTree.ID);

        return {
          description: subTree.Description_lang ?? "",
          iconFileName,
          id: subTree.ID,
          name: subTree.Name_lang ?? "",
        };
      });

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

  // Sort nodes by node ID ascending to match SimC's std::map iteration order
  // SimC iterates tree_nodes (std::map<unsigned, ...>) which orders by id_node ascending
  const orderedNodes = [...tree.nodes].sort((a, b) => a.id - b.id);

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
