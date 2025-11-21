import * as Entities from "@wowlab/core/Entities";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";

import { StateService } from "./StateService.js";

export const StateServiceLive = Layer.effect(
  StateService,
  Effect.gen(function* () {
    const ref = yield* Ref.make(Entities.GameState.createGameState());

    return StateService.of({
      getState: Ref.get(ref),
      setState: (state) => Ref.set(ref, state),
      updateState: (fn) => Ref.update(ref, fn),
    });
  }),
);
