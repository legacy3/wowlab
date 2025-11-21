import { Dbc } from "@wowlab/core/Schemas";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { DbcCache } from "../DbcCache.js";

import { POWER_TYPE, SPELL_EFFECT_TYPE } from "./constants.js";

export const first = <T>(arr?: T[]): Option.Option<T> =>
  arr?.[0] ? Option.some(arr[0]) : Option.none();

export const extractRange = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: DbcCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) => Option.fromNullable(cache.spellRange.get(m.RangeIndex))),
    Option.map((r) => ({
      ally: { max: r.RangeMax_1, min: r.RangeMin_1 },
      enemy: { max: r.RangeMax_0, min: r.RangeMin_0 },
    })),
  );

export const extractRadius = (
  effects: Dbc.SpellEffectRow[],
  cache: DbcCache,
) =>
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
export const extractInterrupts = (spellId: number, cache: DbcCache) =>
  Option.none();

// TODO: Add SpellEmpower table to DbcCache
export const extractEmpower = (spellId: number, cache: DbcCache) =>
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
        e.Effect === SPELL_EFFECT_TYPE.SCHOOL_DAMAGE ||
        e.Effect === SPELL_EFFECT_TYPE.HEAL,
    )
    .map((e) => ({
      attackPower: e.BonusCoefficientFromAP,
      spellPower: e.EffectBonusCoefficient,
    }))[0] || { attackPower: 0, spellPower: 0 };

export const extractManaCost = (effects: Dbc.SpellEffectRow[]): number =>
  Math.abs(
    effects.find(
      (e) =>
        e.Effect === SPELL_EFFECT_TYPE.POWER_DRAIN &&
        e.EffectMiscValue_0 === POWER_TYPE.MANA,
    )?.EffectBasePointsF ?? 0,
  );

export const extractName = (spellId: number, cache: DbcCache): string =>
  pipe(
    Option.fromNullable(cache.spellName.get(spellId)),
    Option.map((n) => n.Name_lang || ""),
    Option.getOrElse(() => `Spell ${spellId}`),
  );
