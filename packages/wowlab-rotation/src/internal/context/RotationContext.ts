import * as Effect from "effect/Effect";

import { ControlActions } from "../actions/control/ControlActions.js";
import { SpellActions } from "../actions/spell/SpellActions.js";

/**
 * High-level rotation context that provides all rotation actions.
 */
export class RotationContext extends Effect.Service<RotationContext>()(
  "RotationContext",
  {
    dependencies: [SpellActions.Default, ControlActions.Default],
    effect: Effect.gen(function* () {
      const spell = yield* SpellActions;
      const control = yield* ControlActions;

      return {
        control,
        spell,
      };
    }),
  },
) {}
