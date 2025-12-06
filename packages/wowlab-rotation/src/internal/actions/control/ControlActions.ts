import * as Effect from "effect/Effect";

import * as State from "@wowlab/services/State";

export class ControlActions extends Effect.Service<ControlActions>()(
  "ControlActions",
  {
    effect: Effect.gen(function* () {
      const state = yield* State.StateService;

      return {
        wait: (durationMs: number) =>
          Effect.gen(function* () {
            const currentState = yield* state.getState();
            const newTime = currentState.currentTime + durationMs;

            yield* state.updateState((s) => s.set("currentTime", newTime));
          }),

        waitUntil: (condition: Effect.Effect<boolean>) =>
          Effect.gen(function* () {
            while (true) {
              const result = yield* condition;
              if (result) {
                break;
              }
              yield* Effect.sleep("100 millis");
            }
          }),
      };
    }),
  },
) {}
