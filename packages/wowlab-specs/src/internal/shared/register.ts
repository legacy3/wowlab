import * as CombatLogService from "@wowlab/services/CombatLog";
import * as Effect from "effect/Effect";

import type { ClassDefinition, SpecDefinition, SpellHandler } from "./types.js";

const withTargetGuard = (handler: SpellHandler): SpellHandler["handler"] =>
  handler.requiresTarget
    ? (event, emitter) =>
        "destGUID" in event &&
        "destName" in event &&
        event.destGUID &&
        event.destName
          ? handler.handler(event, emitter)
          : Effect.void
    : handler.handler;

export const registerSpec = (
  spec: SpecDefinition,
): Effect.Effect<void, never, CombatLogService.CombatLogService> =>
  Effect.gen(function* () {
    const combatLog = yield* CombatLogService.CombatLogService;

    for (const h of spec.handlers) {
      yield* combatLog.on(
        { spellId: h.spellId, subevent: h.subevent },
        withTargetGuard(h),
        { id: h.id, priority: h.priority ?? 10 },
      );
    }
  });

export const registerClass = (
  classDef: ClassDefinition,
): Effect.Effect<void, never, CombatLogService.CombatLogService> =>
  Effect.gen(function* () {
    for (const spec of classDef.specs) {
      yield* registerSpec(spec);
    }
  });

export const registerSpecs = (
  specs: readonly SpecDefinition[],
): Effect.Effect<void, never, CombatLogService.CombatLogService> =>
  Effect.all(specs.map(registerSpec), { discard: true });

export const registerClasses = (
  classes: readonly ClassDefinition[],
): Effect.Effect<void, never, CombatLogService.CombatLogService> =>
  Effect.all(classes.map(registerClass), { discard: true });
