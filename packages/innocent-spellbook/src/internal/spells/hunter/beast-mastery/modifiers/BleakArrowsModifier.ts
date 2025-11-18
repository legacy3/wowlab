import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Profile from "@packages/innocent-domain/Profile";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

// Deathblow aura definition (inline per user request)
export const DEATHBLOW_AURA_ID = Branded.SpellID(343248);
export const KILL_SHOT_SPELL_ID = Branded.SpellID(53351);

const DEATHBLOW_AURA_PROPS = {
  duration: 15000, // 15 seconds
  maxStacks: 1,
  name: "Deathblow",
};

export const BleakArrowsModifier: Profile.Types.SpellModifierBuilder = (
  runtime,
) => ({
  name: "bleak-arrows",

  onHit: (spell) =>
    pipe(
      Effect.gen(function* () {
        const player = yield* runtime.units.player();

        let procChance = 0;

        if (player.paperDoll.class === "Hunter") {
          procChance = 20;
        }

        if (procChance === 0) {
          return;
        }

        const procced = yield* runtime.rng.roll(procChance);

        if (!procced) {
          return;
        }

        yield* runtime.log.info(
          "BleakArrowsModifier",
          "Bleak Arrows procced! Granting Deathblow.",
          {
            procChance,
            unitId: player.id,
          },
        );

        const deathblowSpellInfo = Entities.SpellInfo.create({
          duration: DEATHBLOW_AURA_PROPS.duration,
          durationMax: DEATHBLOW_AURA_PROPS.maxStacks,
          id: DEATHBLOW_AURA_ID,
          name: DEATHBLOW_AURA_PROPS.name,
        });

        const currentTime = yield* runtime.state.currentTime();

        const deathblowAura = Entities.Aura.create(
          {
            casterUnitId: player.id,
            expiresAt: currentTime + DEATHBLOW_AURA_PROPS.duration,
            info: deathblowSpellInfo,
            stacks: 1,
          },
          currentTime,
        );

        const updatedAuras = player.auras.all.set(
          DEATHBLOW_AURA_ID,
          deathblowAura,
        );
        yield* runtime.units.update({
          ...player,
          auras: {
            ...player.auras,
            all: updatedAuras,
          },
        });

        const killShotSpell = yield* runtime.spells.get(
          player.id,
          KILL_SHOT_SPELL_ID,
        );

        if (killShotSpell) {
          const resetSpell = killShotSpell.set("cooldownExpiry", 0);
          yield* runtime.spells.update(player.id, resetSpell);

          yield* runtime.log.info(
            "BleakArrowsModifier",
            "Kill Shot cooldown reset!",
            {
              spellId: KILL_SHOT_SPELL_ID,
              unitId: player.id,
            },
          );
        }
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "bleak-arrows",
            phase: "onHit",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "bleak-arrows"),
    ),
});
