import * as Effect from "effect/Effect";

export class ControlActions extends Effect.Service<ControlActions>()(
  "ControlActions",
  {
    effect: Effect.succeed({}),
  },
) {}
