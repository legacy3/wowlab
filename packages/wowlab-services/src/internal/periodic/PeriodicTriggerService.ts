import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class PeriodicTriggerService extends Effect.Service<PeriodicTriggerService>()(
  "PeriodicTriggerService",
  {
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        startPeriodic: (maxDuration: number) =>
          Effect.gen(function* () {
            // TODO: Implement periodic triggers
            yield* Effect.void;
          }),
      };
    }),
  },
) {}
