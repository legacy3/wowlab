import type { BaseRecord, CrudFilter, DataProvider } from "@refinedev/core";
import type * as Schemas from "@wowlab/core/Schemas";
import type { QueryClient } from "@tanstack/react-query";

import { DbcQueryError } from "@wowlab/core/Errors";
import { DbcService } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { dbcKeys } from "./dbc-keys";

const RAW_DBC_SCHEMA = "raw_dbc";

const getOne = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  id: number,
): Effect.Effect<T | undefined, DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to fetch ${resource} with ID ${id}`,
      }),
    try: () =>
      queryClient.ensureQueryData({
        queryKey: dbcKeys.one(resource, id),
        meta: { persist: true },
        queryFn: async () => {
          const result = await dataProvider.getOne<T>({
            resource,
            id,
            meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
          });
          return result.data;
        },
      }),
  });

const getList = <T extends BaseRecord>(
  queryClient: QueryClient,
  dataProvider: DataProvider,
  resource: string,
  filters: CrudFilter[],
): Effect.Effect<T[], DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to fetch ${resource} list`,
      }),
    try: () =>
      queryClient.ensureQueryData({
        queryKey: dbcKeys.list(resource, filters),
        meta: { persist: true },
        queryFn: async () => {
          const result = await dataProvider.getList<T>({
            resource,
            filters,
            pagination: { mode: "off" },
            meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
          });
          return result.data;
        },
      }),
  });

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
      Effect.tryPromise({
        catch: (cause) =>
          new DbcQueryError({
            cause,
            message: "Failed to fetch expected_stat",
          }),
        try: async () => {
          const data = await queryClient.ensureQueryData({
            queryKey: dbcKeys.list("expected_stat", [
              { field: "Lvl", operator: "eq", value: level },
            ]),
            meta: { persist: true },
            queryFn: async () => {
              const result =
                await dataProvider.getList<Schemas.Dbc.ExpectedStatRow>({
                  resource: "expected_stat",
                  filters: [{ field: "Lvl", operator: "eq", value: level }],
                  pagination: { mode: "off" },
                  meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
                });
              return result.data;
            },
          });

          return data.filter(
            (row) => row.ExpansionID === expansion || row.ExpansionID === -2,
          );
        },
      }),

    getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
      Effect.tryPromise({
        catch: (cause) =>
          new DbcQueryError({
            cause,
            message: "Failed to fetch content_tuning_x_expected",
          }),
        try: async () => {
          const data = await queryClient.ensureQueryData({
            queryKey: dbcKeys.list("content_tuning_x_expected", [
              {
                field: "ContentTuningID",
                operator: "eq",
                value: contentTuningId,
              },
            ]),
            meta: { persist: true },
            queryFn: async () => {
              const result =
                await dataProvider.getList<Schemas.Dbc.ContentTuningXExpectedRow>(
                  {
                    resource: "content_tuning_x_expected",
                    filters: [
                      {
                        field: "ContentTuningID",
                        operator: "eq",
                        value: contentTuningId,
                      },
                    ],
                    pagination: { mode: "off" },
                    meta: { schema: RAW_DBC_SCHEMA, idColumnName: "ID" },
                  },
                );

              return result.data;
            },
          });

          return data.filter(
            (row) =>
              (row.MinMythicPlusSeasonID === 0 ||
                row.MinMythicPlusSeasonID <= mythicPlusSeasonId) &&
              (row.MaxMythicPlusSeasonID === 0 ||
                row.MaxMythicPlusSeasonID > mythicPlusSeasonId),
          );
        },
      }),

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
  });
