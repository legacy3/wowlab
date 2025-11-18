import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Random from "effect/Random";

export class InvalidProcChanceError extends Data.TaggedError(
  "InvalidProcChanceError",
)<{
  readonly chance: number;
}> {}

export class RNGService extends Effect.Service<RNGService>()("RNGService", {
  effect: Effect.succeed({
    roll: (chance: number): Effect.Effect<boolean, InvalidProcChanceError> => {
      if (chance < 0 || chance > 100) {
        return Effect.fail(new InvalidProcChanceError({ chance }));
      }

      if (chance === 0) {
        return Effect.succeed(false);
      }

      if (chance >= 100) {
        return Effect.succeed(true);
      }

      return Random.nextIntBetween(0, 100).pipe(
        Effect.map((roll) => roll < chance),
      );
    },
  }),
}) {}
