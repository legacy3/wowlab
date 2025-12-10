import type { CombatLog } from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";

import type { CombatLogService } from "../CombatLogService.js";
import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { AURA_MUTATIONS } from "./aura.js";
import { CAST_MUTATIONS } from "./cast.js";
import { DAMAGE_MUTATIONS } from "./damage.js";
import { HEAL_MUTATIONS } from "./heal.js";
import { PERIODIC_MUTATIONS } from "./periodic.js";
import { POWER_MUTATIONS } from "./power.js";
import { UNIT_MUTATIONS } from "./unit.js";

// TODO Not sure about this, its basically so these mutations always run last but feels bad
const STATE_MUTATION_PRIORITY = 1000;

// Note: PERIODIC_MUTATIONS handles tick rescheduling and runs at same priority
// as other state mutations. The damage/heal handlers apply the actual effect.
const ALL_MUTATIONS: readonly StateMutation[] = [
  ...AURA_MUTATIONS,
  ...DAMAGE_MUTATIONS,
  ...HEAL_MUTATIONS,
  ...PERIODIC_MUTATIONS,
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
        (event: CombatLog.CombatLogEvent, emitter: Emitter) =>
          handler(event, emitter),
        { id: `state:${subevent}`, priority: STATE_MUTATION_PRIORITY },
      );
    }
  });

export type { StateMutation } from "./types.js";
