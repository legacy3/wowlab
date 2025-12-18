import { DbcError, DbcQueryError } from "@wowlab/core/Errors";
import { Dbc, Talent } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

const TARGET_HERO_X = 7500;
const TARGET_HERO_Y = 1200;

const deriveSubTreeIconFileName = (
  nodes: readonly Talent.TalentNode[],
  subTreeId: number,
): string => {
  for (const node of nodes) {
    if (node.subTreeId !== subTreeId) {
      continue;
    }
    for (const entry of node.entries) {
      if (entry.iconFileName) {
        return entry.iconFileName;
      }
    }
  }

  return "inv_misc_questionmark";
};

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

const toSet = <T>(arr: Iterable<T>) => new Set(arr);

export const transformTalentTree = (
  specId: number,
): Effect.Effect<Talent.TalentTree, DbcError, DbcService | ExtractorService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    // 1. Get spec info
    const spec = yield* dbc.getById("chr_specialization", specId);
    if (!spec) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Spec ${specId} not found` }),
      );
    }

    const chrClass = yield* dbc.getById("chr_classes", spec.ClassID!);
    if (!chrClass) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Class ${spec.ClassID} not found` }),
      );
    }

    // 2. Get loadout for ordering
    const loadout = yield* dbc.getOneByFk(
      "trait_tree_loadout",
      "ChrSpecializationID",
      specId,
    );
    if (!loadout) {
      return yield* Effect.fail(
        new DbcQueryError({ message: `Loadout for spec ${specId} not found` }),
      );
    }

    const loadoutEntriesUnsorted = yield* dbc.getManyByFk(
      "trait_tree_loadout_entry",
      "TraitTreeLoadoutID",
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

    // 4. Get all nodes + currencies, then edges (edges need node IDs)
    const [treeNodes, treeCurrencies] = yield* Effect.all(
      [
        dbc.getManyByFk("trait_node", "TraitTreeID", loadout.TraitTreeID),
        dbc.getManyByFk(
          "trait_tree_x_trait_currency",
          "TraitTreeID",
          loadout.TraitTreeID,
        ),
      ],
      { batching: true },
    );

    const nodeIds = treeNodes.map((n) => n.ID);
    const nodeIdSet = new Set(nodeIds);

    const allEdges = yield* dbc
      .getManyByFkValues("trait_edge", "LeftTraitNodeID", nodeIds)
      .pipe(
        Effect.map((edges) =>
          edges.filter(
            (e) =>
              nodeIdSet.has(e.LeftTraitNodeID) &&
              nodeIdSet.has(e.RightTraitNodeID),
          ),
        ),
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
      const nodeGroupMemberships = yield* dbc.getManyByFkValues(
        "trait_node_group_x_trait_node",
        "TraitNodeID",
        heroNodeIds,
      );

      const heroNodeGroupIds = [
        ...new Set(nodeGroupMemberships.map((m) => m.TraitNodeGroupID)),
      ];

      if (heroNodeGroupIds.length > 0) {
        // Get conditions for those groups
        const groupConditions = yield* dbc.getManyByFkValues(
          "trait_node_group_x_trait_cond",
          "TraitNodeGroupID",
          heroNodeGroupIds,
        );
        const condIds = [
          ...new Set(groupConditions.map((gc) => gc.TraitCondID)),
        ];

        if (condIds.length > 0) {
          // Get the actual conditions
          const conditions = yield* dbc.getManyByIds("trait_cond", condIds);
          const conditionsWithSpecSet = conditions.filter(
            (c) => c.SpecSetID > 0,
          );
          const specSetIds = [
            ...new Set(conditionsWithSpecSet.map((c) => c.SpecSetID)),
          ];

          if (specSetIds.length > 0) {
            // Get spec set members
            const specSetMembers = yield* dbc.getManyByFkValues(
              "spec_set_member",
              "SpecSet",
              specSetIds,
            );

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

    // 7. Include only hero subtrees that are available, everything else unchanged
    const filteredNodes = treeNodes.filter(
      (n) =>
        n.TraitSubTreeID === 0 ||
        availableSubTreeIds.includes(n.TraitSubTreeID),
    );
    const filteredNodeIds = toSet(filteredNodes.map((n) => n.ID));

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
      (subTreeId) => dbc.getById("trait_sub_tree", subTreeId),
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
      (id) => dbc.getById("ui_texture_atlas_element", id),
      { batching: true },
    );

    for (const element of uiTextureAtlasElements) {
      if (element) {
        uiTextureAtlasElementNameById.set(element.ID, element.Name);
      }
    }

    // 11. Node group memberships (for currency/spec gating)
    const nodeGroupMemberships = yield* dbc.getManyByFkValues(
      "trait_node_group_x_trait_node",
      "TraitNodeID",
      filteredNodes.map((n) => n.ID),
    );
    const groupIds = [
      ...new Set(nodeGroupMemberships.map((m) => m.TraitNodeGroupID)),
    ];

    // 12. Costs and currencies
    const groupCosts =
      groupIds.length > 0
        ? yield* dbc.getManyByFkValues(
            "trait_node_group_x_trait_cost",
            "TraitNodeGroupID",
            groupIds,
          )
        : [];
    const costIds = [...new Set(groupCosts.map((gc) => gc.TraitCostID))];
    const costs =
      costIds.length > 0 ? yield* dbc.getManyByIds("trait_cost", costIds) : [];
    const costMap = new Map<number, Dbc.TraitCostRow>();
    for (const c of costs) {
      if (c) costMap.set(c.ID, c);
    }

    const currencyIds = [
      ...new Set([
        ...costs.filter(Boolean).map((c) => c!.TraitCurrencyID),
        ...treeCurrencies.map((c) => c.TraitCurrencyID),
      ]),
    ];
    const currencies =
      currencyIds.length > 0
        ? yield* dbc.getManyByIds("trait_currency", currencyIds)
        : [];
    const currencyMap = new Map<number, Dbc.TraitCurrencyRow>();
    for (const cur of currencies) {
      if (cur) currencyMap.set(cur.ID, cur);
    }

    // 13. NodeXEntries and definitions
    const allNodeXEntries = yield* dbc.getManyByFkValues(
      "trait_node_x_trait_node_entry",
      "TraitNodeID",
      filteredNodes.map((n) => n.ID),
    );

    const nodeXEntriesByNodeId = new Map<
      number,
      Dbc.TraitNodeXTraitNodeEntryRow[]
    >();
    for (const x of allNodeXEntries) {
      const existing = nodeXEntriesByNodeId.get(x.TraitNodeID) ?? [];
      existing.push(x);
      nodeXEntriesByNodeId.set(x.TraitNodeID, existing);
    }

    const allEntryIds = allNodeXEntries.map((x) => x.TraitNodeEntryID);
    const allEntries =
      allEntryIds.length > 0
        ? yield* dbc.getManyByIds("trait_node_entry", allEntryIds)
        : [];
    const entryMap = new Map<number, Dbc.TraitNodeEntryRow>();
    for (const entry of allEntries) {
      if (entry) entryMap.set(entry.ID, entry);
    }

    const allDefinitionIds = [
      ...new Set(
        allEntries
          .filter((e): e is Dbc.TraitNodeEntryRow => e != null)
          .map((e) => e.TraitDefinitionID),
      ),
    ];
    const allDefinitions =
      allDefinitionIds.length > 0
        ? yield* dbc.getManyByIds("trait_definition", allDefinitionIds)
        : [];
    const definitionMap = new Map<number, Dbc.TraitDefinitionRow>();
    for (const def of allDefinitions) {
      if (def) definitionMap.set(def.ID, def);
    }

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

    // 14. Spec gating and starters for all nodes (including hero)
    const nodeConds =
      filteredNodes.length > 0
        ? yield* dbc.getManyByFkValues(
            "trait_node_x_trait_cond",
            "TraitNodeID",
            filteredNodes.map((n) => n.ID),
          )
        : [];
    const groupConds =
      groupIds.length > 0
        ? yield* dbc.getManyByFkValues(
            "trait_node_group_x_trait_cond",
            "TraitNodeGroupID",
            groupIds,
          )
        : [];
    const condIds = [
      ...new Set([
        ...groupConds.map((c) => c.TraitCondID),
        ...nodeConds.map((c) => c.TraitCondID),
      ]),
    ];
    const conds =
      condIds.length > 0 ? yield* dbc.getManyByIds("trait_cond", condIds) : [];
    const condById = new Map<number, Dbc.TraitCondRow>();
    for (const c of conds) condById.set(c.ID, c);

    const specSetIds = [
      ...new Set(conds.filter((c) => c.SpecSetID > 0).map((c) => c.SpecSetID)),
    ];
    const specSetMembers =
      specSetIds.length > 0
        ? yield* dbc.getManyByFkValues("spec_set_member", "SpecSet", specSetIds)
        : [];
    const specSetMap = new Map<number, Set<number>>();
    for (const m of specSetMembers) {
      const set = specSetMap.get(m.SpecSet) ?? new Set<number>();
      set.add(m.ChrSpecializationID);
      specSetMap.set(m.SpecSet, set);
    }

    const nodeSpecInfo = new Map<
      number,
      { allowed: Set<number> | null; starter: Set<number> }
    >();
    for (const node of filteredNodes) {
      const condIdsForNode: number[] = [];
      condIdsForNode.push(
        ...nodeConds
          .filter((c) => c.TraitNodeID === node.ID)
          .map((c) => c.TraitCondID),
      );
      const groupId = nodeGroupMemberships.find(
        (m) => m.TraitNodeID === node.ID,
      )?.TraitNodeGroupID;
      if (groupId) {
        condIdsForNode.push(
          ...groupConds
            .filter((c) => c.TraitNodeGroupID === groupId)
            .map((c) => c.TraitCondID),
        );
      }

      let allowed: Set<number> | null = null;
      const starter = new Set<number>();

      for (const cid of condIdsForNode) {
        const cond = condById.get(cid);
        if (!cond) continue;
        if (cond.SpecSetID > 0) {
          const specsAllowed = specSetMap.get(cond.SpecSetID);
          if (specsAllowed) {
            allowed = allowed
              ? new Set([...allowed, ...specsAllowed])
              : new Set(specsAllowed);
          }
        }
        if (cond.CondType === 2 && cond.SpecSetID > 0) {
          specSetMap.get(cond.SpecSetID)?.forEach((s) => starter.add(s));
        }
      }

      nodeSpecInfo.set(node.ID, { allowed, starter });
    }

    // 17. Assemble the nodes using the pre-fetched data
    const nodes = filteredNodes
      .map((node) => {
        const specInfo = nodeSpecInfo.get(node.ID);
        if (specInfo?.allowed && !specInfo.allowed.has(specId)) {
          return null;
        }
        // Sort entries to match SimC's sort_node_entries() logic:
        // - If both have selection_index != -1: sort ascending by selection_index
        // - Otherwise: sort descending by id_trait_node_entry (entry ID)
        // The _Index field corresponds to selection_index in SimC's trait_data
        const nodeXEntries = [
          ...(nodeXEntriesByNodeId.get(node.ID) ?? []),
        ].sort((a, b) => {
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

        // Determine treeIndex from currency flags
        let treeIndex = node.TraitSubTreeID > 0 ? 3 : 2;
        const groupId = nodeGroupMemberships.find(
          (m) => m.TraitNodeID === node.ID,
        )?.TraitNodeGroupID;
        const groupCostId = groupCosts.find(
          (gc) => gc.TraitNodeGroupID === groupId,
        )?.TraitCostID;
        const cost = groupCostId ? costMap.get(groupCostId) : undefined;
        const currency = cost
          ? currencyMap.get(cost.TraitCurrencyID)
          : undefined;
        const fallbackCurrency =
          treeCurrencies.find((c) => c._Index === 0) ?? treeCurrencies[0];
        const fallbackCurrencyRow = fallbackCurrency
          ? currencyMap.get(fallbackCurrency.TraitCurrencyID)
          : undefined;
        const flags = currency?.Flags ?? fallbackCurrencyRow?.Flags ?? 0;
        if (node.TraitSubTreeID === 0) {
          if (flags & 0x8) treeIndex = 2;
          else if (flags & 0x4) treeIndex = 1;
        }

        return {
          entries,
          id: node.ID,
          maxRanks,
          orderIndex: orderIndexMap.get(node.ID) ?? -1,
          posX,
          posY,
          subTreeId: node.TraitSubTreeID,
          treeIndex,
          type: node.Type,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

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
