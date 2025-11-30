import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import type { DbcCache } from "../DbcCache.js";

import { DbcService, type DbcServiceInterface } from "./DbcService.js";

export const InMemoryDbcService = (cache: DbcCache): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
      Effect.succeed(
        cache.contentTuningXExpected.filter(
          (x) =>
            x.ContentTuningID === contentTuningId &&
            (x.MinMythicPlusSeasonID === 0 ||
              mythicPlusSeasonId >= x.MinMythicPlusSeasonID) &&
            (x.MaxMythicPlusSeasonID === 0 ||
              mythicPlusSeasonId < x.MaxMythicPlusSeasonID),
        ),
      ),

    getDifficulty: (id) => Effect.succeed(cache.difficulty.get(id)),

    getDifficultyChain: (id) =>
      Effect.sync(() => {
        const chain: Schemas.Dbc.DifficultyRow[] = [];
        let currentId = id;

        while (currentId !== 0) {
          const row = cache.difficulty.get(currentId);
          if (!row) {
            break;
          }

          chain.push(row);
          currentId = row.FallbackDifficultyID ?? 0;
        }

        return chain;
      }),

    getExpectedStatMod: (id) => Effect.succeed(cache.expectedStatMod.get(id)),

    getExpectedStats: (level, expansion) =>
      Effect.succeed(
        cache.expectedStat.filter(
          (stat) =>
            stat.Lvl === level &&
            (stat.ExpansionID === expansion || stat.ExpansionID === -2),
        ),
      ),

    getItem: (itemId) => Effect.succeed(cache.item.get(itemId)),

    getItemEffect: (id) => Effect.succeed(cache.itemEffect.get(id)),

    getItemSparse: (itemId) => Effect.succeed(cache.itemSparse.get(itemId)),

    getItemXItemEffects: (itemId) =>
      Effect.succeed(cache.itemXItemEffect.get(itemId) ?? []),

    getManifestInterfaceData: (id) =>
      Effect.succeed(cache.manifestInterfaceData.get(id)),

    getSpell: (spellId) => Effect.succeed(cache.spell.get(spellId)),

    getSpellCastTimes: (id) => Effect.succeed(cache.spellCastTimes.get(id)),

    getSpellCategories: (spellId) =>
      Effect.succeed(cache.spellCategories.get(spellId)),

    getSpellCategory: (id) => Effect.succeed(cache.spellCategory.get(id)),

    getSpellClassOptions: (spellId) =>
      Effect.succeed(cache.spellClassOptions.get(spellId)),

    getSpellCooldowns: (spellId) =>
      Effect.succeed(cache.spellCooldowns.get(spellId)),

    getSpellDuration: (id) => Effect.succeed(cache.spellDuration.get(id)),

    getSpellEffects: (spellId) =>
      Effect.succeed(cache.spellEffect.get(spellId) ?? []),

    getSpellMisc: (spellId) => Effect.succeed(cache.spellMisc.get(spellId)),

    getSpellName: (spellId) => Effect.succeed(cache.spellName.get(spellId)),

    getSpellPower: (spellId) =>
      Effect.succeed(cache.spellPower.get(spellId) ?? []),

    getSpellRadius: (id) => Effect.succeed(cache.spellRadius.get(id)),

    getSpellRange: (id) => Effect.succeed(cache.spellRange.get(id)),
  } satisfies DbcServiceInterface);
