import { Entities, Errors, Events, Schemas } from "@wowlab/core";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import { SpellLifecycleService } from "../lifecycle/SpellLifecycleService.js";
import { LogService } from "../log/LogService.js";
import { EventSchedulerService } from "../scheduler/EventSchedulerService.js";
import { StateService } from "../state/StateService.js";

const validateCast = Effect.fn("CastQueueService.validateCast")(function* (
  spell: Entities.Spell.Spell,
  player: Entities.Unit.Unit,
  currentTime: number,
) {
  // Check if player is casting
  if (player.isCasting && player.castingSpellId !== null) {
    const castingSpell = player.spells.all.get(player.castingSpellId) ?? spell;
    return yield* Effect.fail(
      new Errors.PlayerIsCasting({
        castEndsAt: currentTime + player.castRemaining,
        castingSpell,
        spell,
      }),
    );
  }

  // Check spell cooldown
  if (!spell.isReady) {
    return yield* Effect.fail(
      new Errors.SpellOnCooldown({
        remainingCooldown: spell.cooldownExpiry - currentTime,
        spell,
      }),
    );
  }

  // Check charges (for spells with charge system)
  if (spell.info.maxCharges > 0 && spell.charges === 0) {
    return yield* Effect.fail(
      new Errors.NoChargesAvailable({
        spell,
      }),
    );
  }

  // Check GCD
  const gcdCategory = 133;
  const gcdExpiry =
    player.spells.meta.get("cooldownCategories").get(gcdCategory) ?? 0;
  if (gcdExpiry > currentTime) {
    return yield* Effect.fail(
      new Errors.GCDActive({
        currentTime,
        gcdEndsAt: gcdExpiry,
        spell,
      }),
    );
  }
});

const applyImmediateEffects = (
  spell: Entities.Spell.Spell,
  player: Entities.Unit.Unit,
  currentTime: number,
): Entities.Unit.Unit => {
  const gcd = 1500;
  const gcdCategory = 133;
  const triggersGcd = (spell.info.interruptFlags & 0x08) === 0;

  const newGcdExpiry = triggersGcd ? currentTime + gcd : currentTime;

  const updatedCooldownCategories = triggersGcd
    ? player.spells.meta
        .get("cooldownCategories")
        .set(gcdCategory, newGcdExpiry)
    : player.spells.meta.get("cooldownCategories");

  let updatedSpell = spell;

  // Consume a charge if spell has charges
  if (spell.info.maxCharges > 0 && spell.charges > 0) {
    updatedSpell = spell.transform.charges.decrement({
      amount: 1,
      time: currentTime,
    });
  }

  // Set cooldown if spell has a recovery time
  if (spell.info.recoveryTime > 0) {
    const cooldownExpiry = currentTime + spell.info.recoveryTime;

    updatedSpell = updatedSpell.transform.cooldown.set({
      time: currentTime,
      value: cooldownExpiry,
    });
  }

  return Entities.Unit.Unit.create({
    ...player.toObject(),
    isCasting: spell.info.castTime > 0,
    spells: {
      all: player.spells.all.set(spell.info.id, updatedSpell),
      meta: player.spells.meta.set(
        "cooldownCategories",
        updatedCooldownCategories,
      ),
    },
  });
};

export class CastQueueService extends Effect.Service<CastQueueService>()(
  "CastQueueService",
  {
    dependencies: [
      SpellLifecycleService.Default,
      EventSchedulerService.Default,
      StateService.Default,
      LogService.Default,
    ],
    effect: Effect.gen(function* () {
      const lifecycle = yield* SpellLifecycleService;
      const scheduler = yield* EventSchedulerService;
      const state = yield* StateService;
      const logService = yield* LogService;
      const logger = yield* logService.withName("CastQueueService");

      return {
        enqueue: (
          spell: Entities.Spell.Spell,
          targetId: Schemas.Branded.UnitID = Schemas.Branded.UnitID("enemy-1"),
        ) =>
          Effect.gen(function* () {
            const currentState = yield* state.getState();

            yield* logger.debug(`Enqueueing ${spell.info.name}`);

            // Find player unit (first unit marked as player)
            const player = currentState.units
              .valueSeq()
              .find((u) => u.isPlayer);

            if (!player) {
              yield* logger.error(
                `No player found! Available units: ${currentState.units.keySeq().toArray()}`,
              );

              return yield* Effect.fail(new Error("Player unit not found"));
            }

            // Get the current spell from player state (not the stale spell parameter)
            const currentSpell = player.spells.all.get(spell.info.id) ?? spell;

            // Apply beforeCast modifiers (can transform spell, e.g., make it instant)
            const modifiedSpell = yield* lifecycle.executeBeforeCast(
              currentSpell,
              player.id,
            );

            // Validate cast with modified spell (typed errors)
            const validationResult = yield* validateCast(
              modifiedSpell,
              player,
              currentState.currentTime,
            ).pipe(
              Effect.tapError((error) => {
                const errorMsg =
                  typeof error === "object" && error !== null && "_tag" in error
                    ? error._tag
                    : String(error);

                return logger.debug(
                  `${spell.info.name} validation failed: ${errorMsg}`,
                );
              }),
              Effect.either,
            );

            if (validationResult._tag === "Left") {
              return;
            }

            // Apply immediate state changes
            const updatedPlayer = applyImmediateEffects(
              modifiedSpell,
              player,
              currentState.currentTime,
            );

            yield* state.updateState((s) =>
              s.set("units", s.units.set(player.id, updatedPlayer)),
            );

            // Schedule events
            const castTime = modifiedSpell.info.castTime || 0;
            const gcd = 1500;
            const startTime = currentState.currentTime;
            const triggersGcd =
              (modifiedSpell.info.interruptFlags & 0x08) === 0;

            yield* scheduler.schedule({
              execute: Effect.void,
              id: Schemas.Branded.EventID(
                `cast_start_${modifiedSpell.info.id}_${startTime}`,
              ),
              payload: { spell: modifiedSpell, targetId },
              priority:
                Events.EVENT_PRIORITY[Events.EventType.SPELL_CAST_START],
              time: startTime,
              type: Events.EventType.SPELL_CAST_START,
            });

            // Schedule SPELL_CAST_COMPLETE event
            const completeTime = startTime + castTime;
            yield* scheduler.schedule({
              execute: pipe(
                lifecycle.executeOnCast(modifiedSpell, player.id),
                Effect.timeout("10 seconds"),
                Effect.catchAll((error) =>
                  logger.error(`Modifier execution failed: ${error}`),
                ),
                Effect.asVoid,
              ),
              id: Schemas.Branded.EventID(
                `cast_complete_${modifiedSpell.info.id}_${startTime}`,
              ),
              payload: { spell: modifiedSpell, targetId },
              priority:
                Events.EVENT_PRIORITY[Events.EventType.SPELL_CAST_COMPLETE],
              time: completeTime,
              type: Events.EventType.SPELL_CAST_COMPLETE,
            });

            yield* logger.info(
              `Cast ${modifiedSpell.info.name} at ${currentState.currentTime}ms`,
            );

            // Schedule cooldown ready event if spell has a cooldown
            if (modifiedSpell.info.recoveryTime > 0) {
              const cooldownReadyTime =
                startTime + modifiedSpell.info.recoveryTime;

              yield* scheduler.scheduleInput({
                at: cooldownReadyTime,
                spell: modifiedSpell,
                type: Events.EventType.SPELL_COOLDOWN_READY,
              });
            }

            // Schedule charge ready event if spell has charges and consumed one
            if (
              modifiedSpell.info.maxCharges > 0 &&
              modifiedSpell.charges > 0
            ) {
              const chargeReadyTime =
                startTime + modifiedSpell.info.chargeRecoveryTime;

              yield* scheduler.scheduleInput({
                at: chargeReadyTime,
                spell: modifiedSpell,
                type: Events.EventType.SPELL_CHARGE_READY,
              });
            }

            // Schedule next APL and interrupt rotation fiber
            const gcdExpiry = triggersGcd ? startTime + gcd : startTime;
            return yield* scheduler.scheduleNextAPL({
              castComplete: completeTime,
              gcdExpiry,
            });
          }).pipe(
            Effect.mapError((err) => {
              const reason =
                typeof err === "object" && err !== null && "_tag" in err
                  ? (err._tag as string)
                  : String(err);

              return new Errors.Cast({
                caster: undefined,
                reason,
                spell,
              });
            }),
          ),
      };
    }),
  },
) {}
