import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface RNGService {
  readonly nextBoolean: () => Effect.Effect<boolean>;
  readonly nextFloat: () => Effect.Effect<number>;
  readonly nextInt: (min: number, max: number) => Effect.Effect<number>;
}

export const RNGService = Context.GenericTag<RNGService>(
  "@wowlab/services/RNGService",
);
