import { Dbc, Enums } from "@wowlab/core/Schemas";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { DbcCache } from "../DbcCache.js";

export const first = <T>(arr?: T[]): Option.Option<T> =>
  arr?.[0] ? Option.some(arr[0]) : Option.none();

export const extractRange = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: DbcCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) =>
      Option.fromNullable(cache.spellRange.get(m.RangeIndex)),
    ),
    Option.map((r) => ({
      ally: { max: r.RangeMax_1, min: r.RangeMin_1 },
      enemy: { max: r.RangeMax_0, min: r.RangeMin_0 },
    })),
  );

export const extractRadius = (effects: Dbc.SpellEffectRow[], cache: DbcCache) =>
  effects.flatMap((e) =>
    [e.EffectRadiusIndex_0, e.EffectRadiusIndex_1]
      .filter((i) => i !== 0)
      .map((i) => Option.fromNullable(cache.spellRadius.get(i)))
      .filter(Option.isSome)
      .map((r) => ({
        max: r.value.RadiusMax,
        min: r.value.RadiusMin,
        radius: r.value.Radius,
      })),
  );

export const extractCooldown = (spellId: number, cache: DbcCache) =>
  pipe(
    Option.fromNullable(cache.spellCooldowns.get(spellId)),
    Option.map((c) => ({
      category: c.CategoryRecoveryTime,
      gcd: c.StartRecoveryTime,
      recovery: c.RecoveryTime,
    })),
  );

// TODO: Add SpellInterrupts table to DbcCache
export const extractInterrupts = (_spellId: number, _cache: DbcCache) =>
  Option.none();

// TODO: Add SpellEmpower table to DbcCache
export const extractEmpower = (_spellId: number, _cache: DbcCache) =>
  Option.some({ canEmpower: false, stages: [] });

export const extractCastTime = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: DbcCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) =>
      m.CastingTimeIndex !== 0
        ? Option.fromNullable(cache.spellCastTimes.get(m.CastingTimeIndex))
        : Option.none(),
    ),
    Option.map((c) => ({ base: c.Base, min: c.Minimum })),
  );

export const extractDuration = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: DbcCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) =>
      m.DurationIndex !== 0
        ? Option.fromNullable(cache.spellDuration.get(m.DurationIndex))
        : Option.none(),
    ),
    Option.map((d) => ({ duration: d.Duration, max: d.MaxDuration })),
  );

export const extractCharges = (spellId: number, cache: DbcCache) =>
  pipe(
    Option.fromNullable(cache.spellCategories.get(spellId)),
    Option.flatMap((c) =>
      c.ChargeCategory !== 0
        ? Option.fromNullable(cache.spellCategory.get(c.ChargeCategory))
        : Option.none(),
    ),
    Option.map((c) => ({
      maxCharges: c.MaxCharges,
      rechargeTime: c.ChargeRecoveryTime,
    })),
  );

export const extractScaling = (effects: Dbc.SpellEffectRow[]) =>
  effects
    .filter(
      (e) =>
        e.Effect === Enums.SpellEffect.SchoolDamage ||
        e.Effect === Enums.SpellEffect.Heal,
    )
    .map((e) => ({
      attackPower: e.BonusCoefficientFromAP,
      spellPower: e.EffectBonusCoefficient,
    }))[0] || { attackPower: 0, spellPower: 0 };

export const extractManaCost = (effects: Dbc.SpellEffectRow[]): number =>
  Math.abs(
    effects.find(
      (e) =>
        e.Effect === Enums.SpellEffect.PowerDrain &&
        e.EffectMiscValue_0 === Enums.PowerType.Mana,
    )?.EffectBasePointsF ?? 0,
  );

export const extractName = (spellId: number, cache: DbcCache): string =>
  pipe(
    Option.fromNullable(cache.spellName.get(spellId)),
    Option.map((n) => n.Name_lang || ""),
    Option.getOrElse(() => `Spell ${spellId}`),
  );

export const extractDescription = (
  spellId: number,
  cache: DbcCache,
): { description: string; auraDescription: string } =>
  pipe(
    Option.fromNullable(cache.spell.get(spellId)),
    Option.map((n) => ({
      auraDescription: n.AuraDescription_lang || "",
      description: n.Description_lang || "",
    })),
    Option.getOrElse(() => ({ auraDescription: "", description: "" })),
  );

export const extractPower = (spellId: number, cache: DbcCache) =>
  pipe(
    Option.fromNullable(cache.spellPower.get(spellId)),
    Option.flatMap(first),
    Option.map((p) => ({
      powerCost: p.ManaCost,
      powerCostPct: p.PowerCostPct,
      powerType: p.PowerType,
    })),
  );

export const extractClassOptions = (spellId: number, cache: DbcCache) =>
  pipe(
    Option.fromNullable(cache.spellClassOptions.get(spellId)),
    Option.map((o) => ({
      spellClassMask1: o.SpellClassMask_0,
      spellClassMask2: o.SpellClassMask_1,
      spellClassMask3: o.SpellClassMask_2,
      spellClassMask4: o.SpellClassMask_3,
      spellClassSet: o.SpellClassSet,
    })),
  );

/**
 * Get spell effects for a specific difficulty, walking the fallback chain if needed.
 *
 * The difficulty fallback chain works like this:
 * - M+ (8) → Mythic Dungeon (23) → Heroic Dungeon (2) → Normal Dungeon (1) → None (0)
 * - Mythic Raid (16) → Heroic Raid (15) → Normal Raid (14) → None (0)
 * - LFR (17) → Normal Raid (14) → None (0)
 *
 * If no effects exist for the requested difficulty, we walk down the fallback chain
 * until we find effects or reach DifficultyID 0 (None/default).
 */
export const getEffectsForDifficulty = (
  effects: Dbc.SpellEffectRow[],
  effectType: number,
  difficultyId: number,
  cache: DbcCache,
): Dbc.SpellEffectRow[] => {
  // Filter effects by effect type AND difficulty
  const filtered = effects.filter(
    (e) => e.Effect === effectType && e.DifficultyID === difficultyId,
  );

  // If we found effects or we're at base difficulty (0), return what we have
  if (filtered.length > 0 || difficultyId === 0) {
    return filtered;
  }

  // Walk the fallback chain
  const difficultyRow = cache.difficulty.get(difficultyId);
  if (!difficultyRow) {
    // Unknown difficulty, fall back to base
    return effects.filter(
      (e) => e.Effect === effectType && e.DifficultyID === 0,
    );
  }

  const nextDifficultyId = difficultyRow.FallbackDifficultyID;

  // Prevent infinite loops (fallback points to self or is same as current)
  if (nextDifficultyId === difficultyId) {
    return filtered;
  }

  // Recurse down the fallback chain
  return getEffectsForDifficulty(effects, effectType, nextDifficultyId, cache);
};

/**
 * Check if a spell has AOE damage effects for a specific difficulty.
 * Walks the difficulty fallback chain to find applicable effects.
 */
export const hasAoeDamageEffect = (
  effects: Dbc.SpellEffectRow[],
  difficultyId: number,
  cache: DbcCache,
): boolean => {
  const damageEffects = getEffectsForDifficulty(
    effects,
    Enums.SpellEffect.SchoolDamage,
    difficultyId,
    cache,
  );
  const envDamageEffects = getEffectsForDifficulty(
    effects,
    Enums.SpellEffect.EnvironmentalDamage,
    difficultyId,
    cache,
  );

  return [...damageEffects, ...envDamageEffects].some(
    (e) => e.EffectRadiusIndex_0 > 0 || e.EffectRadiusIndex_1 > 0,
  );
};

/**
 * Get the variance for damage effects at a specific difficulty.
 */
export const getVarianceForDifficulty = (
  effects: Dbc.SpellEffectRow[],
  difficultyId: number,
  cache: DbcCache,
): number => {
  const damageEffects = getEffectsForDifficulty(
    effects,
    Enums.SpellEffect.SchoolDamage,
    difficultyId,
    cache,
  );

  return damageEffects[0]?.Variance ?? 0;
};

/**
 * Configuration for damage calculation.
 */
export interface DamageConfig {
  /** Content tuning ID for the spell's context (e.g., dungeon, raid) */
  contentTuningId: number;
  /** Current expansion ID (e.g., 10 for TWW) */
  expansion: number;
  /** Character level */
  level: number;
  /** Current M+ season ID */
  mythicPlusSeasonId: number;
}

/**
 * Default damage config for TWW Season 2.
 */
export const DEFAULT_DAMAGE_CONFIG: DamageConfig = {
  contentTuningId: 1279, // Backup/default content tuning
  expansion: 10, // The War Within
  level: 80,
  mythicPlusSeasonId: 103,
};

/**
 * Calculate the base damage for a spell effect using expected stat scaling.
 *
 * This replicates the damage calculation from the game client:
 * 1. Find the ExpectedStat row for the given level/expansion
 * 2. Find applicable ContentTuningXExpected entries for the content tuning + M+ season
 * 3. Apply all ExpectedStatMod multipliers
 * 4. Scale the effect's base points by the final multiplier
 */
export const getDamage = (
  effect: Dbc.SpellEffectRow,
  cache: DbcCache,
  config: DamageConfig = DEFAULT_DAMAGE_CONFIG,
): number => {
  const { contentTuningId, expansion, level, mythicPlusSeasonId } = config;
  const invalidExpansion = -2;

  // Find the expected stat for this level/expansion
  const matchingExpectedStats = cache.expectedStat
    .filter(
      (stat) =>
        stat.Lvl === level &&
        (stat.ExpansionID === expansion ||
          stat.ExpansionID === invalidExpansion),
    )
    .sort((a, b) => b.ExpansionID - a.ExpansionID);

  if (matchingExpectedStats.length === 0) {
    return 0;
  }

  const expectedStat = matchingExpectedStats[0];

  // Find valid content tuning x expected entries for this content tuning and M+ season
  const validXExpecteds = cache.contentTuningXExpected.filter(
    (x) =>
      x.ContentTuningID === contentTuningId &&
      (x.MinMythicPlusSeasonID === 0 ||
        mythicPlusSeasonId >= x.MinMythicPlusSeasonID) &&
      (x.MaxMythicPlusSeasonID === 0 ||
        mythicPlusSeasonId < x.MaxMythicPlusSeasonID),
  );

  // Get the ExpectedStatMod entries and calculate the final multiplier
  const mods = validXExpecteds
    .map((x) => cache.expectedStatMod.get(x.ExpectedStatModID))
    .filter((mod): mod is Dbc.ExpectedStatModRow => mod !== undefined);

  let multiplier = expectedStat.CreatureSpellDamage;
  for (const mod of mods) {
    multiplier *= mod.CreatureSpellDamageMod;
  }

  // Calculate final damage value
  const value = (multiplier / 100) * effect.EffectBasePointsF;

  return Math.round(value);
};
