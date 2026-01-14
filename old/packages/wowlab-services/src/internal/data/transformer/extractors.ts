import * as Constants from "@wowlab/core/Constants";
import { DbcError } from "@wowlab/core/Errors";
import { Aura, Dbc, Enums, Spell } from "@wowlab/core/Schemas";
import * as Cache from "effect/Cache";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";

import { DbcService } from "../dbc/DbcService.js";
import { SpecCoverageProgressService } from "../SpecCoverageProgress.js";
import { transformSpellWith } from "./spell-impl.js";

const first = <T>(array?: readonly T[]): Option.Option<T> =>
  array?.[0] ? Option.some(array[0]) : Option.none();

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

export class ExtractorService extends Effect.Service<ExtractorService>()(
  "@wowlab/services/ExtractorService",
  {
    effect: Effect.gen(function* () {
      const dbcService = yield* DbcService;

      const expectedStatsIndexCache = yield* Cache.make({
        capacity: 1,
        lookup: (_key: 0) =>
          dbcService.getAll("expected_stat").pipe(
            Effect.map((rows) => {
              const byLevel = new Map<number, Dbc.ExpectedStatRow[]>();

              for (const row of rows) {
                const existing = byLevel.get(row.Lvl) ?? [];
                existing.push(row);
                byLevel.set(row.Lvl, existing);
              }

              return byLevel;
            }),
          ),
        timeToLive: Duration.minutes(5),
      });

      const contentTuningXExpectedIndexCache = yield* Cache.make({
        capacity: 1,
        lookup: (_key: 0) =>
          dbcService.getAll("content_tuning_x_expected").pipe(
            Effect.map((rows) => {
              const byContentTuningId = new Map<
                number,
                Dbc.ContentTuningXExpectedRow[]
              >();

              for (const row of rows) {
                const existing =
                  byContentTuningId.get(row.ContentTuningID) ?? [];
                existing.push(row);
                byContentTuningId.set(row.ContentTuningID, existing);
              }

              return byContentTuningId;
            }),
          ),
        timeToLive: Duration.minutes(5),
      });

      const getExpectedStats = (level: number, expansion: number) =>
        expectedStatsIndexCache.get(0).pipe(
          Effect.map((byLevel) => byLevel.get(level) ?? []),
          Effect.map((rows) =>
            rows.filter(
              (stat) =>
                stat.ExpansionID === expansion || stat.ExpansionID === -2,
            ),
          ),
        );

      const getContentTuningXExpected = (
        contentTuningId: number,
        mythicPlusSeasonId: number,
      ) =>
        contentTuningXExpectedIndexCache.get(0).pipe(
          Effect.map((byId) => byId.get(contentTuningId) ?? []),
          Effect.map((rows) =>
            rows.filter(
              (x) =>
                (x.MinMythicPlusSeasonID === 0 ||
                  mythicPlusSeasonId >= x.MinMythicPlusSeasonID) &&
                (x.MaxMythicPlusSeasonID === 0 ||
                  mythicPlusSeasonId < x.MaxMythicPlusSeasonID),
            ),
          ),
        );

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
                const spellRange = yield* dbcService.getById(
                  "spell_range",
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
          // Collect all unique non-zero radius indices
          const radiusIndices = [
            ...new Set(
              spellEffects.flatMap((effect) =>
                [effect.EffectRadiusIndex_0, effect.EffectRadiusIndex_1].filter(
                  (i) => i !== 0,
                ),
              ),
            ),
          ];

          const radii = yield* Effect.forEach(
            radiusIndices,
            (index) => dbcService.getById("spell_radius", index),
            { batching: true },
          );

          return radii
            .filter((r): r is NonNullable<typeof r> => r != null)
            .map((spellRadius) => ({
              max: spellRadius.RadiusMax,
              min: spellRadius.RadiusMin,
              radius: spellRadius.Radius,
            }));
        });

      const extractCooldown = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{ category: number; gcd: number; recovery: number }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const spellCooldowns = yield* dbcService.getOneByFk(
            "spell_cooldowns",
            "SpellID",
            spellId,
          );

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
          const spellInterrupts = yield* dbcService.getOneByFk(
            "spell_interrupts",
            "SpellID",
            spellId,
          );

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
          const spellEmpower = yield* dbcService.getOneByFk(
            "spell_empower",
            "SpellID",
            spellId,
          );

          if (!spellEmpower) {
            return Option.some({ canEmpower: false, stages: [] });
          }

          const empowerStages = yield* dbcService.getManyByFk(
            "spell_empower_stage",
            "SpellEmpowerID",
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
                const castTimes = yield* dbcService.getById(
                  "spell_cast_times",
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
                const spellDuration = yield* dbcService.getById(
                  "spell_duration",
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
          const spellCategories = yield* dbcService.getOneByFk(
            "spell_categories",
            "SpellID",
            spellId,
          );

          if (!spellCategories || spellCategories.ChargeCategory === 0) {
            return Option.none();
          }

          const spellCategory = yield* dbcService.getById(
            "spell_category",
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
          const spellName = yield* dbcService.getById("spell_name", spellId);

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
          const spell = yield* dbcService.getById("spell", spellId);

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
          const spellPowers = yield* dbcService.getManyByFk(
            "spell_power",
            "SpellID",
            spellId,
          );
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
          const classOptions = yield* dbcService.getOneByFk(
            "spell_class_options",
            "SpellID",
            spellId,
          );

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

          const difficultyRow = yield* dbcService.getById(
            "difficulty",
            difficultyId,
          );

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

          const [expectedStats, contentTuningExpecteds] = yield* Effect.all(
            [
              getExpectedStats(level, expansion),
              getContentTuningXExpected(contentTuningId, mythicPlusSeasonId),
            ],
            { batching: true },
          );

          const sortedExpectedStats = [...expectedStats].sort(
            (a, b) => b.ExpansionID - a.ExpansionID,
          );

          if (sortedExpectedStats.length === 0) {
            return 0;
          }

          const expectedStat = sortedExpectedStats[0];

          // Batch fetch all expected stat mods
          const expectedStatMods = yield* Effect.forEach(
            contentTuningExpecteds,
            (tuningExpected) =>
              dbcService.getById(
                "expected_stat_mod",
                tuningExpected.ExpectedStatModID,
              ),
            { batching: true },
          );

          let damageMultiplier = expectedStat.CreatureSpellDamage;

          for (const statMod of expectedStatMods) {
            if (statMod) {
              damageMultiplier *= statMod.CreatureSpellDamageMod;
            }
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
          const restrictions = yield* dbcService.getOneByFk(
            "spell_target_restrictions",
            "SpellID",
            spellId,
          );

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

      const extractAuraRestrictions = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          casterAuraSpell: number;
          casterAuraState: number;
          excludeCasterAuraSpell: number;
          excludeCasterAuraState: number;
          excludeTargetAuraSpell: number;
          excludeTargetAuraState: number;
          targetAuraSpell: number;
          targetAuraState: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const restrictions = yield* dbcService.getOneByFk(
            "spell_aura_restrictions",
            "SpellID",
            spellId,
          );

          if (!restrictions) {
            return Option.none();
          }

          return Option.some({
            casterAuraSpell: restrictions.CasterAuraSpell,
            casterAuraState: restrictions.CasterAuraState,
            excludeCasterAuraSpell: restrictions.ExcludeCasterAuraSpell,
            excludeCasterAuraState: restrictions.ExcludeCasterAuraState,
            excludeTargetAuraSpell: restrictions.ExcludeTargetAuraSpell,
            excludeTargetAuraState: restrictions.ExcludeTargetAuraState,
            targetAuraSpell: restrictions.TargetAuraSpell,
            targetAuraState: restrictions.TargetAuraState,
          });
        });

      const extractLevels = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          baseLevel: number;
          maxLevel: number;
          maxPassiveAuraLevel: number;
          spellLevel: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const levels = yield* dbcService.getManyByFk(
            "spell_levels",
            "SpellID",
            spellId,
          );

          // TODO Take the first level entry for now (usually difficulty 0)
          const level = first(levels);

          if (Option.isNone(level)) {
            return Option.none();
          }

          return Option.some({
            baseLevel: level.value.BaseLevel,
            maxLevel: level.value.MaxLevel,
            maxPassiveAuraLevel: level.value.MaxPassiveAuraLevel,
            spellLevel: level.value.SpellLevel,
          });
        });

      const extractLearnSpells = (
        spellId: number,
      ): Effect.Effect<
        Array<{
          learnSpellId: number;
          overridesSpellId: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const learnSpells = yield* dbcService.getManyByFk(
            "spell_learn_spell",
            "SpellID",
            spellId,
          );

          return learnSpells.map((ls) => ({
            learnSpellId: ls.LearnSpellID,
            overridesSpellId: ls.OverridesSpellID,
          }));
        });

      const extractReplacement = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{ replacementSpellId: number }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const replacement = yield* dbcService.getOneByFk(
            "spell_replacement",
            "SpellID",
            spellId,
          );

          if (!replacement) {
            return Option.none();
          }

          return Option.some({
            replacementSpellId: replacement.ReplacementSpellID,
          });
        });

      const extractShapeshift = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          shapeshiftExclude: [number, number];
          shapeshiftMask: [number, number];
          stanceBarOrder: number;
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const shapeshift = yield* dbcService.getOneByFk(
            "spell_shapeshift",
            "SpellID",
            spellId,
          );

          if (!shapeshift) {
            return Option.none();
          }

          return Option.some({
            shapeshiftExclude: [
              shapeshift.ShapeshiftExclude_0,
              shapeshift.ShapeshiftExclude_1,
            ] as [number, number],
            shapeshiftMask: [
              shapeshift.ShapeshiftMask_0,
              shapeshift.ShapeshiftMask_1,
            ] as [number, number],
            stanceBarOrder: shapeshift.StanceBarOrder,
          });
        });

      const extractTotems = (
        spellId: number,
      ): Effect.Effect<
        Option.Option<{
          requiredTotemCategories: [number, number];
          totems: [number, number];
        }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const totemsData = yield* dbcService.getManyByFk(
            "spell_totems",
            "SpellID",
            spellId,
          );

          const totem = first(totemsData);

          if (Option.isNone(totem)) {
            return Option.none();
          }

          return Option.some({
            requiredTotemCategories: [
              totem.value.RequiredTotemCategoryID_0,
              totem.value.RequiredTotemCategoryID_1,
            ] as [number, number],
            totems: [totem.value.Totem_0, totem.value.Totem_1] as [
              number,
              number,
            ],
          });
        });

      const extractDescriptionVariables = (
        spellId: number,
      ): Effect.Effect<Option.Option<string>, DbcError> =>
        Effect.gen(function* () {
          const xDescVars = yield* dbcService.getManyByFk(
            "spell_x_description_variables",
            "SpellID",
            spellId,
          );

          const firstXDescVar = first(xDescVars);

          if (Option.isNone(firstXDescVar)) {
            return Option.none();
          }

          const descVars = yield* dbcService.getById(
            "spell_description_variables",
            firstXDescVar.value.SpellDescriptionVariablesID,
          );

          if (!descVars) {
            return Option.none();
          }

          return Option.some(descVars.Variables);
        });

      /**
       * Extract aura-related flags from spell attributes.
       * Per docs/aura-system/04-phase2-transformer.md mapping table.
       */
      const extractAuraFlags = (
        attributes: readonly number[],
      ): {
        durationHasted: boolean;
        hastedTicks: boolean;
        pandemicRefresh: boolean;
        rollingPeriodic: boolean;
        tickMayCrit: boolean;
        tickOnApplication: boolean;
      } => ({
        durationHasted: Constants.hasSpellAttribute(
          attributes,
          Constants.SX_DURATION_HASTED,
        ),
        hastedTicks: Constants.hasSpellAttribute(
          attributes,
          Constants.SX_DOT_HASTED,
        ),
        pandemicRefresh: Constants.hasSpellAttribute(
          attributes,
          Constants.SX_REFRESH_EXTENDS_DURATION,
        ),
        rollingPeriodic: Constants.hasSpellAttribute(
          attributes,
          Constants.SX_ROLLING_PERIODIC,
        ),
        tickMayCrit: Constants.hasSpellAttribute(
          attributes,
          Constants.SX_TICK_MAY_CRIT,
        ),
        tickOnApplication: Constants.hasSpellAttribute(
          attributes,
          Constants.SX_TICK_ON_APPLICATION,
        ),
      });

      /**
       * Periodic EffectAura values from docs/aura-system/02-reference-spell-data.md
       */
      const PERIODIC_AURA_TYPES: ReadonlyMap<number, Aura.PeriodicType> =
        new Map([
          [20, "heal"], // A_PERIODIC_HEAL_PCT
          [23, "trigger_spell"], // A_PERIODIC_TRIGGER_SPELL
          [24, "energize"], // A_PERIODIC_ENERGIZE
          [3, "damage"], // A_PERIODIC_DAMAGE
          [53, "leech"], // A_PERIODIC_LEECH
          [8, "heal"], // A_PERIODIC_HEAL
        ]);

      /**
       * Extract periodic info from spell effects.
       * Returns periodicType and tickPeriodMs from the first matching periodic effect.
       */
      const extractPeriodicInfo = (
        effects: readonly Dbc.SpellEffectRow[],
      ): { periodicType: Aura.PeriodicType | null; tickPeriodMs: number } => {
        for (const effect of effects) {
          const periodicType = PERIODIC_AURA_TYPES.get(effect.EffectAura);
          if (periodicType && effect.EffectAuraPeriod > 0) {
            return {
              periodicType,
              tickPeriodMs: effect.EffectAuraPeriod,
            };
          }
        }

        return { periodicType: null, tickPeriodMs: 0 };
      };

      /**
       * Determine refresh behavior based on pandemic flag and periodic type.
       * Per docs/aura-system/04-phase2-transformer.md:
       * pandemic flag or any periodic tickPeriodMs>0 => "pandemic"; else "duration"
       */
      const determineRefreshBehavior = (
        pandemicFlag: boolean,
        tickPeriodMs: number,
      ): Aura.RefreshBehavior =>
        pandemicFlag || tickPeriodMs > 0 ? "pandemic" : "duration";

      const extractSpellsForSpec = (
        specId: number,
      ): Effect.Effect<
        Array<{ spellId: number; spellName: string }>,
        DbcError
      > =>
        Effect.gen(function* () {
          const specSpells = yield* dbcService.getManyByFk(
            "specialization_spells",
            "SpecID",
            specId,
          );

          const results = yield* Effect.forEach(
            specSpells,
            (specSpell) =>
              extractName(specSpell.SpellID).pipe(
                Effect.orElseSucceed(() => `Spell ${specSpell.SpellID}`),
                Effect.map((spellName) => ({
                  spellId: specSpell.SpellID,
                  spellName,
                })),
              ),
            { batching: true },
          );

          return [...results].sort((a, b) =>
            a.spellName.localeCompare(b.spellName),
          );
        });

      const buildSpecCoverage = (
        supportedSpellIds: ReadonlySet<number>,
      ): Effect.Effect<
        {
          classes: Array<{
            id: number;
            name: string;
            color: string;
            specs: Array<{
              id: number;
              name: string;
              spells: Array<
                {
                  supported: boolean;
                } & Spell.SpellDataFlat
              >;
            }>;
          }>;
        },
        DbcError,
        SpecCoverageProgressService | ExtractorService
      > =>
        Effect.gen(function* () {
          const progressService = yield* SpecCoverageProgressService;

          const [allClasses, allSpecs] = yield* Effect.all(
            [
              dbcService.getAll("chr_classes"),
              dbcService.getAll("chr_specialization"),
            ],
            { batching: true },
          );

          // Filter out non-playable classes (Adventurer=14, Traveler=15) and build class map
          const validClasses = allClasses.filter(
            (c) => c.ID !== 14 && c.ID !== 15 && c.Name_lang,
          );

          // Filter out Initial specs
          const validSpecs = allSpecs.filter(
            (s) => s.Name_lang && s.Name_lang !== "Initial",
          );

          // Group specs by ClassID
          const specsByClass = new Map<number, typeof validSpecs>();
          for (const spec of validSpecs) {
            if (spec.ClassID == null) {
              continue;
            }

            const existing = specsByClass.get(spec.ClassID) ?? [];
            existing.push(spec);
            specsByClass.set(spec.ClassID, existing);
          }

          const totalSpecs = validSpecs.length;
          const loadedCount = yield* Ref.make(0);

          const allSpecSpellsResults = yield* Effect.forEach(
            validSpecs,
            (spec) =>
              dbcService.getManyByFk(
                "specialization_spells",
                "SpecID",
                spec.ID,
              ),
            { batching: true },
          );

          const specSpellIdsMap = new Map<number, ReadonlyArray<number>>();
          for (let i = 0; i < validSpecs.length; i++) {
            const ids = allSpecSpellsResults[i]
              .flatMap((row) => [row.SpellID, row.OverridesSpellID])
              .filter((id): id is number => typeof id === "number" && id > 0);

            specSpellIdsMap.set(validSpecs[i].ID, [...new Set(ids)]);
          }

          yield* progressService.publish({
            className: "All",
            loaded: 0,
            specName: "All",
            total: totalSpecs,
          });

          const buildTalentSpellIdToTraitDefinitionId = (
            specId: number,
          ): Effect.Effect<ReadonlyMap<number, number>, DbcError> =>
            Effect.gen(function* () {
              const loadout = yield* dbcService.getOneByFk(
                "trait_tree_loadout",
                "ChrSpecializationID",
                specId,
              );
              if (!loadout) {
                return new Map();
              }

              const treeNodes = yield* dbcService.getManyByFk(
                "trait_node",
                "TraitTreeID",
                loadout.TraitTreeID,
              );

              const allNodeXEntries = yield* Effect.forEach(
                treeNodes,
                (node) =>
                  dbcService.getManyByFk(
                    "trait_node_x_trait_node_entry",
                    "TraitNodeID",
                    node.ID,
                  ),
                { batching: true },
              );

              const allEntryIds = allNodeXEntries
                .flat()
                .map((x) => x.TraitNodeEntryID);

              const allEntries = yield* Effect.forEach(
                allEntryIds,
                (entryId) => dbcService.getById("trait_node_entry", entryId),
                { batching: true },
              );

              const definitionIds = [
                ...new Set(
                  allEntries
                    .filter((e): e is NonNullable<typeof e> => e != null)
                    .map((e) => e.TraitDefinitionID),
                ),
              ];

              const definitions = yield* Effect.forEach(
                definitionIds,
                (defId) => dbcService.getById("trait_definition", defId),
                { batching: true },
              );

              const map = new Map<number, number>();
              for (const def of definitions) {
                if (def && def.SpellID > 0) {
                  map.set(def.SpellID, def.ID);
                }
              }

              return map;
            });

          const classes = yield* Effect.forEach(
            validClasses,
            (cls) =>
              Effect.gen(function* () {
                const r = cls.ClassColorR ?? 128;
                const g = cls.ClassColorG ?? 128;
                const b = cls.ClassColorB ?? 128;
                const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

                const classSpecs = specsByClass.get(cls.ID) ?? [];
                classSpecs.sort(
                  (a, b) => (a.OrderIndex ?? 0) - (b.OrderIndex ?? 0),
                );

                const classSpellIds = (() => {
                  const firstSpec = classSpecs[0];
                  if (!firstSpec) {
                    return new Set<number>();
                  }

                  const intersection = new Set<number>(
                    specSpellIdsMap.get(firstSpec.ID) ?? [],
                  );

                  for (const spec of classSpecs.slice(1)) {
                    const spellIds = new Set<number>(
                      specSpellIdsMap.get(spec.ID) ?? [],
                    );

                    for (const id of intersection) {
                      if (!spellIds.has(id)) {
                        intersection.delete(id);
                      }
                    }
                  }

                  return intersection;
                })();

                const specs = yield* Effect.forEach(
                  classSpecs,
                  (spec) =>
                    Effect.gen(function* () {
                      const extractor = yield* ExtractorService;

                      const talentSpellIdToTraitDefinitionId =
                        yield* buildTalentSpellIdToTraitDefinitionId(spec.ID);

                      const specSpellIds = specSpellIdsMap.get(spec.ID) ?? [];
                      const talentSpellIds = [
                        ...talentSpellIdToTraitDefinitionId.keys(),
                      ];

                      const spellIdsForSpec = [
                        ...new Set([...specSpellIds, ...talentSpellIds]),
                      ];

                      const spellsResults = yield* Effect.forEach(
                        spellIdsForSpec,
                        (spellId) =>
                          transformSpellWith(dbcService, extractor, spellId, {
                            classId: cls.ID,
                            classSpellIds,
                            specId: spec.ID,
                            talentSpellIdToTraitDefinitionId,
                          }).pipe(
                            Effect.map((spell) => ({
                              ...spell,
                              supported: supportedSpellIds.has(spellId),
                            })),
                            Effect.orElseSucceed(() => null),
                          ),
                        { batching: true },
                      );

                      const spells = spellsResults
                        .filter((s): s is NonNullable<typeof s> => s != null)
                        .sort((a, b) => a.name.localeCompare(b.name));

                      const loaded = yield* Ref.updateAndGet(
                        loadedCount,
                        (n) => n + 1,
                      );

                      yield* progressService.publish({
                        className: cls.Name_lang!,
                        loaded,
                        specName: spec.Name_lang!,
                        total: totalSpecs,
                      });

                      return {
                        id: spec.ID,
                        name: spec.Name_lang!,
                        spells,
                      };
                    }),
                  { batching: true },
                );

                return {
                  color,
                  id: cls.ID,
                  name: cls.Name_lang!,
                  specs,
                };
              }),
            { batching: true },
          );

          // Sort classes by ID
          classes.sort((a, b) => a.id - b.id);

          return { classes };
        });

      const extractTalentIcon = (
        traitDefinition: Dbc.TraitDefinitionRow,
      ): Effect.Effect<string, DbcError> =>
        Effect.gen(function* () {
          let iconFileDataId = traitDefinition.OverrideIcon;

          if (iconFileDataId === 0 && traitDefinition.SpellID !== 0) {
            const spellMisc = yield* dbcService.getOneByFk(
              "spell_misc",
              "SpellID",
              traitDefinition.SpellID,
            );

            iconFileDataId = spellMisc?.SpellIconFileDataID ?? 0;
          }

          if (iconFileDataId === 0) {
            return "inv_misc_questionmark";
          }

          const manifest = yield* dbcService.getById(
            "manifest_interface_data",
            iconFileDataId,
          );

          if (!manifest) {
            return "inv_misc_questionmark";
          }

          return manifest.FileName.toLowerCase().replace(".blp", "");
        });

      const extractTalentName = (
        traitDefinition: Dbc.TraitDefinitionRow,
      ): Effect.Effect<string, DbcError> =>
        Effect.gen(function* () {
          if (traitDefinition.OverrideName_lang) {
            return traitDefinition.OverrideName_lang;
          }

          if (traitDefinition.SpellID === 0) {
            return "Unknown Talent";
          }

          const spellName = yield* dbcService.getById(
            "spell_name",
            traitDefinition.SpellID,
          );

          return spellName?.Name_lang ?? `Spell ${traitDefinition.SpellID}`;
        });

      const extractTalentDescription = (
        traitDefinition: Dbc.TraitDefinitionRow,
      ): Effect.Effect<string, DbcError> =>
        Effect.gen(function* () {
          if (traitDefinition.OverrideDescription_lang) {
            return traitDefinition.OverrideDescription_lang;
          }

          if (traitDefinition.SpellID === 0) {
            return "";
          }

          const spell = yield* dbcService.getById(
            "spell",
            traitDefinition.SpellID,
          );

          return spell?.Description_lang ?? "";
        });

      return {
        buildSpecCoverage,
        determineRefreshBehavior,
        extractAuraFlags,
        extractAuraRestrictions,
        extractCastTime,
        extractCharges,
        extractClassOptions,
        extractCooldown,
        extractDescription,
        extractDescriptionVariables,
        extractDuration,
        extractEmpower,
        extractInterrupts,
        extractLearnSpells,
        extractLevels,
        extractManaCost,
        extractName,
        extractPeriodicInfo,
        extractPower,
        extractRadius,
        extractRange,
        extractReplacement,
        extractScaling,
        extractShapeshift,
        extractSpellsForSpec,
        extractTalentDescription,
        extractTalentIcon,
        extractTalentName,
        extractTargetRestrictions,
        extractTotems,
        getDamage,
        getEffectsForDifficulty,
        getVarianceForDifficulty,
        hasAoeDamageEffect,
      };
    }),
  },
) {}
