import type { SupabaseClient } from "@supabase/supabase-js";
import type * as Schemas from "@wowlab/core/Schemas";

import { DbcQueryError } from "@wowlab/core/Errors";
import {
  DbcService,
  ExtractorService,
  transformAura,
  transformSpell,
} from "@wowlab/services/Data";
import * as Cache from "effect/Cache";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const CACHE_CAPACITY = 1000;
const CACHE_TTL = Duration.minutes(5);

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

const SupabaseDbcServiceLive = (
  supabase: SupabaseClient,
): Layer.Layer<DbcService> =>
  Layer.unwrapEffect(
    Effect.gen(function* () {
      // Create caches for all DBC tables
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

      const spellAuraRestrictionsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellAuraRestrictionsRow>(
            supabase,
            "spell_aura_restrictions",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellDescriptionVariablesCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellDescriptionVariablesRow>(
            supabase,
            "spell_description_variables",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellLearnSpellCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellLearnSpellRow>(
            supabase,
            "spell_learn_spell",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellLevelsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellLevelsRow>(
            supabase,
            "spell_levels",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellReplacementCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellReplacementRow>(
            supabase,
            "spell_replacement",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellShapeshiftCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryOneByForeignKey<Schemas.Dbc.SpellShapeshiftRow>(
            supabase,
            "spell_shapeshift",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellShapeshiftFormCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.SpellShapeshiftFormRow>(
            supabase,
            "spell_shapeshift_form",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellTotemsCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellTotemsRow>(
            supabase,
            "spell_totems",
            "SpellID",
            spellId,
          ),
        timeToLive: CACHE_TTL,
      });

      const spellXDescriptionVariablesCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (spellId: number) =>
          queryByForeignKey<Schemas.Dbc.SpellXDescriptionVariablesRow>(
            supabase,
            "spell_x_description_variables",
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

      const itemAppearanceCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (id: number) =>
          queryById<Schemas.Dbc.ItemAppearanceRow>(
            supabase,
            "item_appearance",
            id,
          ),
        timeToLive: CACHE_TTL,
      });

      const itemModifiedAppearanceCache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (itemId: number) =>
          queryOneByForeignKey<Schemas.Dbc.ItemModifiedAppearanceRow>(
            supabase,
            "item_modified_appearance",
            "ItemID",
            itemId,
          ),
        timeToLive: CACHE_TTL,
      });

      return Layer.succeed(DbcService, {
        // TODO Add proper lookup functions and caches for all chr tables
        getChrClass: (id) =>
          query<Schemas.Dbc.ChrClassesRow | undefined>(
            supabase,
            "chr_classes",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),

        getChrClasses: () =>
          query<Schemas.Dbc.ChrClassesRow[]>(
            supabase,
            "chr_classes",
            (builder) => builder.select("*").order("ID"),
          ),

        getChrSpecialization: (id) =>
          query<Schemas.Dbc.ChrSpecializationRow | undefined>(
            supabase,
            "chr_specialization",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),

        getChrSpecializations: () =>
          query<Schemas.Dbc.ChrSpecializationRow[]>(
            supabase,
            "chr_specialization",
            (builder) =>
              builder.select("*").order("ClassID").order("OrderIndex"),
          ),

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
        getItemAppearance: (id) => itemAppearanceCache.get(id),
        getItemEffect: (id) => itemEffectCache.get(id),
        getItemModifiedAppearance: (itemId) =>
          itemModifiedAppearanceCache.get(itemId),
        getItemSparse: (itemId) => itemSparseCache.get(itemId),
        getItemXItemEffects: (itemId) => itemXItemEffectsCache.get(itemId),
        getManifestInterfaceData: (id) => manifestInterfaceDataCache.get(id),
        getSpecializationSpells: (specId) =>
          query<Schemas.Dbc.SpecializationSpellsRow[]>(
            supabase,
            "specialization_spells",
            (builder) => builder.select("*").eq("SpecID", specId),
          ),

        getSpecSetMembers: (specSetIds) =>
          query<Schemas.Dbc.SpecSetMemberRow[]>(
            supabase,
            "spec_set_member",
            (builder) => builder.select("*").in("SpecSet", [...specSetIds]),
          ),
        getSpell: (spellId) => spellCache.get(spellId),
        getSpellAuraOptions: (spellId) => spellAuraOptionsCache.get(spellId),
        getSpellAuraRestrictions: (spellId) =>
          spellAuraRestrictionsCache.get(spellId),
        getSpellCastingRequirements: (spellId) =>
          spellCastingRequirementsCache.get(spellId),
        getSpellCastTimes: (id) => spellCastTimesCache.get(id),
        getSpellCategories: (spellId) => spellCategoriesCache.get(spellId),
        getSpellCategory: (id) => spellCategoryCache.get(id),
        getSpellClassOptions: (spellId) => spellClassOptionsCache.get(spellId),
        getSpellCooldowns: (spellId) => spellCooldownsCache.get(spellId),
        getSpellDescriptionVariables: (id) =>
          spellDescriptionVariablesCache.get(id),
        getSpellDuration: (id) => spellDurationCache.get(id),
        getSpellEffects: (spellId) => spellEffectsCache.get(spellId),
        getSpellEmpower: (spellId) => spellEmpowerCache.get(spellId),
        getSpellEmpowerStages: (spellEmpowerId) =>
          spellEmpowerStagesCache.get(spellEmpowerId),
        getSpellInterrupts: (spellId) => spellInterruptsCache.get(spellId),
        getSpellLearnSpell: (spellId) => spellLearnSpellCache.get(spellId),
        getSpellLevels: (spellId) => spellLevelsCache.get(spellId),
        getSpellMisc: (spellId) => spellMiscCache.get(spellId),
        getSpellName: (spellId) => spellNameCache.get(spellId),
        getSpellPower: (spellId) => spellPowerCache.get(spellId),
        getSpellProcsPerMinute: (id) => spellProcsPerMinuteCache.get(id),
        getSpellProcsPerMinuteMods: (spellProcsPerMinuteId) =>
          spellProcsPerMinuteModsCache.get(spellProcsPerMinuteId),
        getSpellRadius: (id) => spellRadiusCache.get(id),
        getSpellRange: (id) => spellRangeCache.get(id),
        getSpellReplacement: (spellId) => spellReplacementCache.get(spellId),
        getSpellShapeshift: (spellId) => spellShapeshiftCache.get(spellId),
        getSpellShapeshiftForm: (id) => spellShapeshiftFormCache.get(id),
        getSpellTargetRestrictions: (spellId) =>
          spellTargetRestrictionsCache.get(spellId),
        getSpellTotems: (spellId) => spellTotemsCache.get(spellId),

        getSpellXDescriptionVariables: (spellId) =>
          spellXDescriptionVariablesCache.get(spellId),
        getTraitConds: (condIds) =>
          query<Schemas.Dbc.TraitCondRow[]>(supabase, "trait_cond", (builder) =>
            builder.select("*").in("ID", [...condIds]),
          ),
        getTraitDefinition: (id) =>
          query<Schemas.Dbc.TraitDefinitionRow | undefined>(
            supabase,
            "trait_definition",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),
        getTraitEdgesForTree: (treeId) =>
          query<Schemas.Dbc.TraitEdgeRow[]>(supabase, "trait_edge", (builder) =>
            builder
              .select("*, trait_node!inner(TraitTreeID)")
              .eq("trait_node.TraitTreeID", treeId),
          ),
        getTraitNode: (id) =>
          query<Schemas.Dbc.TraitNodeRow | undefined>(
            supabase,
            "trait_node",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),
        getTraitNodeEntry: (id) =>
          query<Schemas.Dbc.TraitNodeEntryRow | undefined>(
            supabase,
            "trait_node_entry",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),
        getTraitNodeGroupXTraitConds: (groupIds) =>
          query<Schemas.Dbc.TraitNodeGroupXTraitCondRow[]>(
            supabase,
            "trait_node_group_x_trait_cond",
            (builder) =>
              builder.select("*").in("TraitNodeGroupID", [...groupIds]),
          ),
        getTraitNodeGroupXTraitNodes: (nodeIds) =>
          query<Schemas.Dbc.TraitNodeGroupXTraitNodeRow[]>(
            supabase,
            "trait_node_group_x_trait_node",
            (builder) => builder.select("*").in("TraitNodeID", [...nodeIds]),
          ),
        getTraitNodeXTraitConds: (nodeIds) =>
          query<Schemas.Dbc.TraitNodeXTraitCondRow[]>(
            supabase,
            "trait_node_x_trait_cond",
            (builder) => builder.select("*").in("TraitNodeID", [...nodeIds]),
          ),
        getTraitNodesForTree: (treeId) =>
          query<Schemas.Dbc.TraitNodeRow[]>(supabase, "trait_node", (builder) =>
            builder.select("*").eq("TraitTreeID", treeId),
          ),
        getTraitNodeXTraitNodeEntries: (nodeId) =>
          query<Schemas.Dbc.TraitNodeXTraitNodeEntryRow[]>(
            supabase,
            "trait_node_x_trait_node_entry",
            (builder) => builder.select("*").eq("TraitNodeID", nodeId),
          ),
        getTraitSubTree: (id) =>
          query<Schemas.Dbc.TraitSubTreeRow | undefined>(
            supabase,
            "trait_sub_tree",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),
        getTraitTree: (id) =>
          query<Schemas.Dbc.TraitTreeRow | undefined>(
            supabase,
            "trait_tree",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),
        getTraitTreeLoadout: (specId) =>
          query<Schemas.Dbc.TraitTreeLoadoutRow | undefined>(
            supabase,
            "trait_tree_loadout",
            (builder) =>
              builder
                .select("*")
                .eq("ChrSpecializationID", specId)
                .maybeSingle(),
          ),
        getTraitTreeLoadoutEntries: (loadoutId) =>
          query<Schemas.Dbc.TraitTreeLoadoutEntryRow[]>(
            supabase,
            "trait_tree_loadout_entry",
            (builder) =>
              builder
                .select("*")
                .eq("TraitTreeLoadoutID", loadoutId)
                .order("OrderIndex"),
          ),
        getUiTextureAtlasElement: (id) =>
          query<Schemas.Dbc.UiTextureAtlasElementRow | undefined>(
            supabase,
            "ui_texture_atlas_element",
            (builder) => builder.select("*").eq("ID", id).maybeSingle(),
          ),
      });
    }),
  );

export const loadSpells = (
  supabase: SupabaseClient,
  spellIds: readonly number[],
): Effect.Effect<Schemas.Spell.SpellDataFlat[]> => {
  if (spellIds.length === 0) {
    return Effect.succeed([]);
  }

  const DbcLayer = SupabaseDbcServiceLive(supabase);
  const ExtractorLayer = ExtractorService.Default.pipe(Layer.provide(DbcLayer));
  const FullLayer = Layer.merge(DbcLayer, ExtractorLayer);

  return Effect.forEach(
    spellIds,
    (spellId) =>
      transformSpell(spellId).pipe(
        Effect.catchAll((error) => {
          console.error(`Failed to transform spell ${spellId}:`, error);
          return Effect.fail(error);
        }),
      ),
    { concurrency: 10 },
  ).pipe(Effect.provide(FullLayer), Effect.orDie);
};

export const loadAuras = (
  supabase: SupabaseClient,
  spellIds: readonly number[],
): Effect.Effect<Schemas.Aura.AuraDataFlat[]> => {
  if (spellIds.length === 0) {
    return Effect.succeed([]);
  }

  const DbcLayer = SupabaseDbcServiceLive(supabase);
  const ExtractorLayer = ExtractorService.Default.pipe(Layer.provide(DbcLayer));
  const FullLayer = Layer.merge(DbcLayer, ExtractorLayer);

  return Effect.forEach(
    spellIds,
    (spellId) =>
      transformAura(spellId).pipe(Effect.catchAll(() => Effect.succeed(null))),
    { concurrency: 10 },
  ).pipe(
    Effect.map((results) =>
      results.filter((r): r is Schemas.Aura.AuraDataFlat => r !== null),
    ),
    Effect.provide(FullLayer),
    Effect.orDie,
  );
};
