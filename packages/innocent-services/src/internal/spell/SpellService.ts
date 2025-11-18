import * as State from "@packages/innocent-domain/State";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";

import * as StateServices from "@/State";

export class SpellService extends Effect.Service<SpellService>()(
  "SpellService",
  {
    dependencies: [StateServices.StateService.Default],
    effect: Effect.gen(function* () {
      const state = yield* StateServices.StateService;

      return {
        recompute: (
          unitId: Branded.UnitID,
          spellId: Branded.SpellID,
          currentTime: number,
        ) =>
          state.updateState((s: State.GameState) => {
            const unit = s.units.get(unitId);
            if (!unit) {
              return s;
            }

            const spell = unit.spells.all.get(spellId);
            if (!spell) {
              return s;
            }

            const recomputed = spell.with({}, currentTime);
            if (spell.equals(recomputed)) {
              return s;
            }

            return s.setIn(
              ["units", unitId, "spells", "all", spellId],
              recomputed,
            );
          }),
      };
    }),
  },
) {}
