import { DbcError } from "@wowlab/core/Errors";
import { Dbc, Enums } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";

// ============================================================================
// Pure helper functions
// ============================================================================

const first = <T>(array?: readonly T[]): Option.Option<T> =>
  array?.[0] ? Option.some(array[0]) : Option.none();

// ============================================================================
// Configuration
// ============================================================================

export interface DamageConfig {
  readonly contentTuningId: number;
  readonly expansion: number;
  readonly level: number;
  readonly mythicPlusSeasonId: number;
}

export const DEFAULT_DAMAGE_CONFIG: DamageConfig = {
  contentTuningId: 1279,
  expansion: 10,
  level: 80,
  mythicPlusSeasonId: 103,
};

// ============================================================================
// ExtractorService
// ============================================================================

export class ExtractorService extends Effect.Service<ExtractorService>()(
  "@wowlab/services/ExtractorService",
  {
    effect: Effect.gen(function* () {
      const dbcService = yield* DbcService;

      const extractRange = (
        spellMisc: Option.Option<Dbc.SpellMiscRow>,
      ): Effect.Effect<
        Option.Option<{
          ally: { max: number; min: number };
          enemy: { max: number; min: number };
        }>,
        DbcError
      > =>
        pipe(
          spellMisc,
          Option.match({
            onNone: () => Effect.succeed(Option.none()),
            onSome: (misc) =>
              Effect.gen(function* () {
                const spellRange = yield* dbcService.getSpellRange(
                  misc.RangeIndex,
                );

                if (!spellRange) {
                  return Option.none();
                }

                return Option.some({
                  ally: {
                    max: spellRange.RangeMax_1,
                    min: spellRange.RangeMin_1,
                  },
                  enemy: {
                    max: spellRange.RangeMax_0,
                    min: spellRange.RangeMin_0,
                  },
                });
              }),
          }),
        );

      const extractRadius = (
        spellEffects: readonly Dbc.SpellEffectRow[],
      ): Effect.Effect<
        Array<{ max: number; min: number; radius: number }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const radiusResults: Array<{
            max: number;
            min: number;
            radius: number;
          }> = [];

          for (const effect of spellEffects) {
            const radiusIndices = [
              effect.EffectRadiusIndex_0,
              effect.EffectRadiusIndex_1,
            ];

            for (const radiusIndex of radiusIndices) {
              if (radiusIndex !== 0) {
                const spellRadius =
                  yield* dbcService.getSpellRadius(radiusIndex);

                if (spellRadius) {
                  radiusResults.push({
                    max: spellRadius.RadiusMax,
                    min: spellRadius.RadiusMin,
                    radius: spellRadius.Radius,
                  });
                }
              }
            }
          }

          return radiusResults;
        });

      const extractCooldown = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{ category: number; gcd: number; recovery: number }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const spellCooldowns = yield* dbcService.getSpellCooldowns(spellId);

          if (!spellCooldowns) {
            return Option.none();
          }

          return Option.some({
            category: spellCooldowns.CategoryRecoveryTime,
            gcd: spellCooldowns.StartRecoveryTime,
            recovery: spellCooldowns.RecoveryTime,
          });
        });

      const extractInterrupts = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          auraInterruptFlags: [number, number];
          channelInterruptFlags: [number, number];
          interruptFlags: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const spellInterrupts = yield* dbcService.getSpellInterrupts(spellId);

          if (!spellInterrupts) {
            return Option.none();
          }

          return Option.some({
            auraInterruptFlags: [
              spellInterrupts.AuraInterruptFlags_0,
              spellInterrupts.AuraInterruptFlags_1,
            ] as [number, number],
            channelInterruptFlags: [
              spellInterrupts.ChannelInterruptFlags_0,
              spellInterrupts.ChannelInterruptFlags_1,
            ] as [number, number],
            interruptFlags: spellInterrupts.InterruptFlags,
          });
        });

      const extractEmpower = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          canEmpower: boolean;
          stages: Array<{ durationMs: number; stage: number }>;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const spellEmpower = yield* dbcService.getSpellEmpower(spellId);

          if (!spellEmpower) {
            return Option.some({ canEmpower: false, stages: [] });
          }

          const empowerStages = yield* dbcService.getSpellEmpowerStages(
            spellEmpower.ID,
          );

          const stages = empowerStages
            .map((stage) => ({
              durationMs: stage.DurationMs,
              stage: stage.Stage,
            }))
            .sort((a, b) => a.stage - b.stage);

          return Option.some({
            canEmpower: true,
            stages,
          });
        });

      const extractCastTime = (
        spellMisc: Option.Option<Dbc.SpellMiscRow>,
      ): Effect.Effect<
        Option.Option<{ base: number; min: number }>,
        DbcError
      > =>
        pipe(
          spellMisc,
          Option.match({
            onNone: () => Effect.succeed(Option.none()),
            onSome: (misc) => {
              if (misc.CastingTimeIndex === 0) {
                return Effect.succeed(Option.none());
              }

              return Effect.gen(function* () {
                const castTimes = yield* dbcService.getSpellCastTimes(
                  misc.CastingTimeIndex,
                );

                if (!castTimes) {
                  return Option.none();
                }

                return Option.some({
                  base: castTimes.Base,
                  min: castTimes.Minimum,
                });
              });
            },
          }),
        );

      const extractDuration = (
        spellMisc: Option.Option<Dbc.SpellMiscRow>,
      ): Effect.Effect<
        Option.Option<{ duration: number; max: number }>,
        DbcError
      > =>
        pipe(
          spellMisc,
          Option.match({
            onNone: () => Effect.succeed(Option.none()),
            onSome: (misc) => {
              if (misc.DurationIndex === 0) {
                return Effect.succeed(Option.none());
              }

              return Effect.gen(function* () {
                const spellDuration = yield* dbcService.getSpellDuration(
                  misc.DurationIndex,
                );

                if (!spellDuration) {
                  return Option.none();
                }

                return Option.some({
                  duration: spellDuration.Duration,
                  max: spellDuration.MaxDuration,
                });
              });
            },
          }),
        );

      const extractCharges = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{ maxCharges: number; rechargeTime: number }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const spellCategories = yield* dbcService.getSpellCategories(spellId);

          if (!spellCategories || spellCategories.ChargeCategory === 0) {
            return Option.none();
          }

          const spellCategory = yield* dbcService.getSpellCategory(
            spellCategories.ChargeCategory,
          );

          if (!spellCategory) {
            return Option.none();
          }

          return Option.some({
            maxCharges: spellCategory.MaxCharges,
            rechargeTime: spellCategory.ChargeRecoveryTime,
          });
        });

      const extractName = (spellId: number): Effect.Effect<string, DbcError> =>
        Effect.gen(function* () {
          const spellName = yield* dbcService.getSpellName(spellId);

          return pipe(
            Option.fromNullable(spellName),
            Option.map((name) => name.Name_lang || ""),
            Option.getOrElse(() => `Spell ${spellId}`),
          );
        });

      const extractDescription = (
        spellId: number,
      ): Effect.Effect<
        { description: string; auraDescription: string },
        DbcError
      > =>
        Effect.gen(function* () {
          const spell = yield* dbcService.getSpell(spellId);

          return pipe(
            Option.fromNullable(spell),
            Option.map((spellRow) => ({
              auraDescription: spellRow.AuraDescription_lang || "",
              description: spellRow.Description_lang || "",
            })),
            Option.getOrElse(() => ({ auraDescription: "", description: "" })),
          );
        });

      const extractPower = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          powerCost: number;
          powerCostPct: number;
          powerType: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const spellPowers = yield* dbcService.getSpellPower(spellId);
          const firstPower = first(spellPowers);

          if (Option.isNone(firstPower)) {
            return Option.none();
          }

          return Option.some({
            powerCost: firstPower.value.ManaCost,
            powerCostPct: firstPower.value.PowerCostPct,
            powerType: firstPower.value.PowerType,
          });
        });

      const extractClassOptions = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          spellClassMask1: number;
          spellClassMask2: number;
          spellClassMask3: number;
          spellClassMask4: number;
          spellClassSet: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const classOptions = yield* dbcService.getSpellClassOptions(spellId);

          if (!classOptions) {
            return Option.none();
          }

          return Option.some({
            spellClassMask1: classOptions.SpellClassMask_0,
            spellClassMask2: classOptions.SpellClassMask_1,
            spellClassMask3: classOptions.SpellClassMask_2,
            spellClassMask4: classOptions.SpellClassMask_3,
            spellClassSet: classOptions.SpellClassSet,
          });
        });

      const getEffectsForDifficulty = (
        spellEffects: readonly Dbc.SpellEffectRow[],
        effectType: number,
        difficultyId: number,
      ): Effect.Effect<readonly Dbc.SpellEffectRow[], DbcError> =>
        Effect.gen(function* () {
          const matchingEffects = spellEffects.filter(
            (effect) =>
              effect.Effect === effectType &&
              effect.DifficultyID === difficultyId,
          );

          if (matchingEffects.length > 0 || difficultyId === 0) {
            return matchingEffects;
          }

          const difficultyRow = yield* dbcService.getDifficulty(difficultyId);

          if (!difficultyRow) {
            return spellEffects.filter(
              (effect) =>
                effect.Effect === effectType && effect.DifficultyID === 0,
            );
          }

          const fallbackDifficultyId = difficultyRow.FallbackDifficultyID;

          if (fallbackDifficultyId === difficultyId) {
            return matchingEffects;
          }

          return yield* getEffectsForDifficulty(
            spellEffects,
            effectType,
            fallbackDifficultyId,
          );
        });

      const hasAoeDamageEffect = (
        spellEffects: readonly Dbc.SpellEffectRow[],
        difficultyId: number,
      ): Effect.Effect<boolean, DbcError> =>
        Effect.gen(function* () {
          const schoolDamageEffects = yield* getEffectsForDifficulty(
            spellEffects,
            Enums.SpellEffect.SchoolDamage,
            difficultyId,
          );

          const environmentalDamageEffects = yield* getEffectsForDifficulty(
            spellEffects,
            Enums.SpellEffect.EnvironmentalDamage,
            difficultyId,
          );

          const allDamageEffects = [
            ...schoolDamageEffects,
            ...environmentalDamageEffects,
          ];

          return allDamageEffects.some(
            (effect) =>
              effect.EffectRadiusIndex_0 > 0 || effect.EffectRadiusIndex_1 > 0,
          );
        });

      const getVarianceForDifficulty = (
        spellEffects: readonly Dbc.SpellEffectRow[],
        difficultyId: number,
      ): Effect.Effect<number, DbcError> =>
        Effect.gen(function* () {
          const damageEffects = yield* getEffectsForDifficulty(
            spellEffects,
            Enums.SpellEffect.SchoolDamage,
            difficultyId,
          );

          return damageEffects[0]?.Variance ?? 0;
        });

      const getDamage = (
        spellEffect: Dbc.SpellEffectRow,
        config: DamageConfig = DEFAULT_DAMAGE_CONFIG,
      ): Effect.Effect<number, DbcError> =>
        Effect.gen(function* () {
          const { contentTuningId, expansion, level, mythicPlusSeasonId } =
            config;

          const expectedStats = yield* dbcService.getExpectedStats(
            level,
            expansion,
          );

          const sortedExpectedStats = [...expectedStats].sort(
            (a, b) => b.ExpansionID - a.ExpansionID,
          );

          if (sortedExpectedStats.length === 0) {
            return 0;
          }

          const expectedStat = sortedExpectedStats[0];

          const contentTuningExpecteds =
            yield* dbcService.getContentTuningXExpected(
              contentTuningId,
              mythicPlusSeasonId,
            );

          const expectedStatMods: Dbc.ExpectedStatModRow[] = [];

          for (const tuningExpected of contentTuningExpecteds) {
            const expectedStatMod = yield* dbcService.getExpectedStatMod(
              tuningExpected.ExpectedStatModID,
            );

            if (expectedStatMod) {
              expectedStatMods.push(expectedStatMod);
            }
          }

          let damageMultiplier = expectedStat.CreatureSpellDamage;

          for (const statMod of expectedStatMods) {
            damageMultiplier *= statMod.CreatureSpellDamageMod;
          }

          const damageValue =
            (damageMultiplier / 100) * spellEffect.EffectBasePointsF;

          return Math.round(damageValue);
        });

      const extractScaling = (
        spellEffects: readonly Dbc.SpellEffectRow[],
      ): { attackPower: number; spellPower: number } => {
        const scalingEffect = spellEffects.find(
          (effect) =>
            effect.Effect === Enums.SpellEffect.SchoolDamage ||
            effect.Effect === Enums.SpellEffect.Heal,
        );

        if (!scalingEffect) {
          return { attackPower: 0, spellPower: 0 };
        }

        return {
          attackPower: scalingEffect.BonusCoefficientFromAP,
          spellPower: scalingEffect.EffectBonusCoefficient,
        };
      };

      const extractManaCost = (
        spellEffects: readonly Dbc.SpellEffectRow[],
      ): number => {
        const manaDrainEffect = spellEffects.find(
          (effect) =>
            effect.Effect === Enums.SpellEffect.PowerDrain &&
            effect.EffectMiscValue_0 === Enums.PowerType.Mana,
        );

        return Math.abs(manaDrainEffect?.EffectBasePointsF ?? 0);
      };

      const extractTargetRestrictions = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          coneDegrees: number;
          maxTargetLevel: number;
          maxTargets: number;
          targetCreatureType: number;
          targets: number;
          width: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const restrictions =
            yield* dbcService.getSpellTargetRestrictions(spellId);

          if (!restrictions) {
            return Option.none();
          }

          return Option.some({
            coneDegrees: restrictions.ConeDegrees,
            maxTargetLevel: restrictions.MaxTargetLevel,
            maxTargets: restrictions.MaxTargets,
            targetCreatureType: restrictions.TargetCreatureType,
            targets: restrictions.Targets,
            width: restrictions.Width,
          });
        });

      return {
        extractCastTime,
        extractCharges,
        extractClassOptions,
        extractCooldown,
        extractDescription,
        extractDuration,
        extractEmpower,
        extractInterrupts,
        extractManaCost,
        extractName,
        extractPower,
        extractRadius,
        extractRange,
        extractScaling,
        extractTargetRestrictions,
        getDamage,
        getEffectsForDifficulty,
        getVarianceForDifficulty,
        hasAoeDamageEffect,
      };
    }),
  },
) {}
