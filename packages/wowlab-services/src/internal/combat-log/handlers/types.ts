import type { CombatLog } from "@wowlab/core/Schemas";
import type * as Effect from "effect/Effect";

import type { SimulationConfigService } from "../../config/SimulationConfigService.js";
import type { StateService } from "../../state/StateService.js";
import type { Emitter } from "../Emitter.js";

// TODO For some reason unknown isn't working as a type there
export type StateMutation = readonly [
  subevent: CombatLog.Subevent,
  handler: (
    event: any,
    emitter: Emitter,
  ) => Effect.Effect<void, never, StateService | SimulationConfigService>,
];
