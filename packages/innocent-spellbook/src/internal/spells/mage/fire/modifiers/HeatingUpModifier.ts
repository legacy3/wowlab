import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Profile from "@packages/innocent-domain/Profile";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

export const HeatingUpModifier: Profile.Types.SpellModifierBuilder = (
  runtime,
) => ({
  name: "heating-up",

  onDamage: (spell, _damage) =>
    pipe(
      Effect.gen(function* () {
        // Only fire spells
        if ((spell.info.schoolMask & 0x04) === 0) {
          return;
        }

        const player = yield* runtime.units.player();
        const isCrit = runtime.combat.rollCrit(player);

        const hasHeatingUp = player.auras.all.has(Branded.SpellID(48107));
        const hasHotStreak = player.auras.all.has(Branded.SpellID(48108));

        if (isCrit) {
          if (hasHeatingUp && !hasHotStreak) {
            // Heating Up + Crit = Hot Streak
            yield* runtime.log.info(
              "HeatingUpModifier",
              "Crit with Heating Up → Hot Streak!",
              {
                spellId: spell.info.id,
                spellName: spell.info.name,
              },
            );

            // Remove Heating Up
            const updatedAuras = player.auras.all.delete(
              Branded.SpellID(48107),
            );

            // Add Hot Streak
            const hotStreakSpell = yield* runtime.spells.get(
              player.id,
              Branded.SpellID(48108),
            );
            const currentTime = yield* runtime.state.currentTime();
            const hotStreakAura = Entities.Aura.create(
              {
                casterUnitId: player.id,
                expiresAt: currentTime + 15000,
                info: hotStreakSpell.info,
                stacks: 1,
              },
              currentTime,
            );

            const withHotStreak = updatedAuras.set(
              Branded.SpellID(48108),
              hotStreakAura,
            );

            yield* runtime.units.update({
              ...player,
              auras: {
                ...player.auras,
                all: withHotStreak,
              },
            });
          } else if (!hasHeatingUp && !hasHotStreak) {
            // First crit → Heating Up
            yield* runtime.log.info(
              "HeatingUpModifier",
              "First crit → Heating Up!",
              {
                spellId: spell.info.id,
                spellName: spell.info.name,
              },
            );

            const heatingUpSpell = yield* runtime.spells.get(
              player.id,
              Branded.SpellID(48107),
            );
            const currentTime = yield* runtime.state.currentTime();
            const heatingUpAura = Entities.Aura.create(
              {
                casterUnitId: player.id,
                expiresAt: currentTime + 10000,
                info: heatingUpSpell.info,
                stacks: 1,
              },
              currentTime,
            );

            const updatedAuras = player.auras.all.set(
              Branded.SpellID(48107),
              heatingUpAura,
            );

            yield* runtime.units.update({
              ...player,
              auras: {
                ...player.auras,
                all: updatedAuras,
              },
            });
          }
        } else {
          // Non-crit removes Heating Up
          if (hasHeatingUp) {
            yield* runtime.log.info(
              "HeatingUpModifier",
              "Non-crit → remove Heating Up",
              {
                spellId: spell.info.id,
                spellName: spell.info.name,
              },
            );

            const updatedAuras = player.auras.all.delete(
              Branded.SpellID(48107),
            );

            yield* runtime.units.update({
              ...player,
              auras: {
                ...player.auras,
                all: updatedAuras,
              },
            });
          }
        }
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "heating-up",
            phase: "onDamage",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "heating-up"),
    ),
});
