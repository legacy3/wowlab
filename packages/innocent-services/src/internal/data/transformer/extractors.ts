import * as Dbc from "@packages/innocent-schemas/Dbc";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { SpellInfoCache } from "../types";

import { POWER_TYPE, SPELL_EFFECT_TYPE } from "./constants";

export const first = <T>(arr?: T[]): Option.Option<T> =>
  arr?.[0] ? Option.some(arr[0]) : Option.none();

export const extractRange = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: SpellInfoCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) => first(cache.spellRange.get(m.RangeIndex))),
    Option.map((r) => ({
      ally: { max: r.MaxRange[1], min: r.MinRange[1] },
      enemy: { max: r.MaxRange[0], min: r.MinRange[0] },
    })),
  );

export const extractRadius = (
  effects: Dbc.SpellEffectRow[],
  cache: SpellInfoCache,
) =>
  effects.flatMap((e) =>
    e.EffectRadiusIndex.filter((i) => i !== 0)
      .map((i) => first(cache.spellRadius.get(i)))
      .filter(Option.isSome)
      .map((r) => ({
        max: r.value.MaxRadius,
        min: r.value.RadiusMin,
        radius: r.value.Radius,
      })),
  );

export const extractCooldown = (spellId: number, cache: SpellInfoCache) =>
  pipe(
    first(cache.spellCooldowns.get(spellId)),
    Option.map((c) => ({
      category: c.CategoryRecoveryTime,
      gcd: c.StartRecoveryTime,
      recovery: c.RecoveryTime,
    })),
  );

export const extractInterrupts = (spellId: number, cache: SpellInfoCache) =>
  pipe(
    first(cache.spellInterrupts.get(spellId)),
    Option.map((i) => ({
      aura: [i.AuraInterruptFlags[0], i.AuraInterruptFlags[1]] as const,
      channel: [
        i.ChannelInterruptFlags[0],
        i.ChannelInterruptFlags[1],
      ] as const,
      flags: i.InterruptFlags,
    })),
  );

export const extractEmpower = (spellId: number, cache: SpellInfoCache) =>
  pipe(
    first(cache.spellEmpower.get(spellId)),
    Option.map((e) => ({
      canEmpower: true,
      stages: (cache.spellEmpowerStage.get(e.ID) ?? []).map((s) => ({
        duration: s.DurationMs,
        stage: s.Stage,
      })),
    })),
    Option.orElse(() => Option.some({ canEmpower: false, stages: [] })),
  );

export const extractCastTime = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: SpellInfoCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) =>
      m.CastingTimeIndex !== 0
        ? first(cache.spellCastTimes.get(m.CastingTimeIndex))
        : Option.none(),
    ),
    Option.map((c) => ({ base: c.Base, min: c.Minimum })),
  );

export const extractDuration = (
  misc: Option.Option<Dbc.SpellMiscRow>,
  cache: SpellInfoCache,
) =>
  pipe(
    misc,
    Option.flatMap((m) =>
      m.DurationIndex !== 0
        ? first(cache.spellDuration.get(m.DurationIndex))
        : Option.none(),
    ),
    Option.map((d) => ({ duration: d.Duration, max: d.MaxDuration })),
  );

export const extractCharges = (spellId: number, cache: SpellInfoCache) =>
  pipe(
    first(cache.spellCategories.get(spellId)),
    Option.flatMap((c) =>
      c.ChargeCategory !== 0
        ? first(cache.spellCategory.get(c.ChargeCategory))
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
    }))[0];

export const extractManaCost = (effects: Dbc.SpellEffectRow[]): number =>
  Math.abs(
    effects.find(
      (e) =>
        e.Effect === SPELL_EFFECT_TYPE.POWER_DRAIN &&
        e.EffectMiscValue[0] === POWER_TYPE.MANA,
    )?.EffectBasePoints ?? 0,
  );

export const extractName = (spellId: number, cache: SpellInfoCache): string =>
  pipe(
    Option.fromNullable(cache.spellName.get(spellId)),
    Option.map((n) => n.Name),
    Option.getOrElse(() => `Spell ${spellId}`),
  );
