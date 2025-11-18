import * as Profile from "@packages/innocent-domain/Profile";
import * as Effect from "effect/Effect";

import * as Accessors from "@/Accessors";
import * as Combat from "@/Combat";
import * as Log from "@/Log";
import * as Rng from "@/Rng";
import * as State from "@/State";
import * as Unit from "@/Unit";

export const createModifierRuntime = Effect.gen(function* () {
  const unitAccessor = yield* Accessors.UnitAccessor;
  const spellAccessor = yield* Accessors.SpellAccessor;
  const logService = yield* Log.LogService;
  const unitService = yield* Unit.UnitService;
  const stateService = yield* State.StateService;
  const rngService = yield* Rng.RNGService;

  return {
    combat: {
      rollCrit: (unit) => Combat.rollCrit(unit),
    },
    log: {
      debug: (source, message, metadata) =>
        logService.debug(source, message, metadata),
      info: (source, message, metadata) =>
        logService.info(source, message, metadata),
    },
    rng: {
      roll: (chance) =>
        rngService.roll(chance).pipe(Effect.orDieWith((e) => e)),
    },
    spells: {
      get: (unitId, spellId) => spellAccessor.get(unitId, spellId),
      update: (unitId, spell) => spellAccessor.updateSpell(unitId, spell),
    },
    state: {
      currentTime: () =>
        stateService
          .getState()
          .pipe(Effect.map((gameState) => gameState.currentTime)),
    },
    units: {
      player: () => unitAccessor.player(),
      update: (unit) => unitService.update(unit),
    },
  } satisfies Profile.ModifierRuntime;
});
