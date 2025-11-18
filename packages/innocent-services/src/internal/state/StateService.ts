import * as State from "@packages/innocent-domain/State";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

export class StateService extends Effect.Service<StateService>()(
  "StateService",
  {
    effect: Effect.gen(function* () {
      const ref = yield* Ref.make(State.createGameState());

      return {
        getState: () => Ref.get(ref),
        setState: (state: State.GameState) => Ref.set(ref, state),
        updateState: (fn: (state: State.GameState) => State.GameState) =>
          Ref.update(ref, fn),
      };
    }),
  },
) {}
