import * as Effect from "effect/Effect";
import * as Data from "effect/Data";
import { DbcCache } from "@wowlab/services/Data";

export class SpellNotFoundError extends Data.TaggedError("SpellNotFoundError")<{
  spellId: number;
}> {}

export const transformSpell = (
  spellId: number,
  cache: DbcCache,
): Effect.Effect<any, SpellNotFoundError> =>
  Effect.gen(function* () {
    const misc = cache.spellMisc.get(spellId);
    if (!misc) {
      return yield* Effect.fail(new SpellNotFoundError({ spellId }));
    }

    const name = cache.spellName.get(spellId);
    const effects = cache.spellEffect.get(spellId) || [];
    const cooldowns = cache.spellCooldowns.get(spellId);
    const castTimes = cache.spellCastTimes.get(misc.CastingTimeIndex);
    const duration = cache.spellDuration.get(misc.DurationIndex);
    const range = cache.spellRange.get(misc.RangeIndex);

    return {
      id: spellId,
      name: name?.Name_lang || "",
      iconName: "",
      castTime: castTimes?.Base || 0,
      cooldown: cooldowns?.RecoveryTime || 0,
      gcd: cooldowns?.CategoryRecoveryTime || 0,
    };
  });
