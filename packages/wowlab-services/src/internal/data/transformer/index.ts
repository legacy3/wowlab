import * as Errors from "@wowlab/core/Errors";
import { Branded, Spell } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { DbcCache } from "../DbcCache.js";

import {
  extractCastTime,
  extractCharges,
  extractCooldown,
  extractDuration,
  extractEmpower,
  extractInterrupts,
  extractManaCost,
  extractName,
  extractRadius,
  extractRange,
  extractScaling,
  first,
} from "./extractors.js";

export const transformSpell = (
  spellId: number,
  cache: DbcCache,
): Effect.Effect<Spell.SpellDataFlat, Errors.SpellInfoNotFound> =>
  Effect.gen(function* () {
    const nameStr = cache.spellName.get(spellId);
    if (!nameStr) {
       return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    const misc = Option.fromNullable(cache.spellMisc.get(spellId));
    const effects = cache.spellEffect.get(spellId) ?? [];

    // Extract all properties using focused extractor functions
    const range = extractRange(misc, cache);
    const radius = extractRadius(effects, cache);
    
    // ImplicitTarget is on Effect, so we can extract it.
    const targeting = effects.flatMap((e) => [e.ImplicitTarget_0, e.ImplicitTarget_1].filter(t => t !== 0));
    
    const damage = pipe(
      misc,
      Option.map((m) => ({ schoolMask: m.SchoolMask })),
    );
    const cooldown = extractCooldown(spellId, cache);
    const interrupts = extractInterrupts(spellId, cache);
    const attributes = pipe(
      misc,
      Option.map((m) => [
        m.Attributes_0, m.Attributes_1, m.Attributes_2, m.Attributes_3,
        m.Attributes_4, m.Attributes_5, m.Attributes_6, m.Attributes_7,
        m.Attributes_8, m.Attributes_9, m.Attributes_10, m.Attributes_11,
        m.Attributes_12, m.Attributes_13, m.Attributes_14, m.Attributes_15
      ]),
    );
    
    const missile = pipe(
      misc,
      Option.map((m) => ({ speed: m.Speed })),
    );
    const empower = extractEmpower(spellId, cache);
    
    // Cone relies on SpellTargetRestrictions (missing)
    const cone = Option.none(); 
    /*
    pipe(
      first(cache.spellTargetRestrictions.get(spellId)),
      Option.map((t) => ({ degrees: t.ConeDegrees })),
    );
    */

    const castTime = extractCastTime(misc, cache);
    const duration = extractDuration(misc, cache);
    const charges = extractCharges(spellId, cache);
    
    const defense = pipe(
      Option.fromNullable(cache.spellCategories.get(spellId)),
      Option.map((c) => ({ defenseType: c.DefenseType })),
    );
    const scaling = extractScaling(effects);
    const dispel = pipe(
      Option.fromNullable(cache.spellCategories.get(spellId)),
      Option.map((c) => ({ dispelType: c.DispelType })),
    );
    
    // Facing relies on SpellCastingRequirements (missing)
    const facing = Option.none();
    /*
    pipe(
      first(cache.spellCastingRequirements.get(spellId)),
      Option.map((r) => ({ facingFlags: r.FacingCasterFlags })),
    );
    */
    
    const triggers = effects
      .map((e) => e.EffectTriggerSpell)
      .filter((t) => t !== 0);
    const manaCost = extractManaCost(effects);
    const name = extractName(spellId, cache);
    
    // Icon relies on FileData (missing)
    const iconName = "inv_misc_questionmark";

    // Create and return the SpellDataFlat object
    return {
      // Core
      iconName,
      id: Branded.SpellID(spellId),
      name,

      // Timing
      castTime: Option.isSome(castTime) ? castTime.value.base : 0,
      cooldown: Option.isSome(cooldown) ? cooldown.value.recovery : 0,
      gcd: 1500, // Default GCD

      // Resources
      manaCost,

      // Charges
      maxCharges: Option.isSome(charges) ? charges.value.maxCharges : 0,
      rechargeTime: Option.isSome(charges) ? charges.value.rechargeTime : 0,

      // Range
      rangeAllyMax: Option.isSome(range) ? range.value.ally.max : 0,
      rangeAllyMin: Option.isSome(range) ? range.value.ally.min : 0,
      rangeEnemyMax: Option.isSome(range) ? range.value.enemy.max : 0,
      rangeEnemyMin: Option.isSome(range) ? range.value.enemy.min : 0,

      // Geometry
      coneDegrees: 0, // Option.isSome(cone) ? cone.value.degrees : 0,
      radiusMax: radius.length > 0 ? radius[0].max : 0,
      radiusMin: radius.length > 0 ? radius[0].min : 0,

      // Damage/Defense
      defenseType: Option.isSome(defense) ? defense.value.defenseType : 0,
      schoolMask: Option.isSome(damage) ? damage.value.schoolMask : 0,

      // Scaling
      scalingAttackPower: scaling.attackPower,
      scalingSpellPower: scaling.spellPower,

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
      durationMax: Option.isSome(duration) ? duration.value.max : 0,

      // Empower
      canEmpower: Option.isSome(empower) ? empower.value.canEmpower : false,
      empowerStages: Option.isSome(empower) ? empower.value.stages : [],

      // Mechanics
      dispelType: Option.isSome(dispel) ? dispel.value.dispelType : 0,
      facingFlags: 0, // Option.isSome(facing) ? facing.value.facingFlags : 0,
      missileSpeed: Option.isSome(missile) ? missile.value.speed : 0,

      // Arrays
      attributes: Option.getOrElse(attributes, () => []),
      targeting: targeting.length > 0 ? targeting : [],
      triggers: triggers.length > 0 ? triggers : [],
    };
  });
