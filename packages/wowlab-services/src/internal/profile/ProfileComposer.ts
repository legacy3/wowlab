import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";

export interface ComposedProfile {
  readonly bundles: ReadonlyArray<unknown>;
  readonly signature: string;
}

// Profile composition service
export class ProfileComposer extends Effect.Service<ProfileComposer>()(
  "ProfileComposer",
  {
    effect: Effect.gen(function* () {
      const cacheRef = yield* Ref.make(new Map<string, ComposedProfile>());

      const compose = (profileIds: ReadonlyArray<string>) =>
        Effect.gen(function* () {
          const signature = profileIds.join(",");
          const cache = yield* Ref.get(cacheRef);
          const cached = cache.get(signature);

          if (cached) return cached;

          // TODO: Load and compose profiles
          const composed: ComposedProfile = { bundles: [], signature };

          yield* Ref.update(cacheRef, (prev) => {
            const next = new Map(prev);
            next.set(signature, composed);
            return next;
          });

          return composed;
        });

      return {
        compose,
      };
    }),
  },
) {}
