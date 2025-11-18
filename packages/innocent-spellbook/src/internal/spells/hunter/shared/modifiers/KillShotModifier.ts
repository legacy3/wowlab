import * as Errors from "@packages/innocent-domain/Errors";
import * as Profile from "@packages/innocent-domain/Profile";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

export const DEATHBLOW_AURA_ID = Branded.SpellID(343248);
export const KILL_SHOT_SPELL_ID = Branded.SpellID(53351);

export const KillShotModifier: Profile.Types.SpellModifierBuilder = (
  runtime,
) => ({
  beforeCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        // Only applies to Kill Shot
        if (spell.info.id !== KILL_SHOT_SPELL_ID) {
          return spell;
        }

        const player = yield* runtime.units.player();

        const hasDeathblow = player.auras.all.has(DEATHBLOW_AURA_ID);

        if (hasDeathblow) {
          yield* runtime.log.info(
            "KillShotModifier",
            "Deathblow active - Kill Shot can be used on any target!",
            {
              spellId: spell.info.id,
              spellName: spell.info.name,
            },
          );
        }

        // Note: We're not modifying the spell here because we don't have
        // a health check in the spell casting system yet.
        // In a full implementation, we would remove the health requirement here.

        return spell;
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "kill-shot-deathblow",
            phase: "beforeCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "kill-shot-deathblow"),
    ),

  name: "kill-shot-deathblow",

  onCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        // Only applies to Kill Shot
        if (spell.info.id !== KILL_SHOT_SPELL_ID) {
          return;
        }

        const player = yield* runtime.units.player();

        const hasDeathblow = player.auras.all.has(DEATHBLOW_AURA_ID);

        if (hasDeathblow) {
          yield* runtime.log.info(
            "KillShotModifier",
            "Consuming Deathblow on Kill Shot cast!",
            {
              spellId: spell.info.id,
              spellName: spell.info.name,
            },
          );

          // Remove Deathblow aura (single-use charge)
          const updatedAuras = player.auras.all.delete(DEATHBLOW_AURA_ID);
          yield* runtime.units.update({
            ...player,
            auras: {
              ...player.auras,
              all: updatedAuras,
            },
          });
        }
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "kill-shot-deathblow",
            phase: "onCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "kill-shot-deathblow"),
    ),
});
