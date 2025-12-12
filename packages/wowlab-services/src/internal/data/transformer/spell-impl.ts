import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Branded, Spell } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { DbcServiceInterface } from "../dbc/DbcService.js";
import type { ExtractorService } from "./extractors.js";

export interface SpellKnowledgeContext {
  readonly classId?: number;
  readonly classSpellIds?: ReadonlySet<number>;
  readonly specId?: number;
  readonly talentSpellIdToTraitDefinitionId?: ReadonlyMap<number, number>;
}

export const transformSpellWith = (
  dbc: DbcServiceInterface,
  extractor: ExtractorService,
  spellId: number,
  knowledgeContext?: SpellKnowledgeContext,
): Effect.Effect<Spell.SpellDataFlat, Errors.SpellInfoNotFound | DbcError> =>
  Effect.gen(function* () {
    const nameRow = yield* dbc.getSpellName(spellId);
    if (!nameRow) {
      return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    const [misc, effects, spellCategories] = yield* Effect.all(
      [
        dbc.getSpellMisc(spellId),
        dbc.getSpellEffects(spellId),
        dbc.getSpellCategories(spellId),
      ],
      { batching: true },
    );

    const miscOpt = Option.fromNullable(misc);

    const [
      range,
      radius,
      cooldown,
      _interrupts,
      empower,
      targetRestrictions,
      castTime,
      duration,
      charges,
      name,
      descriptions,
      power,
      classOptions,
      auraRestrictions,
      levels,
      learnSpells,
      replacement,
      shapeshift,
      totems,
      descriptionVariables,
    ] = yield* Effect.all(
      [
        extractor.extractRange(miscOpt),
        extractor.extractRadius(effects),
        extractor.extractCooldown(spellId),
        extractor.extractInterrupts(spellId),
        extractor.extractEmpower(spellId),
        extractor.extractTargetRestrictions(spellId),
        extractor.extractCastTime(miscOpt),
        extractor.extractDuration(miscOpt),
        extractor.extractCharges(spellId),
        extractor.extractName(spellId),
        extractor.extractDescription(spellId),
        extractor.extractPower(spellId),
        extractor.extractClassOptions(spellId),
        extractor.extractAuraRestrictions(spellId),
        extractor.extractLevels(spellId),
        extractor.extractLearnSpells(spellId),
        extractor.extractReplacement(spellId),
        extractor.extractShapeshift(spellId),
        extractor.extractTotems(spellId),
        extractor.extractDescriptionVariables(spellId),
      ],
      { batching: true },
    );

    const targeting = effects.flatMap((e) =>
      [e.ImplicitTarget_0, e.ImplicitTarget_1].filter((t) => t !== 0),
    );

    const damage = pipe(
      miscOpt,
      Option.map((m) => ({ schoolMask: m.SchoolMask })),
    );

    const attributes = pipe(
      miscOpt,
      Option.map((m) => [
        m.Attributes_0,
        m.Attributes_1,
        m.Attributes_2,
        m.Attributes_3,
        m.Attributes_4,
        m.Attributes_5,
        m.Attributes_6,
        m.Attributes_7,
        m.Attributes_8,
        m.Attributes_9,
        m.Attributes_10,
        m.Attributes_11,
        m.Attributes_12,
        m.Attributes_13,
        m.Attributes_14,
        m.Attributes_15,
      ]),
    );

    const missile = pipe(
      miscOpt,
      Option.map((m) => ({ speed: m.Speed })),
    );

    const defense = pipe(
      Option.fromNullable(spellCategories),
      Option.map((c) => ({ defenseType: c.DefenseType })),
    );

    const scaling = extractor.extractScaling(effects);

    const dispel = pipe(
      Option.fromNullable(spellCategories),
      Option.map((c) => ({ dispelType: c.DispelType })),
    );

    const triggers = effects
      .map((e) => e.EffectTriggerSpell)
      .filter((t) => t !== 0);

    const manaCost = extractor.extractManaCost(effects);

    const iconFileDataId = pipe(
      miscOpt,
      Option.map((m) => m.SpellIconFileDataID),
      Option.getOrElse(() => 0),
    );

    const iconRow =
      iconFileDataId > 0
        ? Option.fromNullable(
            yield* dbc.getManifestInterfaceData(iconFileDataId),
          )
        : Option.none();

    const fileName = pipe(
      iconRow,
      Option.map((row) => row.FileName.toLowerCase().split(".")[0]),
      Option.getOrElse(() => "inv_misc_questionmark"),
    );

    const baseCastTime = Option.isSome(castTime) ? castTime.value.base : 0;

    const isPassive =
      baseCastTime === 0 &&
      effects.length > 0 &&
      effects.every((e) => e.Effect === 6);

    const knowledgeSource: Spell.KnowledgeSource = (() => {
      const traitDefinitionId =
        knowledgeContext?.talentSpellIdToTraitDefinitionId?.get(spellId);

      if (traitDefinitionId != null) {
        return { source: "talent", traitDefinitionId };
      }

      const classId = knowledgeContext?.classId;
      if (classId != null && knowledgeContext?.classSpellIds?.has(spellId)) {
        return { classId, source: "class" };
      }

      const specId = knowledgeContext?.specId;
      if (specId != null) {
        return { source: "spec", specId };
      }

      return { source: "unknown" };
    })();

    return {
      // Core
      auraDescription: descriptions.auraDescription,
      description: descriptions.description,
      descriptionVariables: Option.getOrElse(descriptionVariables, () => ""),
      fileName,
      id: Branded.SpellID(spellId),
      isPassive,
      knowledgeSource,
      name,

      // Timing
      castTime: baseCastTime,
      recoveryTime: Option.isSome(cooldown) ? cooldown.value.recovery : 0,
      startRecoveryTime: Option.isSome(cooldown) ? cooldown.value.gcd : 1500,

      // Resources
      manaCost,
      powerCost: Option.isSome(power) ? power.value.powerCost : 0,
      powerCostPct: Option.isSome(power) ? power.value.powerCostPct : 0,
      powerType: Option.isSome(power) ? power.value.powerType : -1,

      // Charges
      chargeRecoveryTime: Option.isSome(charges)
        ? charges.value.rechargeTime
        : 0,
      maxCharges: Option.isSome(charges) ? charges.value.maxCharges : 0,

      // Range
      rangeMax0: Option.isSome(range) ? range.value.enemy.max : 0,
      rangeMax1: Option.isSome(range) ? range.value.ally.max : 0,
      rangeMin0: Option.isSome(range) ? range.value.enemy.min : 0,
      rangeMin1: Option.isSome(range) ? range.value.ally.min : 0,

      // Geometry
      coneDegrees: Option.isSome(targetRestrictions)
        ? targetRestrictions.value.coneDegrees
        : 0,
      radiusMax: radius.length > 0 ? radius[0].max : 0,
      radiusMin: radius.length > 0 ? radius[0].min : 0,

      // Damage/Defense
      defenseType: Option.isSome(defense) ? defense.value.defenseType : 0,
      schoolMask: Option.isSome(damage) ? damage.value.schoolMask : 0,

      // Scaling
      bonusCoefficientFromAP: scaling.attackPower,
      effectBonusCoefficient: scaling.spellPower,

      // Interrupts
      interruptAura0: 0, // TODO
      interruptAura1: 0, // TODO
      interruptChannel0: 0, // TODO
      interruptChannel1: 0, // TODO
      interruptFlags: 0, // TODO

      // Duration
      duration: Option.isSome(duration) ? duration.value.duration : 0,
      maxDuration: Option.isSome(duration) ? duration.value.max : 0,

      // Empower
      canEmpower: Option.isSome(empower) ? empower.value.canEmpower : false,
      empowerStages: Option.isSome(empower) ? empower.value.stages : [],

      // Mechanics
      dispelType: Option.isSome(dispel) ? dispel.value.dispelType : 0,
      facingCasterFlags: 0,
      speed: Option.isSome(missile) ? missile.value.speed : 0,
      spellClassMask1: Option.isSome(classOptions)
        ? classOptions.value.spellClassMask1
        : 0,
      spellClassMask2: Option.isSome(classOptions)
        ? classOptions.value.spellClassMask2
        : 0,
      spellClassMask3: Option.isSome(classOptions)
        ? classOptions.value.spellClassMask3
        : 0,
      spellClassMask4: Option.isSome(classOptions)
        ? classOptions.value.spellClassMask4
        : 0,
      spellClassSet: Option.isSome(classOptions)
        ? classOptions.value.spellClassSet
        : 0,

      // Levels
      baseLevel: Option.isSome(levels) ? levels.value.baseLevel : 0,
      maxLevel: Option.isSome(levels) ? levels.value.maxLevel : 0,
      maxPassiveAuraLevel: Option.isSome(levels)
        ? levels.value.maxPassiveAuraLevel
        : 0,
      spellLevel: Option.isSome(levels) ? levels.value.spellLevel : 0,

      // Aura Restrictions
      casterAuraSpell: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.casterAuraSpell
        : 0,
      casterAuraState: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.casterAuraState
        : 0,
      excludeCasterAuraSpell: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.excludeCasterAuraSpell
        : 0,
      excludeCasterAuraState: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.excludeCasterAuraState
        : 0,
      excludeTargetAuraSpell: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.excludeTargetAuraSpell
        : 0,
      excludeTargetAuraState: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.excludeTargetAuraState
        : 0,
      targetAuraSpell: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.targetAuraSpell
        : 0,
      targetAuraState: Option.isSome(auraRestrictions)
        ? auraRestrictions.value.targetAuraState
        : 0,

      // Replacement
      replacementSpellId: Option.isSome(replacement)
        ? replacement.value.replacementSpellId
        : 0,

      // Shapeshift
      shapeshiftExclude0: Option.isSome(shapeshift)
        ? shapeshift.value.shapeshiftExclude[0]
        : 0,
      shapeshiftExclude1: Option.isSome(shapeshift)
        ? shapeshift.value.shapeshiftExclude[1]
        : 0,
      shapeshiftMask0: Option.isSome(shapeshift)
        ? shapeshift.value.shapeshiftMask[0]
        : 0,
      shapeshiftMask1: Option.isSome(shapeshift)
        ? shapeshift.value.shapeshiftMask[1]
        : 0,
      stanceBarOrder: Option.isSome(shapeshift)
        ? shapeshift.value.stanceBarOrder
        : 0,

      // Totems
      requiredTotemCategory0: Option.isSome(totems)
        ? totems.value.requiredTotemCategories[0]
        : 0,
      requiredTotemCategory1: Option.isSome(totems)
        ? totems.value.requiredTotemCategories[1]
        : 0,
      totem0: Option.isSome(totems) ? totems.value.totems[0] : 0,
      totem1: Option.isSome(totems) ? totems.value.totems[1] : 0,

      // Arrays
      attributes: Option.getOrElse(attributes, () => []),
      effectTriggerSpell: triggers.length > 0 ? triggers : [],
      implicitTarget: targeting.length > 0 ? targeting : [],
      learnSpells,
    };
  });
