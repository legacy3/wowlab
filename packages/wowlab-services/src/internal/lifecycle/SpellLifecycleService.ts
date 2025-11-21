import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class SpellLifecycleService extends Effect.Service<SpellLifecycleService>()(
  "SpellLifecycleService",
  {
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        startCast: (spellId: number) =>
          Effect.gen(function* () {
            // TODO: Implement spell cast start logic
            yield* Effect.void;
          }),
      };
    }),
  },
) {}
