import * as Errors from "@packages/innocent-domain/Errors";
import * as Profile from "@packages/innocent-domain/Profile";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

const PYROBLAST_SPELL_ID = Branded.SpellID(11366);
const HOT_STREAK_AURA_ID = Branded.SpellID(48108);

export const HotStreakModifier: Profile.Types.SpellModifierBuilder = (
  runtime,
) => ({
  beforeCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        // Only applies to Pyroblast
        if (spell.info.id !== PYROBLAST_SPELL_ID) {
          return spell;
        }

        const player = yield* runtime.units.player();

        const hasHotStreak = player.auras.all.has(HOT_STREAK_AURA_ID);

        if (hasHotStreak) {
          yield* runtime.log.info(
            "HotStreakModifier",
            "Hot Streak active - making Pyroblast instant!",
            {
              spellId: spell.info.id,
              spellName: spell.info.name,
            },
          );

          // Make instant by setting castTime to 0
          const updatedInfo = spell.info.with({ castTime: 0 });
          return spell.set("info", updatedInfo);
        }

        return spell;
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "hot-streak",
            phase: "beforeCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "hot-streak"),
    ),

  name: "hot-streak",

  onCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        // Only applies to Pyroblast
        if (spell.info.id !== PYROBLAST_SPELL_ID) {
          return;
        }

        const player = yield* runtime.units.player();

        const hasHotStreak = player.auras.all.has(HOT_STREAK_AURA_ID);

        if (hasHotStreak) {
          yield* runtime.log.info(
            "HotStreakModifier",
            "Consuming Hot Streak for instant Pyroblast!",
            {
              spellId: spell.info.id,
              spellName: spell.info.name,
            },
          );

          // Remove Hot Streak aura
          const updatedAuras = player.auras.all.delete(HOT_STREAK_AURA_ID);
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
            modifierName: "hot-streak",
            phase: "onCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "hot-streak"),
    ),
});
