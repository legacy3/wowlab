import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

export class RotationRefService extends Effect.Service<RotationRefService>()(
  "RotationRefService",
  {
    effect: Effect.gen(function* () {
      const ref = yield* Ref.make<Effect.Effect<void, unknown, unknown> | null>(
        null,
      );

      return {
        get: Ref.get(ref),
        set: (effect: Effect.Effect<void, unknown, unknown>) =>
          Ref.set(ref, effect),
      };
    }),
  },
) {}
