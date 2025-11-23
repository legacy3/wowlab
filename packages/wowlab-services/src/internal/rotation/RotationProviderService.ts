import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";

/**
 * Service that provides the current rotation effect for APL evaluation.
 * Set once per simulation run by SimulationService.
 */
export class RotationProviderService extends Effect.Service<RotationProviderService>()(
  "RotationProviderService",
  {
    effect: Effect.gen(function* () {
      const rotationRef = yield* Ref.make<Option.Option<Effect.Effect<void>>>(
        Option.none(),
      );

      return {
        clear: () => Ref.set(rotationRef, Option.none()),

        get: () => Ref.get(rotationRef),

        set: (rotation: Effect.Effect<void>) =>
          Ref.set(rotationRef, Option.some(rotation)),
      };
    }),
  },
) {}
