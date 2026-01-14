import * as Effect from "effect/Effect";

export class RNGService extends Effect.Service<RNGService>()("RNGService", {
  effect: Effect.succeed({
    nextBoolean: () => Effect.sync(() => Math.random() > 0.5),
    nextFloat: () => Effect.sync(() => Math.random()),
    nextInt: (min: number, max: number) =>
      Effect.sync(() => Math.floor(Math.random() * (max - min + 1)) + min),
  }),
}) {}

export const RNGServiceDefault = RNGService.Default;
