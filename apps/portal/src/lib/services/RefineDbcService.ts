import type { BaseRecord, CrudFilter, DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import type * as Schemas from "@wowlab/core/Schemas";

import { DbcQueryError } from "@wowlab/core/Errors";
import {
  DbcBatchFetcher,
  DbcResolvers,
  DbcService,
  GetChrClass,
  GetChrSpecialization,
  GetDifficulty,
  GetExpectedStatMod,
  GetItem,
  GetItemAppearance,
  GetItemEffect,
  GetItemModifiedAppearance,
  GetItemSparse,
  GetItemXItemEffects,
  GetManifestInterfaceData,
  GetSpecializationSpells,
  GetSpell,
  GetSpellAuraOptions,
  GetSpellAuraRestrictions,
  GetSpellCastingRequirements,
  GetSpellCastTimes,
  GetSpellCategories,
  GetSpellCategory,
  GetSpellClassOptions,
  GetSpellCooldowns,
  GetSpellDescriptionVariables,
  GetSpellDuration,
  GetSpellEffects,
  GetSpellEmpower,
  GetSpellEmpowerStages,
  GetSpellInterrupts,
  GetSpellLearnSpell,
  GetSpellLevels,
  GetSpellMisc,
  GetSpellName,
  GetSpellPower,
  GetSpellProcsPerMinute,
  GetSpellProcsPerMinuteMods,
  GetSpellRadius,
  GetSpellRange,
  GetSpellReplacement,
  GetSpellShapeshift,
  GetSpellShapeshiftForm,
  GetSpellTargetRestrictions,
  GetSpellTotems,
  GetSpellXDescriptionVariables,
  GetTraitDefinition,
  GetTraitEdgesForTree,
  GetTraitNode,
  GetTraitNodeEntry,
  GetTraitNodesForTree,
  GetTraitNodeXTraitNodeEntries,
  GetTraitSubTree,
  GetTraitTree,
  GetTraitTreeLoadout,
  GetTraitTreeLoadoutEntries,
  GetUiTextureAtlasElement,
  makeDbcResolvers,
} from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { dbcKeys } from "./dbc-keys";

const RAW_DBC_SCHEMA = "raw_dbc";

const fetchByIds = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  ids: readonly number[],
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to batch fetch ${resource} with IDs [${ids.slice(0, 5).join(", ")}${ids.length > 5 ? "..." : ""}]`,
      }),
    try: async () => {
      if (ids.length === 0) {
        return [];
      }

      const result = await dataProvider.getList<T>({
        resource,
        filters: [{ field: "ID", operator: "in", value: ids }],
        pagination: { mode: "off" },
        meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
      });

      for (const row of result.data) {
        // TODO Not sure about this cast lol
        const id = (row as unknown as { ID: number }).ID;

        queryClient.setQueryData(dbcKeys.one(resource, id), row);
      }

      return result.data;
    },
  });

const fetchByFk = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  fkField: string,
  fkValues: readonly number[],
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to batch fetch ${resource} by ${fkField}`,
      }),
    try: async () => {
      if (fkValues.length === 0) {
        return [];
      }

      const sortedValues = [...fkValues].sort((a, b) => a - b);
      const cacheKey = dbcKeys.list(resource, [
        { field: fkField, operator: "in", value: sortedValues },
      ]);

      return queryClient.fetchQuery({
        queryKey: cacheKey,
        queryFn: async () => {
          const result = await dataProvider.getList<T>({
            resource,
            filters: [{ field: fkField, operator: "in", value: fkValues }],
            pagination: { mode: "off" },
            meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
          });

          return result.data;
        },
      });
    },
  });

const fetchAll = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to fetch all ${resource}`,
      }),
    try: async () => {
      const cacheKey = dbcKeys.list(resource, []);

      return queryClient.fetchQuery({
        queryKey: cacheKey,
        queryFn: async () => {
          const result = await dataProvider.getList<T>({
            resource,
            pagination: { mode: "off" },
            meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
          });

          return result.data;
        },
      });
    },
  });

const fetchWithFilters = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  filters: CrudFilter[],
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to fetch ${resource} with filters`,
      }),
    try: async () => {
      const cacheKey = dbcKeys.list(resource, filters);

      return queryClient.fetchQuery({
        queryKey: cacheKey,
        queryFn: async () => {
          const result = await dataProvider.getList<T>({
            resource,
            filters,
            pagination: { mode: "off" },
            meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
          });

          return result.data;
        },
      });
    },
  });

const createBatchFetcher = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
): Layer.Layer<DbcBatchFetcher> =>
  Layer.succeed(DbcBatchFetcher, {
    // By ID
    fetchChrClassesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ChrClassesRow>(
        queryClient,
        dataProvider,
        "chr_classes",
        ids,
      ),
    fetchChrSpecializationsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ChrSpecializationRow>(
        queryClient,
        dataProvider,
        "chr_specialization",
        ids,
      ),
    fetchDifficultiesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.DifficultyRow>(
        queryClient,
        dataProvider,
        "difficulty",
        ids,
      ),
    fetchExpectedStatModsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ExpectedStatModRow>(
        queryClient,
        dataProvider,
        "expected_stat_mod",
        ids,
      ),
    fetchItemAppearancesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ItemAppearanceRow>(
        queryClient,
        dataProvider,
        "item_appearance",
        ids,
      ),
    fetchItemEffectsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ItemEffectRow>(
        queryClient,
        dataProvider,
        "item_effect",
        ids,
      ),
    fetchItemSparsesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ItemSparseRow>(
        queryClient,
        dataProvider,
        "item_sparse",
        ids,
      ),
    fetchItemsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ItemRow>(queryClient, dataProvider, "item", ids),
    fetchManifestInterfaceDataByIds: (ids) =>
      fetchByIds<Schemas.Dbc.ManifestInterfaceDataRow>(
        queryClient,
        dataProvider,
        "manifest_interface_data",
        ids,
      ),
    fetchSpellCastTimesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellCastTimesRow>(
        queryClient,
        dataProvider,
        "spell_cast_times",
        ids,
      ),
    fetchSpellCategoriesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellCategoryRow>(
        queryClient,
        dataProvider,
        "spell_category",
        ids,
      ),
    fetchSpellDescriptionVariablesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellDescriptionVariablesRow>(
        queryClient,
        dataProvider,
        "spell_description_variables",
        ids,
      ),
    fetchSpellDurationsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellDurationRow>(
        queryClient,
        dataProvider,
        "spell_duration",
        ids,
      ),
    fetchSpellNamesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellNameRow>(
        queryClient,
        dataProvider,
        "spell_name",
        ids,
      ),
    fetchSpellProcsPerMinuteByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellProcsPerMinuteRow>(
        queryClient,
        dataProvider,
        "spell_procs_per_minute",
        ids,
      ),
    fetchSpellRadiusByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellRadiusRow>(
        queryClient,
        dataProvider,
        "spell_radius",
        ids,
      ),
    fetchSpellRangesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellRangeRow>(
        queryClient,
        dataProvider,
        "spell_range",
        ids,
      ),
    fetchSpellShapeshiftFormsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellShapeshiftFormRow>(
        queryClient,
        dataProvider,
        "spell_shapeshift_form",
        ids,
      ),
    fetchSpellsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.SpellRow>(queryClient, dataProvider, "spell", ids),
    fetchTraitDefinitionsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.TraitDefinitionRow>(
        queryClient,
        dataProvider,
        "trait_definition",
        ids,
      ),
    fetchTraitNodeEntriesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.TraitNodeEntryRow>(
        queryClient,
        dataProvider,
        "trait_node_entry",
        ids,
      ),
    fetchTraitNodesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.TraitNodeRow>(
        queryClient,
        dataProvider,
        "trait_node",
        ids,
      ),
    fetchTraitSubTreesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.TraitSubTreeRow>(
        queryClient,
        dataProvider,
        "trait_sub_tree",
        ids,
      ),
    fetchTraitTreesByIds: (ids) =>
      fetchByIds<Schemas.Dbc.TraitTreeRow>(
        queryClient,
        dataProvider,
        "trait_tree",
        ids,
      ),
    fetchUiTextureAtlasElementsByIds: (ids) =>
      fetchByIds<Schemas.Dbc.UiTextureAtlasElementRow>(
        queryClient,
        dataProvider,
        "ui_texture_atlas_element",
        ids,
      ),

    // By SpellID (FK, single result)
    fetchSpellAuraOptionsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellAuraOptionsRow>(
        queryClient,
        dataProvider,
        "spell_aura_options",
        "SpellID",
        spellIds,
      ),
    fetchSpellAuraRestrictionsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellAuraRestrictionsRow>(
        queryClient,
        dataProvider,
        "spell_aura_restrictions",
        "SpellID",
        spellIds,
      ),
    fetchSpellCastingRequirementsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellCastingRequirementsRow>(
        queryClient,
        dataProvider,
        "spell_casting_requirements",
        "SpellID",
        spellIds,
      ),
    fetchSpellCategoriesBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellCategoriesRow>(
        queryClient,
        dataProvider,
        "spell_categories",
        "SpellID",
        spellIds,
      ),
    fetchSpellClassOptionsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellClassOptionsRow>(
        queryClient,
        dataProvider,
        "spell_class_options",
        "SpellID",
        spellIds,
      ),
    fetchSpellCooldownsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellCooldownsRow>(
        queryClient,
        dataProvider,
        "spell_cooldowns",
        "SpellID",
        spellIds,
      ),
    fetchSpellEmpowerBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellEmpowerRow>(
        queryClient,
        dataProvider,
        "spell_empower",
        "SpellID",
        spellIds,
      ),
    fetchSpellInterruptsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellInterruptsRow>(
        queryClient,
        dataProvider,
        "spell_interrupts",
        "SpellID",
        spellIds,
      ),
    fetchSpellMiscBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellMiscRow>(
        queryClient,
        dataProvider,
        "spell_misc",
        "SpellID",
        spellIds,
      ),
    fetchSpellReplacementBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellReplacementRow>(
        queryClient,
        dataProvider,
        "spell_replacement",
        "SpellID",
        spellIds,
      ),
    fetchSpellShapeshiftBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellShapeshiftRow>(
        queryClient,
        dataProvider,
        "spell_shapeshift",
        "SpellID",
        spellIds,
      ),
    fetchSpellTargetRestrictionsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellTargetRestrictionsRow>(
        queryClient,
        dataProvider,
        "spell_target_restrictions",
        "SpellID",
        spellIds,
      ),

    // By ItemID (FK, single result)
    fetchItemModifiedAppearancesByItemIds: (itemIds) =>
      fetchByFk<Schemas.Dbc.ItemModifiedAppearanceRow>(
        queryClient,
        dataProvider,
        "item_modified_appearance",
        "ItemID",
        itemIds,
      ),

    // By FK (array results)
    fetchItemXItemEffectsByItemIds: (itemIds) =>
      fetchByFk<Schemas.Dbc.ItemXItemEffectRow>(
        queryClient,
        dataProvider,
        "item_x_item_effect",
        "ItemID",
        itemIds,
      ),
    fetchSpecializationSpellsBySpecIds: (specIds) =>
      fetchByFk<Schemas.Dbc.SpecializationSpellsRow>(
        queryClient,
        dataProvider,
        "specialization_spells",
        "SpecID",
        specIds,
      ),
    fetchSpellEffectsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellEffectRow>(
        queryClient,
        dataProvider,
        "spell_effect",
        "SpellID",
        spellIds,
      ),
    fetchSpellEmpowerStagesByEmpowerIds: (empowerIds) =>
      fetchByFk<Schemas.Dbc.SpellEmpowerStageRow>(
        queryClient,
        dataProvider,
        "spell_empower_stage",
        "SpellEmpowerID",
        empowerIds,
      ),
    fetchSpellLearnSpellBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellLearnSpellRow>(
        queryClient,
        dataProvider,
        "spell_learn_spell",
        "SpellID",
        spellIds,
      ),
    fetchSpellLevelsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellLevelsRow>(
        queryClient,
        dataProvider,
        "spell_levels",
        "SpellID",
        spellIds,
      ),
    fetchSpellPowerBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellPowerRow>(
        queryClient,
        dataProvider,
        "spell_power",
        "SpellID",
        spellIds,
      ),
    fetchSpellProcsPerMinuteModsByPpmIds: (ppmIds) =>
      fetchByFk<Schemas.Dbc.SpellProcsPerMinuteModRow>(
        queryClient,
        dataProvider,
        "spell_procs_per_minute_mod",
        "SpellProcsPerMinuteID",
        ppmIds,
      ),
    fetchSpellTotemsBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellTotemsRow>(
        queryClient,
        dataProvider,
        "spell_totems",
        "SpellID",
        spellIds,
      ),
    fetchSpellXDescriptionVariablesBySpellIds: (spellIds) =>
      fetchByFk<Schemas.Dbc.SpellXDescriptionVariablesRow>(
        queryClient,
        dataProvider,
        "spell_x_description_variables",
        "SpellID",
        spellIds,
      ),
    fetchTraitNodesByTreeIds: (treeIds) =>
      fetchByFk<Schemas.Dbc.TraitNodeRow>(
        queryClient,
        dataProvider,
        "trait_node",
        "TraitTreeID",
        treeIds,
      ),
    fetchTraitNodeXEntriesByNodeIds: (nodeIds) =>
      fetchByFk<Schemas.Dbc.TraitNodeXTraitNodeEntryRow>(
        queryClient,
        dataProvider,
        "trait_node_x_trait_node_entry",
        "TraitNodeID",
        nodeIds,
      ),
    fetchTraitTreeLoadoutsBySpecIds: (specIds) =>
      fetchByFk<Schemas.Dbc.TraitTreeLoadoutRow>(
        queryClient,
        dataProvider,
        "trait_tree_loadout",
        "ChrSpecializationID",
        specIds,
      ),
    fetchTraitTreeLoadoutEntriesByLoadoutIds: (loadoutIds) =>
      fetchByFk<Schemas.Dbc.TraitTreeLoadoutEntryRow>(
        queryClient,
        dataProvider,
        "trait_tree_loadout_entry",
        "TraitTreeLoadoutID",
        loadoutIds,
      ),
    fetchTraitEdgesByTreeIds: (treeIds) =>
      Effect.gen(function* () {
        if (treeIds.length === 0) {
          return new Map<number, Schemas.Dbc.TraitEdgeRow[]>();
        }

        const nodes = yield* fetchByFk<Schemas.Dbc.TraitNodeRow>(
          queryClient,
          dataProvider,
          "trait_node",
          "TraitTreeID",
          treeIds,
        );

        if (nodes.length === 0) {
          return new Map<number, Schemas.Dbc.TraitEdgeRow[]>();
        }

        const nodeToTree = new Map<number, number>();
        for (const node of nodes) {
          nodeToTree.set(node.ID, node.TraitTreeID);
        }

        const nodeIds = nodes.map((n) => n.ID);
        const edges = yield* fetchByFk<Schemas.Dbc.TraitEdgeRow>(
          queryClient,
          dataProvider,
          "trait_edge",
          "LeftTraitNodeID",
          nodeIds,
        );

        const edgesByTree = new Map<number, Schemas.Dbc.TraitEdgeRow[]>();
        for (const treeId of treeIds) {
          edgesByTree.set(treeId, []);
        }

        for (const edge of edges) {
          const treeId = nodeToTree.get(edge.LeftTraitNodeID);

          if (treeId !== undefined) {
            edgesByTree.get(treeId)!.push(edge);
          }
        }

        return edgesByTree;
      }),
  });

export const RefineDbcService = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
): Layer.Layer<DbcService> => {
  const batchFetcherLayer = createBatchFetcher(queryClient, dataProvider);
  const resolversLayer = Layer.effect(DbcResolvers, makeDbcResolvers).pipe(
    Layer.provide(batchFetcherLayer),
  );

  return Layer.effect(
    DbcService,
    Effect.gen(function* () {
      const resolvers = yield* DbcResolvers;

      return {
        // By ID (batched)
        getChrClass: (id) =>
          Effect.request(new GetChrClass({ id }), resolvers.chrClassResolver),
        getChrSpecialization: (id) =>
          Effect.request(
            new GetChrSpecialization({ id }),
            resolvers.chrSpecializationResolver,
          ),
        getDifficulty: (id) =>
          Effect.request(
            new GetDifficulty({ id }),
            resolvers.difficultyResolver,
          ),
        getExpectedStatMod: (id) =>
          Effect.request(
            new GetExpectedStatMod({ id }),
            resolvers.expectedStatModResolver,
          ),
        getItem: (id) =>
          Effect.request(new GetItem({ id }), resolvers.itemResolver),
        getItemAppearance: (id) =>
          Effect.request(
            new GetItemAppearance({ id }),
            resolvers.itemAppearanceResolver,
          ),
        getItemEffect: (id) =>
          Effect.request(
            new GetItemEffect({ id }),
            resolvers.itemEffectResolver,
          ),
        getItemSparse: (id) =>
          Effect.request(
            new GetItemSparse({ id }),
            resolvers.itemSparseResolver,
          ),
        getManifestInterfaceData: (id) =>
          Effect.request(
            new GetManifestInterfaceData({ id }),
            resolvers.manifestInterfaceDataResolver,
          ),
        getSpell: (id) =>
          Effect.request(new GetSpell({ id }), resolvers.spellResolver),
        getSpellCastTimes: (id) =>
          Effect.request(
            new GetSpellCastTimes({ id }),
            resolvers.spellCastTimesResolver,
          ),
        getSpellCategory: (id) =>
          Effect.request(
            new GetSpellCategory({ id }),
            resolvers.spellCategoryResolver,
          ),
        getSpellDescriptionVariables: (id) =>
          Effect.request(
            new GetSpellDescriptionVariables({ id }),
            resolvers.spellDescriptionVariablesResolver,
          ),
        getSpellDuration: (id) =>
          Effect.request(
            new GetSpellDuration({ id }),
            resolvers.spellDurationResolver,
          ),
        getSpellName: (id) =>
          Effect.request(new GetSpellName({ id }), resolvers.spellNameResolver),
        getSpellProcsPerMinute: (id) =>
          Effect.request(
            new GetSpellProcsPerMinute({ id }),
            resolvers.spellProcsPerMinuteResolver,
          ),
        getSpellRadius: (id) =>
          Effect.request(
            new GetSpellRadius({ id }),
            resolvers.spellRadiusResolver,
          ),
        getSpellRange: (id) =>
          Effect.request(
            new GetSpellRange({ id }),
            resolvers.spellRangeResolver,
          ),
        getSpellShapeshiftForm: (id) =>
          Effect.request(
            new GetSpellShapeshiftForm({ id }),
            resolvers.spellShapeshiftFormResolver,
          ),
        getTraitDefinition: (id) =>
          Effect.request(
            new GetTraitDefinition({ id }),
            resolvers.traitDefinitionResolver,
          ),
        getTraitNode: (id) =>
          Effect.request(new GetTraitNode({ id }), resolvers.traitNodeResolver),
        getTraitNodeEntry: (id) =>
          Effect.request(
            new GetTraitNodeEntry({ id }),
            resolvers.traitNodeEntryResolver,
          ),
        getTraitSubTree: (id) =>
          Effect.request(
            new GetTraitSubTree({ id }),
            resolvers.traitSubTreeResolver,
          ),
        getTraitTree: (id) =>
          Effect.request(new GetTraitTree({ id }), resolvers.traitTreeResolver),

        // By SpellID (FK, single result - batched)
        getSpellAuraOptions: (spellId) =>
          Effect.request(
            new GetSpellAuraOptions({ spellId }),
            resolvers.spellAuraOptionsResolver,
          ),
        getSpellAuraRestrictions: (spellId) =>
          Effect.request(
            new GetSpellAuraRestrictions({ spellId }),
            resolvers.spellAuraRestrictionsResolver,
          ),
        getSpellCastingRequirements: (spellId) =>
          Effect.request(
            new GetSpellCastingRequirements({ spellId }),
            resolvers.spellCastingRequirementsResolver,
          ),
        getSpellCategories: (spellId) =>
          Effect.request(
            new GetSpellCategories({ spellId }),
            resolvers.spellCategoriesResolver,
          ),
        getSpellClassOptions: (spellId) =>
          Effect.request(
            new GetSpellClassOptions({ spellId }),
            resolvers.spellClassOptionsResolver,
          ),
        getSpellCooldowns: (spellId) =>
          Effect.request(
            new GetSpellCooldowns({ spellId }),
            resolvers.spellCooldownsResolver,
          ),
        getSpellEmpower: (spellId) =>
          Effect.request(
            new GetSpellEmpower({ spellId }),
            resolvers.spellEmpowerResolver,
          ),
        getSpellInterrupts: (spellId) =>
          Effect.request(
            new GetSpellInterrupts({ spellId }),
            resolvers.spellInterruptsResolver,
          ),
        getSpellMisc: (spellId) =>
          Effect.request(
            new GetSpellMisc({ spellId }),
            resolvers.spellMiscResolver,
          ),
        getSpellReplacement: (spellId) =>
          Effect.request(
            new GetSpellReplacement({ spellId }),
            resolvers.spellReplacementResolver,
          ),
        getSpellShapeshift: (spellId) =>
          Effect.request(
            new GetSpellShapeshift({ spellId }),
            resolvers.spellShapeshiftResolver,
          ),
        getSpellTargetRestrictions: (spellId) =>
          Effect.request(
            new GetSpellTargetRestrictions({ spellId }),
            resolvers.spellTargetRestrictionsResolver,
          ),

        // By ItemID (FK, single result - batched)
        getItemModifiedAppearance: (itemId) =>
          Effect.request(
            new GetItemModifiedAppearance({ itemId }),
            resolvers.itemModifiedAppearanceResolver,
          ),

        // By FK (array results - batched)
        getItemXItemEffects: (itemId) =>
          Effect.request(
            new GetItemXItemEffects({ itemId }),
            resolvers.itemXItemEffectsResolver,
          ),
        getSpecializationSpells: (specId) =>
          Effect.request(
            new GetSpecializationSpells({ specId }),
            resolvers.specializationSpellsResolver,
          ),
        getSpellEffects: (spellId) =>
          Effect.request(
            new GetSpellEffects({ spellId }),
            resolvers.spellEffectsResolver,
          ),
        getSpellEmpowerStages: (spellEmpowerId) =>
          Effect.request(
            new GetSpellEmpowerStages({ spellEmpowerId }),
            resolvers.spellEmpowerStagesResolver,
          ),
        getSpellLearnSpell: (spellId) =>
          Effect.request(
            new GetSpellLearnSpell({ spellId }),
            resolvers.spellLearnSpellResolver,
          ),
        getSpellLevels: (spellId) =>
          Effect.request(
            new GetSpellLevels({ spellId }),
            resolvers.spellLevelsResolver,
          ),
        getSpellPower: (spellId) =>
          Effect.request(
            new GetSpellPower({ spellId }),
            resolvers.spellPowerResolver,
          ),
        getSpellProcsPerMinuteMods: (spellProcsPerMinuteId) =>
          Effect.request(
            new GetSpellProcsPerMinuteMods({ spellProcsPerMinuteId }),
            resolvers.spellProcsPerMinuteModsResolver,
          ),
        getSpellTotems: (spellId) =>
          Effect.request(
            new GetSpellTotems({ spellId }),
            resolvers.spellTotemsResolver,
          ),
        getSpellXDescriptionVariables: (spellId) =>
          Effect.request(
            new GetSpellXDescriptionVariables({ spellId }),
            resolvers.spellXDescriptionVariablesResolver,
          ),
        getTraitNodesForTree: (treeId) =>
          Effect.request(
            new GetTraitNodesForTree({ treeId }),
            resolvers.traitNodesForTreeResolver,
          ),
        getTraitNodeXTraitNodeEntries: (nodeId) =>
          Effect.request(
            new GetTraitNodeXTraitNodeEntries({ nodeId }),
            resolvers.traitNodeXEntriesResolver,
          ),
        getTraitEdgesForTree: (treeId) =>
          Effect.request(
            new GetTraitEdgesForTree({ treeId }),
            resolvers.traitEdgesForTreeResolver,
          ),
        getTraitTreeLoadout: (specId) =>
          Effect.request(
            new GetTraitTreeLoadout({ specId }),
            resolvers.traitTreeLoadoutResolver,
          ),
        getTraitTreeLoadoutEntries: (loadoutId) =>
          Effect.request(
            new GetTraitTreeLoadoutEntries({ loadoutId }),
            resolvers.traitTreeLoadoutEntriesResolver,
          ),
        getUiTextureAtlasElement: (id) =>
          Effect.request(
            new GetUiTextureAtlasElement({ id }),
            resolvers.uiTextureAtlasElementResolver,
          ),

        // Non-batchable (fetch all or complex queries)
        getChrClasses: () =>
          fetchAll<Schemas.Dbc.ChrClassesRow>(
            queryClient,
            dataProvider,
            "chr_classes",
          ),
        getChrSpecializations: () =>
          fetchAll<Schemas.Dbc.ChrSpecializationRow>(
            queryClient,
            dataProvider,
            "chr_specialization",
          ),
        getExpectedStats: (level, expansion) =>
          fetchWithFilters<Schemas.Dbc.ExpectedStatRow>(
            queryClient,
            dataProvider,
            "expected_stat",
            [{ field: "Lvl", operator: "eq", value: level }],
          ).pipe(
            Effect.map((data) =>
              data.filter(
                (row) =>
                  row.ExpansionID === expansion || row.ExpansionID === -2,
              ),
            ),
          ),
        getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
          fetchWithFilters<Schemas.Dbc.ContentTuningXExpectedRow>(
            queryClient,
            dataProvider,
            "content_tuning_x_expected",
            [
              {
                field: "ContentTuningID",
                operator: "eq",
                value: contentTuningId,
              },
            ],
          ).pipe(
            Effect.map((data) =>
              data.filter(
                (row) =>
                  (row.MinMythicPlusSeasonID === 0 ||
                    row.MinMythicPlusSeasonID <= mythicPlusSeasonId) &&
                  (row.MaxMythicPlusSeasonID === 0 ||
                    row.MaxMythicPlusSeasonID > mythicPlusSeasonId),
              ),
            ),
          ),
        getDifficultyChain: (id) =>
          Effect.gen(function* () {
            const chain: Schemas.Dbc.DifficultyRow[] = [];
            let currentId = id;

            while (currentId !== 0) {
              const row = yield* Effect.request(
                new GetDifficulty({ id: currentId }),
                resolvers.difficultyResolver,
              );

              if (!row) {
                break;
              }

              chain.push(row);
              currentId = row.FallbackDifficultyID ?? 0;
            }

            return chain;
          }),

        // TOOD Sort this properly
        getSpecSetMembers: (specSetIds: readonly number[]) =>
          fetchByFk<Schemas.Dbc.SpecSetMemberRow>(
            queryClient,
            dataProvider,
            "spec_set_member",
            "SpecSet",
            specSetIds,
          ),
        getTraitConds: (condIds: readonly number[]) =>
          fetchByIds<Schemas.Dbc.TraitCondRow>(
            queryClient,
            dataProvider,
            "trait_cond",
            condIds,
          ),
        getTraitNodeGroupXTraitConds: (groupIds: readonly number[]) =>
          fetchByFk<Schemas.Dbc.TraitNodeGroupXTraitCondRow>(
            queryClient,
            dataProvider,
            "trait_node_group_x_trait_cond",
            "TraitNodeGroupID",
            groupIds,
          ),
        getTraitNodeGroupXTraitNodes: (nodeIds: readonly number[]) =>
          fetchByFk<Schemas.Dbc.TraitNodeGroupXTraitNodeRow>(
            queryClient,
            dataProvider,
            "trait_node_group_x_trait_node",
            "TraitNodeID",
            nodeIds,
          ),
      };
    }),
  ).pipe(Layer.provide(resolversLayer));
};
