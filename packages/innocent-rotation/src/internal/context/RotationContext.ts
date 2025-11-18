import type * as Entities from "@packages/innocent-domain/Entities";
import type * as Errors from "@packages/innocent-domain/Errors";

import * as Effect from "effect/Effect";

import * as Actions from "@/Actions";

export interface RotationContextInterface {
  readonly control: Record<string, never>;

  readonly spells: {
    readonly get: (id: number) => Effect.Effect<Entities.Spell>;
    readonly cast: (
      spell: Entities.Spell,
      targetId?: string,
    ) => Effect.Effect<void, Errors.Cast>;
    readonly all: () => Effect.Effect<ReadonlyArray<Entities.Spell>>;
  };

  readonly units: {
    readonly get: (id: string) => Effect.Effect<Entities.Unit>;
    readonly player: () => Effect.Effect<Entities.Unit>;
    readonly all: () => Effect.Effect<ReadonlyArray<Entities.Unit>>;
  };
}

export class RotationContext extends Effect.Service<RotationContext>()(
  "RotationContext",
  {
    dependencies: [
      Actions.UnitActions.Default,
      Actions.SpellActions.Default,
      Actions.ControlActions.Default,
    ],
    effect: Effect.gen(function* () {
      const units = yield* Actions.UnitActions;
      const spells = yield* Actions.SpellActions;
      const control = yield* Actions.ControlActions;

      return { control, spells, units };
    }),
  },
) {}
