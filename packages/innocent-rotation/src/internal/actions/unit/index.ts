import * as Branded from "@packages/innocent-schemas/Branded";
import * as Accessors from "@packages/innocent-services/Accessors";
import * as Effect from "effect/Effect";

export class UnitActions extends Effect.Service<UnitActions>()("UnitActions", {
  dependencies: [Accessors.UnitAccessor.Default],
  effect: Effect.gen(function* () {
    const unitAccessor = yield* Accessors.UnitAccessor;

    return {
      all: () => unitAccessor.all(),
      get: (id: string) => unitAccessor.getOrNull(Branded.UnitID(id)),
      player: () =>
        unitAccessor
          .player()
          .pipe(
            Effect.catchAll(() =>
              unitAccessor.getOrNull(Branded.UnitID("player")),
            ),
          ),
    };
  }),
}) {}
