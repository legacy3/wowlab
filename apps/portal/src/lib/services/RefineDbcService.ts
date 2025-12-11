import type { BaseRecord, CrudFilter, DataProvider } from "@refinedev/core";
import type * as Schemas from "@wowlab/core/Schemas";
import type { QueryClient } from "@tanstack/react-query";

import { DbcQueryError } from "@wowlab/core/Errors";
import { DbcService } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { dbcKeys } from "./dbc-keys";

const RAW_DBC_SCHEMA = "raw_dbc";

const cachedQuery = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  errorMessage: string,
): Effect.Effect<T, DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) => new DbcQueryError({ cause, message: errorMessage }),
    try: async () => {
      const data = await queryClient.ensureQueryData({
        queryKey,
        meta: { persist: true },
        queryFn: async () => {
          const result = await queryFn();

          // React Query v5 doesn't allow undefined, use null as sentinel
          return result ?? null;
        },
      });

      // Convert null sentinel back to undefined for Effect layer
      return (data ?? undefined) as T;
    },
  });

const getOne = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  id: number,
): Effect.Effect<T | undefined, DbcQueryError> =>
  cachedQuery(
    queryClient,
    dbcKeys.one(resource, id),
    async () => {
      try {
        const result = await dataProvider.getOne<T>({
          resource,
          id,
          meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
        });

        return result.data;
      } catch {
        return undefined;
      }
    },
    `Failed to fetch ${resource} with ID ${id}`,
  );

const getList = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  filters: CrudFilter[],
): Effect.Effect<T[], DbcQueryError> =>
  cachedQuery(
    queryClient,
    dbcKeys.list(resource, filters),
    async () => {
      const result = await dataProvider.getList<T>({
        resource,
        filters,
        pagination: { mode: "off" },
        meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
      });

      return result.data;
    },
    `Failed to fetch ${resource} list`,
  );

const getOneByFilter = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  field: string,
  value: number,
): Effect.Effect<T | undefined, DbcQueryError> =>
  getList<T>(queryClient, dataProvider, resource, [
    { field, operator: "eq", value },
  ]).pipe(Effect.map((rows) => rows[0]));

const getListByFilter = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  field: string,
  value: number,
): Effect.Effect<T[], DbcQueryError> =>
  getList<T>(queryClient, dataProvider, resource, [
    { field, operator: "eq", value },
  ]);

/**
 * Creates a DbcService layer that uses React Query's caching via queryClient.ensureQueryData.
 * All data is cached in React Query and persisted to IndexedDB (60-day cache).
 *
 * @example
 * ```tsx
 * // In a React component
 * const dataProvider = useDataProvider()();
 * const queryClient = useQueryClient();
 * const dbcLayer = RefineDbcService(queryClient, dataProvider);
 * const spell = await Effect.runPromise(
 *   transformSpell(spellId).pipe(Effect.provide(dbcLayer))
 * );
 * ```
 */
export const RefineDbcService = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    // Class/spec tables
    getChrClass: (id) =>
      getOne<Schemas.Dbc.ChrClassesRow>(
        queryClient,
        dataProvider,
        "chr_classes",
        id,
      ),
    getChrClasses: () =>
      getList<Schemas.Dbc.ChrClassesRow>(
        queryClient,
        dataProvider,
        "chr_classes",
        [],
      ),
    getChrSpecialization: (id) =>
      getOne<Schemas.Dbc.ChrSpecializationRow>(
        queryClient,
        dataProvider,
        "chr_specialization",
        id,
      ),
    getChrSpecializations: () =>
      getList<Schemas.Dbc.ChrSpecializationRow>(
        queryClient,
        dataProvider,
        "chr_specialization",
        [],
      ),
    // Lookup tables (keyed by ID)
    getDifficulty: (id) =>
      getOne<Schemas.Dbc.DifficultyRow>(
        queryClient,
        dataProvider,
        "difficulty",
        id,
      ),
    getExpectedStatMod: (id) =>
      getOne<Schemas.Dbc.ExpectedStatModRow>(
        queryClient,
        dataProvider,
        "expected_stat_mod",
        id,
      ),
    getItem: (itemId) =>
      getOne<Schemas.Dbc.ItemRow>(queryClient, dataProvider, "item", itemId),
    getItemEffect: (id) =>
      getOne<Schemas.Dbc.ItemEffectRow>(
        queryClient,
        dataProvider,
        "item_effect",
        id,
      ),
    getItemSparse: (itemId) =>
      getOne<Schemas.Dbc.ItemSparseRow>(
        queryClient,
        dataProvider,
        "item_sparse",
        itemId,
      ),
    getManifestInterfaceData: (id) =>
      getOne<Schemas.Dbc.ManifestInterfaceDataRow>(
        queryClient,
        dataProvider,
        "manifest_interface_data",
        id,
      ),
    getSpecializationSpells: (specId) =>
      getListByFilter<Schemas.Dbc.SpecializationSpellsRow>(
        queryClient,
        dataProvider,
        "specialization_spells",
        "SpecID",
        specId,
      ),
    getSpell: (spellId) =>
      getOne<Schemas.Dbc.SpellRow>(queryClient, dataProvider, "spell", spellId),
    getSpellCastTimes: (id) =>
      getOne<Schemas.Dbc.SpellCastTimesRow>(
        queryClient,
        dataProvider,
        "spell_cast_times",
        id,
      ),
    getSpellCategory: (id) =>
      getOne<Schemas.Dbc.SpellCategoryRow>(
        queryClient,
        dataProvider,
        "spell_category",
        id,
      ),
    getSpellDescriptionVariables: (id) =>
      getOne<Schemas.Dbc.SpellDescriptionVariablesRow>(
        queryClient,
        dataProvider,
        "spell_description_variables",
        id,
      ),
    getSpellDuration: (id) =>
      getOne<Schemas.Dbc.SpellDurationRow>(
        queryClient,
        dataProvider,
        "spell_duration",
        id,
      ),
    getSpellName: (spellId) =>
      getOne<Schemas.Dbc.SpellNameRow>(
        queryClient,
        dataProvider,
        "spell_name",
        spellId,
      ),
    getSpellProcsPerMinute: (id) =>
      getOne<Schemas.Dbc.SpellProcsPerMinuteRow>(
        queryClient,
        dataProvider,
        "spell_procs_per_minute",
        id,
      ),
    getSpellRadius: (id) =>
      getOne<Schemas.Dbc.SpellRadiusRow>(
        queryClient,
        dataProvider,
        "spell_radius",
        id,
      ),
    getSpellRange: (id) =>
      getOne<Schemas.Dbc.SpellRangeRow>(
        queryClient,
        dataProvider,
        "spell_range",
        id,
      ),
    getSpellShapeshiftForm: (id) =>
      getOne<Schemas.Dbc.SpellShapeshiftFormRow>(
        queryClient,
        dataProvider,
        "spell_shapeshift_form",
        id,
      ),

    // Tables queried by SpellID (single row)
    getSpellAuraOptions: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellAuraOptionsRow>(
        queryClient,
        dataProvider,
        "spell_aura_options",
        "SpellID",
        spellId,
      ),
    getSpellAuraRestrictions: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellAuraRestrictionsRow>(
        queryClient,
        dataProvider,
        "spell_aura_restrictions",
        "SpellID",
        spellId,
      ),
    getSpellCastingRequirements: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellCastingRequirementsRow>(
        queryClient,
        dataProvider,
        "spell_casting_requirements",
        "SpellID",
        spellId,
      ),
    getSpellCategories: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellCategoriesRow>(
        queryClient,
        dataProvider,
        "spell_categories",
        "SpellID",
        spellId,
      ),
    getSpellClassOptions: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellClassOptionsRow>(
        queryClient,
        dataProvider,
        "spell_class_options",
        "SpellID",
        spellId,
      ),
    getSpellCooldowns: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellCooldownsRow>(
        queryClient,
        dataProvider,
        "spell_cooldowns",
        "SpellID",
        spellId,
      ),
    getSpellEmpower: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellEmpowerRow>(
        queryClient,
        dataProvider,
        "spell_empower",
        "SpellID",
        spellId,
      ),
    getSpellInterrupts: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellInterruptsRow>(
        queryClient,
        dataProvider,
        "spell_interrupts",
        "SpellID",
        spellId,
      ),
    getSpellMisc: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellMiscRow>(
        queryClient,
        dataProvider,
        "spell_misc",
        "SpellID",
        spellId,
      ),
    getSpellReplacement: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellReplacementRow>(
        queryClient,
        dataProvider,
        "spell_replacement",
        "SpellID",
        spellId,
      ),
    getSpellShapeshift: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellShapeshiftRow>(
        queryClient,
        dataProvider,
        "spell_shapeshift",
        "SpellID",
        spellId,
      ),
    getSpellTargetRestrictions: (spellId) =>
      getOneByFilter<Schemas.Dbc.SpellTargetRestrictionsRow>(
        queryClient,
        dataProvider,
        "spell_target_restrictions",
        "SpellID",
        spellId,
      ),

    // Tables queried by SpellID (multiple rows)
    getSpellEffects: (spellId) =>
      getListByFilter<Schemas.Dbc.SpellEffectRow>(
        queryClient,
        dataProvider,
        "spell_effect",
        "SpellID",
        spellId,
      ),
    getSpellLearnSpell: (spellId) =>
      getListByFilter<Schemas.Dbc.SpellLearnSpellRow>(
        queryClient,
        dataProvider,
        "spell_learn_spell",
        "SpellID",
        spellId,
      ),
    getSpellLevels: (spellId) =>
      getListByFilter<Schemas.Dbc.SpellLevelsRow>(
        queryClient,
        dataProvider,
        "spell_levels",
        "SpellID",
        spellId,
      ),
    getSpellPower: (spellId) =>
      getListByFilter<Schemas.Dbc.SpellPowerRow>(
        queryClient,
        dataProvider,
        "spell_power",
        "SpellID",
        spellId,
      ),
    getSpellTotems: (spellId) =>
      getListByFilter<Schemas.Dbc.SpellTotemsRow>(
        queryClient,
        dataProvider,
        "spell_totems",
        "SpellID",
        spellId,
      ),
    getSpellXDescriptionVariables: (spellId) =>
      getListByFilter<Schemas.Dbc.SpellXDescriptionVariablesRow>(
        queryClient,
        dataProvider,
        "spell_x_description_variables",
        "SpellID",
        spellId,
      ),

    // Tables queried by other foreign keys
    getSpellEmpowerStages: (spellEmpowerId) =>
      getListByFilter<Schemas.Dbc.SpellEmpowerStageRow>(
        queryClient,
        dataProvider,
        "spell_empower_stage",
        "SpellEmpowerID",
        spellEmpowerId,
      ),
    getSpellProcsPerMinuteMods: (spellProcsPerMinuteId) =>
      getListByFilter<Schemas.Dbc.SpellProcsPerMinuteModRow>(
        queryClient,
        dataProvider,
        "spell_procs_per_minute_mod",
        "SpellProcsPerMinuteID",
        spellProcsPerMinuteId,
      ),

    // Item tables
    getItemAppearance: (id) =>
      getOne<Schemas.Dbc.ItemAppearanceRow>(
        queryClient,
        dataProvider,
        "item_appearance",
        id,
      ),
    getItemModifiedAppearance: (itemId) =>
      getOneByFilter<Schemas.Dbc.ItemModifiedAppearanceRow>(
        queryClient,
        dataProvider,
        "item_modified_appearance",
        "ItemID",
        itemId,
      ),
    getItemXItemEffects: (itemId) =>
      getListByFilter<Schemas.Dbc.ItemXItemEffectRow>(
        queryClient,
        dataProvider,
        "item_x_item_effect",
        "ItemID",
        itemId,
      ),

    // Complex queries
    getExpectedStats: (level, expansion) =>
      getList<Schemas.Dbc.ExpectedStatRow>(
        queryClient,
        dataProvider,
        "expected_stat",
        [{ field: "Lvl", operator: "eq", value: level }],
      ).pipe(
        Effect.map((data) =>
          data.filter(
            (row) => row.ExpansionID === expansion || row.ExpansionID === -2,
          ),
        ),
      ),

    getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
      getList<Schemas.Dbc.ContentTuningXExpectedRow>(
        queryClient,
        dataProvider,
        "content_tuning_x_expected",
        [{ field: "ContentTuningID", operator: "eq", value: contentTuningId }],
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
          const row = yield* getOne<Schemas.Dbc.DifficultyRow>(
            queryClient,
            dataProvider,
            "difficulty",
            currentId,
          );

          if (!row) {
            break;
          }

          chain.push(row);
          currentId = row.FallbackDifficultyID ?? 0;
        }

        return chain;
      }),

    getTraitDefinition: (id) =>
      getOne<Schemas.Dbc.TraitDefinitionRow>(
        queryClient,
        dataProvider,
        "trait_definition",
        id,
      ),
    getTraitEdgesForTree: (treeId) =>
      getListByFilter<Schemas.Dbc.TraitEdgeRow>(
        queryClient,
        dataProvider,
        "trait_edge",
        "LeftTraitNodeID",
        treeId, // Note: This needs proper join logic - using raw query would be better
      ),
    getTraitNode: (id) =>
      getOne<Schemas.Dbc.TraitNodeRow>(
        queryClient,
        dataProvider,
        "trait_node",
        id,
      ),
    getTraitNodeEntry: (id) =>
      getOne<Schemas.Dbc.TraitNodeEntryRow>(
        queryClient,
        dataProvider,
        "trait_node_entry",
        id,
      ),
    getTraitNodesForTree: (treeId) =>
      getListByFilter<Schemas.Dbc.TraitNodeRow>(
        queryClient,
        dataProvider,
        "trait_node",
        "TraitTreeID",
        treeId,
      ),
    getTraitNodeXTraitNodeEntries: (nodeId) =>
      getListByFilter<Schemas.Dbc.TraitNodeXTraitNodeEntryRow>(
        queryClient,
        dataProvider,
        "trait_node_x_trait_node_entry",
        "TraitNodeID",
        nodeId,
      ),
    getTraitSubTree: (id) =>
      getOne<Schemas.Dbc.TraitSubTreeRow>(
        queryClient,
        dataProvider,
        "trait_sub_tree",
        id,
      ),
    getTraitTree: (id) =>
      getOne<Schemas.Dbc.TraitTreeRow>(
        queryClient,
        dataProvider,
        "trait_tree",
        id,
      ),
    getTraitTreeLoadout: (specId) =>
      getOneByFilter<Schemas.Dbc.TraitTreeLoadoutRow>(
        queryClient,
        dataProvider,
        "trait_tree_loadout",
        "ChrSpecializationID",
        specId,
      ),
    getTraitTreeLoadoutEntries: (loadoutId) =>
      getListByFilter<Schemas.Dbc.TraitTreeLoadoutEntryRow>(
        queryClient,
        dataProvider,
        "trait_tree_loadout_entry",
        "TraitTreeLoadoutID",
        loadoutId,
      ),
  });
