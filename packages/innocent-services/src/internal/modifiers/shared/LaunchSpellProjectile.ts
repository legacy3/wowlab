import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Events from "@packages/innocent-domain/Events";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import * as Accessors from "@/Accessors";
import * as Combat from "@/Combat";
import * as Lifecycle from "@/Lifecycle";
import * as Log from "@/Log";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";

export const LaunchSpellProjectile: Entities.SpellModifier = {
  name: "launch-spell-projectile",

  onCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        const scheduler = yield* Scheduler.EventSchedulerService;
        const state = yield* StateServices.StateService;
        const unitAccessor = yield* Accessors.UnitAccessor;
        const lifecycle = yield* Lifecycle.SpellLifecycleService;
        const logService = yield* Log.LogService;

        const currentState = yield* state.getState();
        const currentTime = currentState.currentTime;
        const caster = yield* unitAccessor.player();

        const damage = Combat.calculateBaseDamage(spell, caster);
        const travelTime = 1000; // TODO: Calculate from spell range

        yield* scheduler.schedule({
          execute: Effect.gen(function* () {
            const innerLogService = yield* Log.LogService;
            yield* innerLogService.info(
              "LaunchSpellProjectile",
              "Spell damage",
              {
                damage,
                spellId: spell.info.id,
                spellName: spell.info.name,
              },
            );
            yield* lifecycle.executeOnDamage(spell, damage);
          }),
          id: `spell_damage_${spell.info.id}_${currentTime}`,
          payload: { damage, spell },
          priority: Events.EVENT_PRIORITY[Events.EventType.SPELL_DAMAGE],
          time: currentTime + travelTime,
          type: Events.EventType.SPELL_DAMAGE,
        });

        yield* logService.debug(
          "LaunchSpellProjectile",
          "Scheduled SPELL_DAMAGE event",
          {
            scheduledTime: currentTime + travelTime,
            spellId: spell.info.id,
            spellName: spell.info.name,
            travelTime,
          },
        );
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "launch-spell-projectile",
            phase: "onCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "launch-spell-projectile"),
    ),
};
