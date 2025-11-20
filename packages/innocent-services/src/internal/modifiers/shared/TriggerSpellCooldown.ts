import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Events from "@packages/innocent-domain/Events";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import * as Accessors from "@/Accessors";
import * as Log from "@/Log";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";

export const TriggerSpellCooldown: Entities.Types.SpellModifier = {
  name: "trigger-spell-cooldown",

  onCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        const logService = yield* Log.LogService;

        if (spell.info.cooldown === 0) {
          yield* logService.debug(
            "TriggerSpellCooldown",
            "No cooldown, skipping trigger",
            {
              spellId: spell.info.id,
              spellName: spell.info.name,
            },
          );
          return;
        }

        const state = yield* StateServices.StateService;
        const spellAccessor = yield* Accessors.SpellAccessor;
        const scheduler = yield* Scheduler.EventSchedulerService;

        const currentState = yield* state.getState();
        const currentTime = currentState.currentTime;

        const playerId = Branded.UnitID("player");
        const currentSpell = yield* spellAccessor.get(playerId, spell.info.id);

        const updatedSpell = currentSpell.transform.cooldown.trigger({
          duration: currentSpell.info.cooldown,
          time: currentTime,
        });

        // Update the spell for the player unit
        yield* spellAccessor.updateSpell(playerId, updatedSpell);

        // Schedule cooldown ready event
        const cooldownEndTime = currentTime + spell.info.cooldown;
        const spellId = spell.info.id;

        yield* scheduler.schedule({
          execute: Effect.gen(function* () {
            const currentSpell = yield* spellAccessor.get(playerId, spellId);
            const readySpell = currentSpell.set("isReady", true);
            yield* spellAccessor.updateSpell(playerId, readySpell);
          }),
          id: `cooldown_ready_${spellId}_${currentTime}`,
          payload: {
            spell,
          },
          priority:
            Events.EVENT_PRIORITY[Events.EventType.SPELL_COOLDOWN_READY],
          time: cooldownEndTime,
          type: Events.EventType.SPELL_COOLDOWN_READY,
        });

        yield* logService.debug("TriggerSpellCooldown", "Cooldown triggered", {
          cooldownDuration: spell.info.cooldown,
          readyAt: cooldownEndTime,
          spellId: spell.info.id,
          spellName: spell.info.name,
        });
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "trigger-spell-cooldown",
            phase: "onCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "trigger-spell-cooldown"),
    ),
};
