import type * as Schemas from "@wowlab/core/Schemas";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DbcQueryError } from "@wowlab/core/Errors";
import { DbcService, type DbcServiceInterface } from "@wowlab/services/Data";
import * as Cache from "effect/Cache";
import * as Config from "effect/Config";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
} from "./config.js";

const CACHE_CAPACITY = 1000;
const CACHE_TTL = Duration.minutes(5);

// ============================================================================
// Query Helpers
// ============================================================================

const query = <T>(
  supabase: SupabaseClient,
  table: string,
  fn: (
    builder: ReturnType<ReturnType<SupabaseClient["schema"]>["from"]>,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Effect.Effect<T, DbcQueryError> =>
  Effect.tryPromise({
    catch: (cause) =>
      new DbcQueryError({
        cause,
        message: `Failed to query ${table}`,
      }),
    try: () => fn(supabase.schema("raw_dbc").from(table)),
  }).pipe(
    Effect.flatMap((result) => {
      if (result.error) {
        return Effect.fail(
          new DbcQueryError({
            message: `Query error on ${table}: ${result.error.message}`,
          }),
        );
      }
      return Effect.succeed(result.data as T);
    }),
  );

const queryById = <T>(
  supabase: SupabaseClient,
  table: string,
  id: number,
): Effect.Effect<T | undefined, DbcQueryError> =>
  query<T[]>(supabase, table, (builder) =>
    builder.select("*").eq("ID", id).limit(1),
  ).pipe(Effect.map((rows) => rows[0]));

const queryByForeignKey = <T>(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: number,
): Effect.Effect<T[], DbcQueryError> =>
  query<T[]>(supabase, table, (builder) =>
    builder.select("*").eq(column, value),
  );

const queryOneByForeignKey = <T>(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: number,
): Effect.Effect<T | undefined, DbcQueryError> =>
  queryByForeignKey<T>(supabase, table, column, value).pipe(
    Effect.map((rows) => rows[0]),
  );

// ============================================================================
// Raw Query for MCP Tools
// ============================================================================

export interface QueryTableParams {
  ascending?: boolean;
  filters?: Record<string, unknown>;
  limit?: number;
  orderBy?: string;
  select?: string[];
  table: string;
}

export const queryTable = (
  supabase: SupabaseClient,
  params: QueryTableParams,
): Effect.Effect<unknown[], DbcQueryError> =>
  Effect.gen(function* () {
    const {
      ascending = true,
      filters,
      limit = 10,
      orderBy,
      select,
      table,
    } = params;

    let builder = supabase
      .schema("raw_dbc")
      .from(table)
      .select(select?.join(",") ?? "*");

    // Apply filters
    if (filters) {
      for (const [column, value] of Object.entries(filters)) {
        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === "object" && !Array.isArray(value)) {
          const filterObj = value as Record<string, unknown>;

          if ("eq" in filterObj) {
            builder = builder.eq(column, filterObj.eq);
          }

          if ("gte" in filterObj) {
            builder = builder.gte(column, filterObj.gte);
          }

          if ("gt" in filterObj) {
            builder = builder.gt(column, filterObj.gt);
          }

          if ("lte" in filterObj) {
            builder = builder.lte(column, filterObj.lte);
          }

          if ("lt" in filterObj) {
            builder = builder.lt(column, filterObj.lt);
          }

          if ("like" in filterObj) {
            builder = builder.like(column, filterObj.like as string);
          }

          if ("ilike" in filterObj) {
            builder = builder.ilike(column, filterObj.ilike as string);
          }
        } else {
          builder = builder.eq(column, value);
        }
      }
    }

    // Apply ordering
    if (orderBy) {
      builder = builder.order(orderBy, { ascending });
    }

    // Apply limit
    builder = builder.limit(limit);

    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: `Failed to query ${table}`,
        }),
      try: () => builder,
    });

    if (result.error) {
      return yield* Effect.fail(
        new DbcQueryError({
          message: `Query error on ${table}: ${result.error.message}`,
        }),
      );
    }

    return result.data ?? [];
  });

// ============================================================================
// Search Functions for MCP Tools
// ============================================================================

export const searchSpells = (
  supabase: SupabaseClient,
  searchQuery: string,
  limit: number = 10,
): Effect.Effect<
  Array<{ id: number; name: string; description: string }>,
  DbcQueryError
> =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: "Failed to search spells",
        }),
      try: () =>
        supabase
          .schema("raw_dbc")
          .from("spell_name")
          .select("ID, Name_lang")
          .ilike("Name_lang", `%${searchQuery}%`)
          .limit(limit),
    });

    if (result.error) {
      return yield* Effect.fail(
        new DbcQueryError({
          message: `Search error: ${result.error.message}`,
        }),
      );
    }

    const spellIds = (result.data ?? []).map((row: { ID: number }) => row.ID);

    if (spellIds.length === 0) {
      return [];
    }

    // Get descriptions
    const descResult = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: "Failed to get spell descriptions",
        }),
      try: () =>
        supabase
          .schema("raw_dbc")
          .from("spell")
          .select("ID, Description_lang")
          .in("ID", spellIds),
    });

    const descMap = new Map<number, string>();
    if (descResult.data) {
      for (const row of descResult.data as Array<{
        ID: number;
        Description_lang: string;
      }>) {
        descMap.set(row.ID, row.Description_lang || "");
      }
    }

    return (result.data ?? []).map(
      (row: { ID: number; Name_lang: string }) => ({
        description: descMap.get(row.ID) || "",
        id: row.ID,
        name: row.Name_lang || "",
      }),
    );
  });

export const searchItems = (
  supabase: SupabaseClient,
  searchQuery: string,
  limit: number = 10,
): Effect.Effect<
  Array<{ id: number; name: string; description: string }>,
  DbcQueryError
> =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: "Failed to search items",
        }),
      try: () =>
        supabase
          .schema("raw_dbc")
          .from("item_sparse")
          .select("ID, Display_lang, Description_lang")
          .ilike("Display_lang", `%${searchQuery}%`)
          .limit(limit),
    });

    if (result.error) {
      return yield* Effect.fail(
        new DbcQueryError({
          message: `Search error: ${result.error.message}`,
        }),
      );
    }

    return (result.data ?? []).map(
      (row: {
        ID: number;
        Display_lang: string;
        Description_lang: string;
      }) => ({
        description: row.Description_lang || "",
        id: row.ID,
        name: row.Display_lang || "",
      }),
    );
  });

// ============================================================================
// Schema Query
// ============================================================================

export const getTableSchema = (
  supabase: SupabaseClient,
  table: string,
): Effect.Effect<
  {
    table: string;
    columns: Array<{ name: string; type: string; nullable: boolean }>;
  },
  DbcQueryError
> =>
  Effect.gen(function* () {
    // Get a sample row to infer columns
    const sampleResult = yield* Effect.tryPromise({
      catch: (cause) =>
        new DbcQueryError({
          cause,
          message: `Failed to get sample for ${table}`,
        }),
      try: () => supabase.schema("raw_dbc").from(table).select("*").limit(1),
    });

    if (sampleResult.error || !sampleResult.data?.[0]) {
      return { columns: [], table };
    }

    const firstRow = sampleResult.data[0];
    const columns = Object.keys(firstRow).map((name) => ({
      name,
      nullable: true,
      type: typeof firstRow[name],
    }));

    return { columns, table };
  });

// ============================================================================
// SupabaseDbcService Layer
// ============================================================================

export const SupabaseDbcServiceLive = (
  supabase: SupabaseClient,
): Layer.Layer<DbcService> =>
  Layer.effect(
    DbcService,
    Effect.gen(function* () {
      // Create caches for lookup tables
      const difficultyCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.DifficultyRow>(supabase, "difficulty", id),
        timeToLive: CACHE_TTL,
      });

      const spellCastTimesCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellCastTimesRow>(
            supabase,
            "spell_cast_times",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellDurationCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellDurationRow>(
            supabase,
            "spell_duration",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellRangeCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellRangeRow>(supabase, "spell_range", id),
        timeToLive: CACHE_TTL,
      });

      const spellRadiusCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellRadiusRow>(supabase, "spell_radius", id),
        timeToLive: CACHE_TTL,
      });

      const spellCategoryCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellCategoryRow>(
            supabase,
            "spell_category",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const expectedStatModCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.ExpectedStatModRow>(
            supabase,
            "expected_stat_mod",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellProcsPerMinuteCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellProcsPerMinuteRow>(
            supabase,
            "spell_procs_per_minute",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const itemEffectCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.ItemEffectRow>(supabase, "item_effect", id),
        timeToLive: CACHE_TTL,
      });

      const manifestInterfaceDataCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.ManifestInterfaceDataRow>(
            supabase,
            "manifest_interface_data",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      // Spell-keyed caches
      const spellEffectsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellEffectRow>(
            supabase,
            "spell_effect",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellMiscCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellMiscRow>(
            supabase,
            "spell_misc",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellCooldownsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellCooldownsRow>(
            supabase,
            "spell_cooldowns",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellCategoriesCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellCategoriesRow>(
            supabase,
            "spell_categories",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellClassOptionsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellClassOptionsRow>(
            supabase,
            "spell_class_options",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellPowerCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellPowerRow>(
            supabase,
            "spell_power",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellNameCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryById<Schemas.Dbc.SpellNameRow>(supabase, "spell_name", spellId),
        timeToLive: CACHE_TTL,
      });

      const spellCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryById<Schemas.Dbc.SpellRow>(supabase, "spell", spellId),
        timeToLive: CACHE_TTL,
      });

      const spellAuraOptionsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellAuraOptionsRow>(
            supabase,
            "spell_aura_options",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellCastingRequirementsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellCastingRequirementsRow>(
            supabase,
            "spell_casting_requirements",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellInterruptsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellInterruptsRow>(
            supabase,
            "spell_interrupts",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellEmpowerCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellEmpowerRow>(
            supabase,
            "spell_empower",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellEmpowerStagesCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellEmpowerId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellEmpowerStageRow>(
            supabase,
            "spell_empower_stage",
            "SpellEmpowerID",
            spellEmpowerId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellTargetRestrictionsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellTargetRestrictionsRow>(
            supabase,
            "spell_target_restrictions",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellProcsPerMinuteModsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellProcsPerMinuteId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellProcsPerMinuteModRow>(
            supabase,
            "spell_procs_per_minute_mod",
            "SpellProcsPerMinuteID",
            spellProcsPerMinuteId,
          ),
        timeToLive: CACHE_TTL,
      });

      // Item caches
      const itemCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (itemId: number) =>
          queryById<Schemas.Dbc.ItemRow>(supabase, "item", itemId),
        timeToLive: CACHE_TTL,
      });

      const itemSparseCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (itemId: number) =>
          queryById<Schemas.Dbc.ItemSparseRow>(supabase, "item_sparse", itemId),
        timeToLive: CACHE_TTL,
      });

      const itemXItemEffectsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (itemId: number) =>
          queryByForeignKey<Schemas.Dbc.ItemXItemEffectRow>(
            supabase,
            "item_x_item_effect",
            "ItemID",
            itemId,
          ),
        timeToLive: CACHE_TTL,
      });

      const service: DbcServiceInterface = {
        getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
          query<Schemas.Dbc.ContentTuningXExpectedRow[]>(
            supabase,
            "content_tuning_x_expected",
            (builder) =>
              builder
                .select("*")
                .eq("ContentTuningID", contentTuningId)
                .or(
                  `MinMythicPlusSeasonID.eq.0,MinMythicPlusSeasonID.lte.${mythicPlusSeasonId}`,
                )
                .or(
                  `MaxMythicPlusSeasonID.eq.0,MaxMythicPlusSeasonID.gt.${mythicPlusSeasonId}`,
                ),
          ),

        getDifficulty: (id) => difficultyCache.get(id),

        getDifficultyChain: (id) =>
          Effect.gen(function* () {
            const chain: Schemas.Dbc.DifficultyRow[] = [];
            let currentId = id;

            while (currentId !== 0) {
              const row = yield* difficultyCache.get(currentId);
              if (!row) {
                break;
              }
              chain.push(row);
              currentId = row.FallbackDifficultyID ?? 0;
            }

            return chain;
          }),

        getExpectedStatMod: (id) => expectedStatModCache.get(id),

        getExpectedStats: (level, expansion) =>
          query<Schemas.Dbc.ExpectedStatRow[]>(
            supabase,
            "expected_stat",
            (builder) =>
              builder
                .select("*")
                .eq("Lvl", level)
                .or(`ExpansionID.eq.${expansion},ExpansionID.eq.-2`),
          ),

        getItem: (itemId) => itemCache.get(itemId),
        getItemEffect: (id) => itemEffectCache.get(id),
        getItemSparse: (itemId) => itemSparseCache.get(itemId),
        getItemXItemEffects: (itemId) => itemXItemEffectsCache.get(itemId),
        getManifestInterfaceData: (id) => manifestInterfaceDataCache.get(id),
        getSpell: (spellId) => spellCache.get(spellId),
        getSpellAuraOptions: (spellId) => spellAuraOptionsCache.get(spellId),
        getSpellCastingRequirements: (spellId) =>
          spellCastingRequirementsCache.get(spellId),
        getSpellCastTimes: (id) => spellCastTimesCache.get(id),
        getSpellCategories: (spellId) => spellCategoriesCache.get(spellId),
        getSpellCategory: (id) => spellCategoryCache.get(id),
        getSpellClassOptions: (spellId) => spellClassOptionsCache.get(spellId),
        getSpellCooldowns: (spellId) => spellCooldownsCache.get(spellId),
        getSpellDuration: (id) => spellDurationCache.get(id),
        getSpellEffects: (spellId) => spellEffectsCache.get(spellId),
        getSpellEmpower: (spellId) => spellEmpowerCache.get(spellId),
        getSpellEmpowerStages: (spellEmpowerId) =>
          spellEmpowerStagesCache.get(spellEmpowerId),
        getSpellInterrupts: (spellId) => spellInterruptsCache.get(spellId),
        getSpellMisc: (spellId) => spellMiscCache.get(spellId),
        getSpellName: (spellId) => spellNameCache.get(spellId),
        getSpellPower: (spellId) => spellPowerCache.get(spellId),
        getSpellProcsPerMinute: (id) => spellProcsPerMinuteCache.get(id),
        getSpellProcsPerMinuteMods: (spellProcsPerMinuteId) =>
          spellProcsPerMinuteModsCache.get(spellProcsPerMinuteId),
        getSpellRadius: (id) => spellRadiusCache.get(id),
        getSpellRange: (id) => spellRangeCache.get(id),
        getSpellTargetRestrictions: (spellId) =>
          spellTargetRestrictionsCache.get(spellId),
      };

      return service;
    }),
  );

// ============================================================================
// Supabase Client Layer (from environment)
// ============================================================================

export class SupabaseClientService extends Effect.Service<SupabaseClientService>()(
  "@wowlab/mcp-server/SupabaseClient",
  {
    effect: Effect.gen(function* () {
      // Use bundled defaults, allow env override
      const url = yield* Config.string("SUPABASE_URL").pipe(
        Config.withDefault(DEFAULT_SUPABASE_URL),
      );
      const key = yield* Config.string("SUPABASE_ANON_KEY").pipe(
        Config.withDefault(DEFAULT_SUPABASE_ANON_KEY),
      );

      const client = createClient(url, key);

      return { client };
    }),
  },
) {}

// ============================================================================
// Combined Service Layer
// ============================================================================

export const SupabaseDbcServiceLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { client } = yield* SupabaseClientService;
    return SupabaseDbcServiceLive(client);
  }),
);

// Export the client for use in handlers
export { type SupabaseClient };
