/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
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

// TODO Remove this crap and fix it so rotas don't need to return
const tryCast = (
  rotation: Context.RotationContext,
  playerId: Schemas.Branded.UnitID,
  spellId: number,
): Effect.Effect<
  { cast: true; consumedGCD: boolean } | { cast: false },
  Errors.SpellNotFound | Errors.UnitNotFound
> =>
  rotation.spell.cast(playerId, spellId).pipe(
    Effect.map(({ consumedGCD }) => ({ cast: true as const, consumedGCD })),
    Effect.catchTag("SpellOnCooldown", () =>
      Effect.succeed({ cast: false as const }),
    ),
  );

export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery Hunter",
  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      // Priority-based APL - evaluates from top, tries each spell in order
      // Returns after a spell consumes the GCD, continues for off-GCD spells

      // Priority 1: Bestial Wrath on cooldown (off-GCD)
      const bw = yield* tryCast(rotation, playerId, 186254);
      if (bw.cast && bw.consumedGCD) return;

      // Priority 2: Barbed Shot to maintain Frenzy
      const bs = yield* tryCast(rotation, playerId, 217200);
      if (bs.cast && bs.consumedGCD) return;

      // Priority 3: Kill Command on cooldown
      const kc = yield* tryCast(rotation, playerId, 34026);
      if (kc.cast && kc.consumedGCD) return;

      // Priority 4: Cobra Shot as filler (always ready - no cooldown)
      yield* tryCast(rotation, playerId, 193455);
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
