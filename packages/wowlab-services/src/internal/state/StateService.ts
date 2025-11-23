import * as Entities from "@wowlab/core/Entities";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

export class StateService extends Effect.Service<StateService>()(
  "StateService",
  {
    effect: Effect.gen(function* () {
      const ref = yield* Ref.make(Entities.GameState.createGameState());

      return {
        getState: () => Ref.get(ref),
        setState: (state: Entities.GameState.GameState) => Ref.set(ref, state),
        updateState: (
          fn: (
            state: Entities.GameState.GameState,
          ) => Entities.GameState.GameState,
        ) => Ref.update(ref, fn),
      };
    }),
  },
) {}
