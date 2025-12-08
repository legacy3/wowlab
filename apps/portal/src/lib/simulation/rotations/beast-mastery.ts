import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";

import { tryCast } from "../rotation-utils";
import type { RotationDefinition } from "../types";

const SpellIds = {
  BARBED_SHOT: 217200,
  BESTIAL_WRATH: 19574,
  BLOODSHED: 321530,
  CALL_OF_THE_WILD: 359844,
  COBRA_SHOT: 193455,
  EXPLOSIVE_SHOT: 212431,
  KILL_COMMAND: 34026,
  KILL_SHOT: 53351,
  MULTI_SHOT: 2643,
} as const;

export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery Hunter",

  run: (playerId) =>
    Effect.gen(function* () {
      const rotation = yield* Context.RotationContext;

      const bw = yield* tryCast(rotation, playerId, SpellIds.BESTIAL_WRATH);
      if (bw.cast && bw.consumedGCD) {
        return;
      }

      const cotw = yield* tryCast(
        rotation,
        playerId,
        SpellIds.CALL_OF_THE_WILD,
      );
      if (cotw.cast && cotw.consumedGCD) {
        return;
      }

      const bs = yield* tryCast(rotation, playerId, SpellIds.BARBED_SHOT);
      if (bs.cast && bs.consumedGCD) {
        return;
      }

      const bloodshed = yield* tryCast(rotation, playerId, SpellIds.BLOODSHED);
      if (bloodshed.cast && bloodshed.consumedGCD) {
        return;
      }

      const ks = yield* tryCast(rotation, playerId, SpellIds.KILL_SHOT);
      if (ks.cast && ks.consumedGCD) {
        return;
      }

      const kc = yield* tryCast(rotation, playerId, SpellIds.KILL_COMMAND);
      if (kc.cast && kc.consumedGCD) {
        return;
      }

      const es = yield* tryCast(rotation, playerId, SpellIds.EXPLOSIVE_SHOT);
      if (es.cast && es.consumedGCD) {
        return;
      }

      yield* tryCast(rotation, playerId, SpellIds.COBRA_SHOT);
    }),

  spellIds: [
    SpellIds.COBRA_SHOT,
    SpellIds.BARBED_SHOT,
    SpellIds.KILL_COMMAND,
    SpellIds.MULTI_SHOT,
    SpellIds.BESTIAL_WRATH,
    SpellIds.CALL_OF_THE_WILD,
    SpellIds.BLOODSHED,
    SpellIds.KILL_SHOT,
    SpellIds.EXPLOSIVE_SHOT,
  ],
};
