import { Entities, Errors, Events, Schemas } from "@wowlab/core";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import { SpellLifecycleService } from "../lifecycle/SpellLifecycleService.js";
import { RotationRefService } from "../rotation/RotationRefService.js";
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

  // Consume a charge if spell has charges
  let updatedSpell = spell;
  if (spell.info.maxCharges > 0 && spell.charges > 0) {
    updatedSpell = spell.transform.charges.decrement({
      amount: 1,
      time: currentTime,
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
      RotationRefService.Default,
      StateService.Default,
    ],
    effect: Effect.gen(function* () {
      const lifecycle = yield* SpellLifecycleService;
      const scheduler = yield* EventSchedulerService;
      const state = yield* StateService;
      const rotationRef = yield* RotationRefService;

      return {
        enqueue: (
          spell: Entities.Spell.Spell,
          targetId: Schemas.Branded.UnitID = Schemas.Branded.UnitID("enemy-1"),
        ) =>
          Effect.gen(function* () {
            const currentState = yield* state.getState();

            yield* Effect.logInfo(`[CastQueue] Enqueueing ${spell.info.name}`);

            // Find player unit (first unit marked as player)
            const player = currentState.units
              .valueSeq()
              .find((u) => u.isPlayer);

            if (!player) {
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
              Effect.tapError((error) =>
                Effect.logDebug(`[CastQueue] Validation failed: ${error._tag}`),
              ),
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
                lifecycle.executeOnCast(modifiedSpell, player.id),
                Effect.timeout("10 seconds"),
                Effect.catchAll((error) =>
                  Effect.logError(
                    `[CastQueue] Modifier execution failed: ${error}`,
                  ),
                ),
                Effect.asVoid,
              ),
              id: `cast_complete_${modifiedSpell.info.id}_${startTime}`,
              payload: { spell: modifiedSpell, targetId },
              priority:
                Events.EVENT_PRIORITY[Events.EventType.SPELL_CAST_COMPLETE],
              time: completeTime,
              type: Events.EventType.SPELL_CAST_COMPLETE,
            });

            // Schedule APL re-evaluation
            const rotationEffect = yield* rotationRef.get;
            if (rotationEffect !== null) {
              const gcdExpiry = triggersGcd ? startTime + gcd : startTime;
              const aplEvaluateTime = Math.max(completeTime, gcdExpiry);

              yield* scheduler.schedule({
                execute: Effect.asVoid(rotationEffect),
                id: `apl_evaluate_${modifiedSpell.info.id}_${startTime}`,
                payload: {},
                priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
                time: aplEvaluateTime,
                type: Events.EventType.APL_EVALUATE,
              });
            }

            yield* Effect.logInfo(
              `[CastQueue] Scheduled cast events for ${modifiedSpell.info.name}`,
            );

            // Interrupt the rotation fiber - cast succeeded, stop execution
            return yield* Effect.interrupt;
          }).pipe(
            Effect.mapError(
              (err) =>
                new Errors.Cast({
                  caster: undefined,
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
