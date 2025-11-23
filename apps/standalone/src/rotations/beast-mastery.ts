import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";
import { Map, Record } from "immutable";

import { RotationDefinition } from "../framework/types.js";

// Helper to create a spell entity from spell data
const createSpellEntity = (
  data: Schemas.Spell.SpellDataFlat,
): Entities.Spell.Spell => {
  const info = Entities.Spell.SpellInfo.create({
    ...data,
    id: Schemas.Branded.SpellID(data.id),
    modifiers: [],
  });

  return Entities.Spell.Spell.create(
    {
      charges: info.maxCharges || 1,
      cooldownExpiry: 0,
      info,
    },
    0,
  );
};

export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery Hunter",
  spellIds: [193455, 217200, 34026, 186254], // Cobra Shot, Barbed Shot, Kill Command, Bestial Wrath
  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      yield* Effect.log("Starting Beast Mastery rotation");

      // Simple rotation: Bestial Wrath -> Barbed Shot -> Kill Command -> Cobra Shot filler
      for (let i = 0; i < 10; i++) {
        // Use Bestial Wrath on cooldown
        const canBestialWrath = yield* rotation.spell.canCast(playerId, 186254);
        if (canBestialWrath) {
          yield* rotation.spell.cast(playerId, 186254);
          yield* rotation.control.wait(500);
        }

        // Use Barbed Shot to maintain Frenzy
        const canBarbedShot = yield* rotation.spell.canCast(playerId, 217200);
        if (canBarbedShot) {
          yield* rotation.spell.cast(playerId, 217200);
          yield* rotation.control.wait(500);
        }

        // Use Kill Command on cooldown
        const canKillCommand = yield* rotation.spell.canCast(playerId, 34026);
        if (canKillCommand) {
          yield* rotation.spell.cast(playerId, 34026);
          yield* rotation.control.wait(500);
        }

        // Cobra Shot as filler
        const canCobraShot = yield* rotation.spell.canCast(playerId, 193455);
        if (canCobraShot) {
          yield* rotation.spell.cast(playerId, 193455);
          yield* rotation.control.wait(500);
        }
      }

      yield* Effect.log("Rotation complete");
    }),
  setupPlayer: (id, spells) => {
    const cobraShot = createSpellEntity(spells.find((s) => s.id === 193455)!);
    const barbedShot = createSpellEntity(spells.find((s) => s.id === 217200)!);
    const killCommand = createSpellEntity(spells.find((s) => s.id === 34026)!);
    const bestialWrath = createSpellEntity(
      spells.find((s) => s.id === 186254)!,
    );

    const playerSpells = {
      all: Map([
        [cobraShot.info.id, cobraShot],
        [barbedShot.info.id, barbedShot],
        [killCommand.info.id, killCommand],
        [bestialWrath.info.id, bestialWrath],
      ]),
      meta: Record({ cooldownCategories: Map<number, number>() })(),
    };

    return Entities.Unit.Unit.create({
      id,
      name: "Beast Mastery Hunter",
      spells: playerSpells,
    });
  },
};
