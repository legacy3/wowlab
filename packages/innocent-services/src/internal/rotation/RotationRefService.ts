import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";

export class RotationRefService extends Effect.Service<RotationRefService>()(
  "RotationRefService",
  {
    scoped: Effect.gen(function* () {
      const ref = yield* FiberRef.make<Effect.Effect<
        void,
        unknown,
        unknown
      > | null>(null);

      return {
        get: FiberRef.get(ref),

        set: (rotation: Effect.Effect<void, unknown, unknown>) =>
          FiberRef.set(ref, rotation),
      };
    }),
  },
) {}
