import * as Errors from "@packages/innocent-domain/Errors";
import * as Spell from "@packages/innocent-schemas/Spell";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { SpellInfoCache } from "../types";

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
} from "./extractors";

// TODO Redo this entire file and move out of index.ts
export { flattenSpellData } from "./flatten";

// TODO Check if this is still used, I think this is redundant since we have MetadataService now
export const transformSpell = (
  spellId: number,
  cache: SpellInfoCache,
): Effect.Effect<Spell.SpellDataDBC, Errors.SpellInfoNotFound> =>
  Effect.gen(function* () {
    // Check if spell exists
    if (!cache.spellMisc.has(spellId)) {
      return yield* Effect.fail(
        new Errors.SpellInfoNotFound({
          message: `Spell ${spellId} not found in DBC cache`,
          spellId,
        }),
      );
    }

    const misc = first(cache.spellMisc.get(spellId));
    const effects = cache.spellEffect.get(spellId) ?? [];

    // Extract all properties using focused extractor functions
    const range = extractRange(misc, cache);
    const radius = extractRadius(effects, cache);
    const targeting = effects.flatMap((e) => e.ImplicitTarget);
    const damage = pipe(
      misc,
      Option.map((m) => ({ schoolMask: m.SchoolMask })),
    );
    const cooldown = extractCooldown(spellId, cache);
    const interrupts = extractInterrupts(spellId, cache);
    const attributes = pipe(
      misc,
      Option.map((m) => m.Attributes),
    );
    const missile = pipe(
      misc,
      Option.map((m) => ({ speed: m.Speed })),
    );
    const empower = extractEmpower(spellId, cache);
    const cone = pipe(
      first(cache.spellTargetRestrictions.get(spellId)),
      Option.map((t) => ({ degrees: t.ConeDegrees })),
    );
    const castTime = extractCastTime(misc, cache);
    const duration = extractDuration(misc, cache);
    const charges = extractCharges(spellId, cache);
    const defense = pipe(
      first(cache.spellCategories.get(spellId)),
      Option.map((c) => ({ defenseType: c.DefenseType })),
    );
    const scaling = extractScaling(effects);
    const dispel = pipe(
      first(cache.spellCategories.get(spellId)),
      Option.map((c) => ({ dispelType: c.DispelType })),
    );
    const facing = pipe(
      first(cache.spellCastingRequirements.get(spellId)),
      Option.map((r) => ({ facingFlags: r.FacingCasterFlags })),
    );
    const triggers = effects
      .map((e) => e.EffectTriggerSpell)
      .filter((t) => t !== 0);
    const manaCost = extractManaCost(effects);
    const name = extractName(spellId, cache);
    const iconName = pipe(
      misc,
      Option.flatMap((m) =>
        Option.fromNullable(cache.fileData.get(m.SpellIconFileDataID)),
      ),
      Option.map((fileData) => fileData.FileName.replace(".blp", "")),
      Option.getOrElse(() => "inv_misc_questionmark"),
    );

    // Create and return the SpellDataDBC object
    return Spell.createSpellDataDBC({
      attributes: Option.getOrUndefined(attributes),
      castTime: Option.isSome(castTime) ? castTime.value.base : 0,
      charges: Option.getOrUndefined(charges),
      cone: Option.getOrUndefined(cone),
      cooldown: Option.isSome(cooldown) ? cooldown.value.recovery : 0,
      damage: Option.getOrUndefined(damage),
      defense: Option.getOrUndefined(defense),
      dispel: Option.getOrUndefined(dispel),
      duration: Option.getOrUndefined(duration),
      empower: Option.getOrUndefined(empower),
      facing: Option.getOrUndefined(facing),
      iconName,
      id: spellId,
      interrupts: Option.getOrUndefined(interrupts),
      manaCost,
      missile: Option.getOrUndefined(missile),
      name,
      radius: radius.length > 0 ? radius : undefined,
      range: Option.getOrUndefined(range),
      scaling,
      targeting: targeting.length > 0 ? targeting : undefined,
      triggers: triggers.length > 0 ? triggers : undefined,
    });
  });
