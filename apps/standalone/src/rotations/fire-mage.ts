import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";
import { Map, Record } from "immutable";

import { mockSpells } from "../data/spells.js";
import { RotationDefinition } from "../framework/types.js";

// Helper to create a spell entity from mock data
const createSpellEntity = (
  data: Schemas.Spell.SpellDataFlat,
): Entities.Spell.Spell => {
  const info = Record({
    ...data,
    id: Schemas.Branded.SpellID(data.id),
    maxCharges: 1, // Default for now
  } as any)();

  return Entities.Spell.Spell.create(
    {
      charges: 1,
      cooldownExpiry: 0,
      info,
    },
    0,
  );
};

export const FireMageRotation: RotationDefinition = {
  name: "Fire Mage Simple",
  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      yield* Effect.log("Starting Fire Mage rotation");

      // Simple rotation: Fire Blast -> Scorch
      for (let i = 0; i < 5; i++) {
        // Cast Fire Blast if available
        const canFireBlast = yield* rotation.spell.canCast(playerId, 108853);
        if (canFireBlast) {
          yield* rotation.spell.cast(playerId, 108853);
        }

        // Wait for GCD
        yield* rotation.control.wait(1500);

        // Cast Scorch
        const canScorch = yield* rotation.spell.canCast(playerId, 2948);
        if (canScorch) {
          yield* rotation.spell.cast(playerId, 2948);
        }

        // Wait for cast
        yield* rotation.control.wait(1500);
      }

      yield* Effect.log("Rotation complete");
    }),
  setupPlayer: (id) => {
    const fireBlast = createSpellEntity(mockSpells[0]);
    const scorch = createSpellEntity(mockSpells[1]);

    const playerSpells = {
      all: Map([
        [fireBlast.info.id, fireBlast],
        [scorch.info.id, scorch],
      ]),
      meta: Record({ cooldownCategories: Map() })(),
    };

    return Entities.Unit.Unit.create({
      id,
      name: "Fire Mage",
      spells: playerSpells,
    });
  },
  spells: mockSpells,
};
