import * as Entities from "@wowlab/core/Entities";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface StateService {
  readonly getState: Effect.Effect<Entities.GameState.GameState>;
  readonly setState: (
    state: Entities.GameState.GameState,
  ) => Effect.Effect<void>;
  readonly updateState: (
    f: (state: Entities.GameState.GameState) => Entities.GameState.GameState,
  ) => Effect.Effect<void>;
}

export const StateService = Context.GenericTag<StateService>(
  "@wowlab/services/StateService",
);
