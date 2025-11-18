import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Events from "@packages/innocent-domain/Events";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import * as Accessors from "@/Accessors";
import * as Lifecycle from "@/Lifecycle";
import * as Log from "@/Log";
import * as Rotation from "@/Rotation";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";
import * as Unit from "@/Unit";

const validateCast = Effect.fn("CastQueueService.validateCast")(function* (
  spell: Entities.Spell,
  player: Entities.Unit,
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
  const gcdExpiry = player.spells.meta.cooldownCategories.get(gcdCategory) ?? 0;
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
  spell: Entities.Spell,
  player: Entities.Unit,
  currentTime: number,
): Entities.Unit => {
  const gcd = 1500;
  const gcdCategory = 133;
  const triggersGcd = (spell.info.interruptFlags & 0x08) === 0;

  const newGcdExpiry = triggersGcd ? currentTime + gcd : currentTime;

  const updatedCooldownCategories = triggersGcd
    ? player.spells.meta.cooldownCategories.set(gcdCategory, newGcdExpiry)
    : player.spells.meta.cooldownCategories;

  // Consume a charge if spell has charges
  let updatedSpell = spell;
  if (spell.info.maxCharges > 0 && spell.charges > 0) {
    updatedSpell = spell.transform.charges.decrement({
      amount: 1,
      time: currentTime,
    });
  }

  return {
    ...player,
    isCasting: spell.info.castTime > 0,
    spells: {
      ...player.spells,
      all: player.spells.all.set(spell.info.id, updatedSpell),
      meta: {
        ...player.spells.meta,
        cooldownCategories: updatedCooldownCategories,
      },
    },
  };
};

export class CastQueueService extends Effect.Service<CastQueueService>()(
  "CastQueueService",
  {
    dependencies: [
      Lifecycle.SpellLifecycleService.Default,
      Scheduler.EventSchedulerService.Default,
      StateServices.StateService.Default,
      Accessors.UnitAccessor.Default,
      Unit.UnitService.Default,
      Rotation.RotationRefService.Default,
      Log.LogService.Default,
    ],
    effect: Effect.gen(function* () {
      const lifecycle = yield* Lifecycle.SpellLifecycleService;
      const scheduler = yield* Scheduler.EventSchedulerService;
      const state = yield* StateServices.StateService;
      const unitAccessor = yield* Accessors.UnitAccessor;
      const unitService = yield* Unit.UnitService;
      const rotationRef = yield* Rotation.RotationRefService;
      const logService = yield* Log.LogService;

      return {
        enqueue: (
          spell: Entities.Spell,
          targetId: Branded.UnitID = Branded.UnitID("enemy-1"),
        ) =>
          Effect.gen(function* () {
            const currentState = yield* state.getState();

            yield* logService.info(
              "CastQueue",
              `Enqueueing ${spell.info.name}`,
              {
                spellId: spell.info.id,
                spellName: spell.info.name,
                stateId: currentState.stateId,
                targetId,
              },
            );
            const player = yield* unitAccessor.player();

            // Get the current spell from player state (not the stale spell parameter)
            const currentSpell = player.spells.all.get(spell.info.id) ?? spell;

            // Apply beforeCast modifiers (can transform spell, e.g., make it instant)
            const modifiedSpell =
              yield* lifecycle.executeBeforeCast(currentSpell);

            // Validate cast with modified spell (typed errors)
            // If validation fails, log and return void (boundary - don't propagate to rotation)
            const validationResult = yield* validateCast(
              modifiedSpell,
              player,
              currentState.currentTime,
            ).pipe(
              Effect.tapError((error) =>
                logService.debug(
                  "CastQueue",
                  `Validation failed: ${error._tag}`,
                  {
                    errorType: error._tag,
                    spellId: modifiedSpell.info.id,
                    spellName: modifiedSpell.info.name,
                  },
                ),
              ),
              Effect.either, // Convert to Either to handle errors without propagating
            );

            // If validation failed, return early (rotation continues to next spell)
            // Note: We don't schedule APL re-evaluation here because we want the rotation
            // to try all spells in priority order. The periodic APL fallback in SimulationService
            // will handle rescheduling if all spells fail.
            if (validationResult._tag === "Left") {
              return;
            }

            // Apply immediate state changes
            const updatedPlayer = applyImmediateEffects(
              modifiedSpell,
              player,
              currentState.currentTime,
            );

            yield* unitService.update(updatedPlayer);

            // Schedule events
            const castTime = modifiedSpell.info.castTime || 0;
            const gcd = 1500;
            const startTime = currentState.currentTime;
            const triggersGcd =
              (modifiedSpell.info.interruptFlags & 0x08) === 0;

            yield* scheduler.schedule({
              execute: Effect.void, // No logic, just marker event
              id: `cast_start_${modifiedSpell.info.id}_${startTime}`,
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
                lifecycle.executeOnCast(modifiedSpell),
                Effect.timeout("10 seconds"),
                Effect.catchTag("Modifier", (error) =>
                  logService.error(
                    "CastQueue",
                    `Modifier ${error.modifierName} failed: ${error.reason}`,
                    {
                      modifierName: error.modifierName,
                      reason: error.reason,
                      spellId: modifiedSpell.info.id,
                    },
                  ),
                ),
              ),
              id: `cast_complete_${modifiedSpell.info.id}_${startTime}`,
              payload: { spell: modifiedSpell, targetId },
              priority:
                Events.EVENT_PRIORITY[Events.EventType.SPELL_CAST_COMPLETE],
              time: completeTime,
              type: Events.EventType.SPELL_CAST_COMPLETE,
            });

            // Schedule APL re-evaluation when cast completes AND GCD expires
            // Use Math.max to ensure rotation doesn't re-evaluate while spell is still casting
            // Priority system ensures SPELL_CAST_COMPLETE (priority 100) runs before APL_EVALUATE (priority 10)
            // For off-GCD instants at t=0, all events execute in priority order before next APL
            const rotationEffect = yield* rotationRef.get;
            if (rotationEffect !== null) {
              const gcdExpiry = triggersGcd ? startTime + gcd : startTime;
              const aplEvaluateTime = Math.max(completeTime, gcdExpiry);

              yield* scheduler.schedule({
                execute: rotationEffect,
                id: `apl_evaluate_${modifiedSpell.info.id}_${startTime}`,
                payload: {},
                priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
                time: aplEvaluateTime,
                type: Events.EventType.APL_EVALUATE,
              });
            }

            yield* logService.info(
              "CastQueue",
              `Scheduled cast events for ${modifiedSpell.info.name}`,
              {
                castTime,
                completeTime,
                spellId: modifiedSpell.info.id,
                spellName: modifiedSpell.info.name,
              },
            );

            // Interrupt the rotation fiber - cast succeeded, stop execution
            return yield* Effect.interrupt;
          }).pipe(
            Effect.mapError(
              (err) =>
                new Errors.Cast({
                  reason:
                    typeof err === "object" && err !== null && "_tag" in err
                      ? (err._tag as string)
                      : "Unknown error",
                  spell,
                }),
            ),
          ),
      };
    }),
  },
) {}
