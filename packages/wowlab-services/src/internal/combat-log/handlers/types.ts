import type { CombatLog } from "@wowlab/core/Schemas";
import type * as Effect from "effect/Effect";

import type { StateService } from "../../state/StateService.js";

// TODO For some reason unknown isn'y working as a type there
export type StateMutation = readonly [
  subevent: CombatLog.Subevent,
  handler: (event: any) => Effect.Effect<void, never, StateService>,
];
