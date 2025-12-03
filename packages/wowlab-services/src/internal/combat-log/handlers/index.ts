import type { CombatLog } from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";

import type { CombatLogService } from "../CombatLogService.js";
import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { AURA_MUTATIONS } from "./aura.js";
import { CAST_MUTATIONS } from "./cast.js";
import { DAMAGE_MUTATIONS } from "./damage.js";
import { HEAL_MUTATIONS } from "./heal.js";
import { POWER_MUTATIONS } from "./power.js";
import { UNIT_MUTATIONS } from "./unit.js";

// TODO Not sure about this, its basically so these mutations always run last but feels bad
const STATE_MUTATION_PRIORITY = 1000;

const ALL_MUTATIONS: readonly StateMutation[] = [
  ...AURA_MUTATIONS,
  ...DAMAGE_MUTATIONS,
  ...HEAL_MUTATIONS,
  ...POWER_MUTATIONS,
  ...UNIT_MUTATIONS,
  ...CAST_MUTATIONS,
];

export const registerStateMutationHandlers = (
  combatLog: CombatLogService,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    for (const [subevent, handler] of ALL_MUTATIONS) {
      yield* combatLog.on(
        { subevent },
        (event: CombatLog.CombatLogEvent, _: Emitter) => handler(event),
        { id: `state:${subevent}`, priority: STATE_MUTATION_PRIORITY },
      );
    }

    yield* Effect.logDebug(
      `Registered ${ALL_MUTATIONS.length} state mutation handlers`,
    );
  });

export type { StateMutation } from "./types.js";
