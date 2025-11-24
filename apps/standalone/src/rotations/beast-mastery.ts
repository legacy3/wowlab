/* eslint-disable @typescript-eslint/no-non-null-assertion */

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
  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      // Priority-based APL - evaluates from top on each APL_EVALUATE event
      // NO LOOPS - rotation is re-evaluated by the event system after each cast

      // Priority 1: Bestial Wrath on cooldown
      yield* rotation.spell.cast(playerId, 186254);

      // Priority 2: Barbed Shot to maintain Frenzy
      yield* rotation.spell.cast(playerId, 217200);

      // Priority 3: Kill Command on cooldown
      yield* rotation.spell.cast(playerId, 34026);

      // Priority 4: Cobra Shot as filler
      yield* rotation.spell.cast(playerId, 193455);

      // If nothing can be cast, rotation will be re-evaluated at next event
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
      isPlayer: true,
      name: "Beast Mastery Hunter",
      spells: playerSpells,
    });
  },
  spellIds: [193455, 217200, 34026, 186254], // Cobra Shot, Barbed Shot, Kill Command, Bestial Wrath
};
