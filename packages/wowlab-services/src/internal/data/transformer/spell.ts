import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Branded, Spell } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";
import { ExtractorService } from "./extractors.js";

export const transformSpell = (
  spellId: number,
): Effect.Effect<
  Spell.SpellDataFlat,
  Errors.SpellInfoNotFound | DbcError,
  DbcService | ExtractorService
> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    const nameRow = yield* dbc.getSpellName(spellId);
    if (!nameRow) {
      return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    const misc = Option.fromNullable(yield* dbc.getSpellMisc(spellId));
    const effects = yield* dbc.getSpellEffects(spellId);

    // Extract all properties using focused extractor functions
    const range = yield* extractor.extractRange(misc);
    const radius = yield* extractor.extractRadius(effects);

    // ImplicitTarget is on Effect, so we can extract it.
    const targeting = effects.flatMap((e) =>
      [e.ImplicitTarget_0, e.ImplicitTarget_1].filter((t) => t !== 0),
    );

    const damage = pipe(
      misc,
      Option.map((m) => ({ schoolMask: m.SchoolMask })),
    );
    const cooldown = yield* extractor.extractCooldown(spellId);
    const _interrupts = yield* extractor.extractInterrupts(spellId);

    const spellCategories = yield* dbc.getSpellCategories(spellId);

    const attributes = pipe(
      misc,
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
      misc,
      Option.map((m) => ({ speed: m.Speed })),
    );
    const empower = yield* extractor.extractEmpower(spellId);

    // Cone relies on SpellTargetRestrictions (missing)
    const _cone = Option.none();
    /*
    pipe(
      first(cache.spellTargetRestrictions.get(spellId)),
      Option.map((t) => ({ degrees: t.ConeDegrees })),
    );
    */

    const castTime = yield* extractor.extractCastTime(misc);
    const duration = yield* extractor.extractDuration(misc);
    const charges = yield* extractor.extractCharges(spellId);

    const defense = pipe(
      Option.fromNullable(spellCategories),
      Option.map((c) => ({ defenseType: c.DefenseType })),
    );
    const scaling = extractor.extractScaling(effects);
    const dispel = pipe(
      Option.fromNullable(spellCategories),
      Option.map((c) => ({ dispelType: c.DispelType })),
    );

    // Facing relies on SpellCastingRequirements (missing)
    const _facing = Option.none();
    /*
    pipe(
      first(cache.spellCastingRequirements.get(spellId)),
      Option.map((r) => ({ facingFlags: r.FacingCasterFlags })),
    );
    */

    const triggers = effects
      .map((e) => e.EffectTriggerSpell)
      .filter((t) => t !== 0);
    const manaCost = extractor.extractManaCost(effects);
    const name = yield* extractor.extractName(spellId);
    const descriptions = yield* extractor.extractDescription(spellId);
    const power = yield* extractor.extractPower(spellId);
    const classOptions = yield* extractor.extractClassOptions(spellId);

    // Icon resolution
    const iconFileDataId = pipe(
      misc,
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

    // Create and return the SpellDataFlat object
    return {
      // Core
      auraDescription: descriptions.auraDescription,
      description: descriptions.description,
      fileName,
      id: Branded.SpellID(spellId),
      name,

      // Timing
      castTime: Option.isSome(castTime) ? castTime.value.base : 0,
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
      coneDegrees: 0, // Option.isSome(cone) ? cone.value.degrees : 0,
      radiusMax: radius.length > 0 ? radius[0].max : 0,
      radiusMin: radius.length > 0 ? radius[0].min : 0,

      // Damage/Defense
      defenseType: Option.isSome(defense) ? defense.value.defenseType : 0,
      schoolMask: Option.isSome(damage) ? damage.value.schoolMask : 0,

      // Scaling
      bonusCoefficientFromAP: scaling.attackPower,
      effectBonusCoefficient: scaling.spellPower,

      // Interrupts
      interruptAura0: 0, // Option.isSome(interrupts) ? interrupts.value.aura[0] : 0,
      interruptAura1: 0, // Option.isSome(interrupts) ? interrupts.value.aura[1] : 0,
      interruptChannel0: 0,
      // Option.isSome(interrupts)
      // ? interrupts.value.channel[0]
      // : 0,
      interruptChannel1: 0,
      // Option.isSome(interrupts)
      // ? interrupts.value.channel[1]
      // : 0,
      interruptFlags: 0, // Option.isSome(interrupts) ? interrupts.value.flags : 0,

      // Duration
      duration: Option.isSome(duration) ? duration.value.duration : 0,
      maxDuration: Option.isSome(duration) ? duration.value.max : 0,

      // Empower
      canEmpower: Option.isSome(empower) ? empower.value.canEmpower : false,
      empowerStages: Option.isSome(empower) ? empower.value.stages : [],

      // Mechanics
      dispelType: Option.isSome(dispel) ? dispel.value.dispelType : 0,
      facingCasterFlags: 0, // Option.isSome(facing) ? facing.value.facingFlags : 0,
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

      // Arrays
      attributes: Option.getOrElse(attributes, () => []),
      effectTriggerSpell: triggers.length > 0 ? triggers : [],
      implicitTarget: targeting.length > 0 ? targeting : [],
    };
  });
