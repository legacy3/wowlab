/**
 * Beast Mastery Hunter Spell Handlers
 *
 * These handlers respond to combat log events and emit additional events
 * (buffs, damage, procs, etc.) based on BM Hunter spell mechanics.
 */
import { CombatLog } from "@wowlab/core/Schemas";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as Effect from "effect/Effect";

// =============================================================================
// BM Hunter Spell IDs
// =============================================================================

const SpellIds = {
  // Core Abilities
  BARBED_SHOT: 217200,
  BESTIAL_WRATH: 19574,
  COBRA_SHOT: 193455,
  KILL_COMMAND: 34026,

  // Buffs
  BARBED_SHOT_BUFF: 246152, // Focus regen buff
  BESTIAL_WRATH_BUFF: 19574, // Same ID as the spell
  FRENZY: 272790, // Pet attack speed buff
} as const;

// =============================================================================
// Handler: Bestial Wrath
// =============================================================================

/**
 * When Bestial Wrath is cast, apply the buff to the hunter.
 * Duration: 15 seconds, 25% damage increase.
 */
const onBestialWrathCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Emit the buff application
    const auraEvent = new CombatLog.SpellAuraApplied({
      amount: null, // Not a stacking buff
      auraType: "BUFF",
      destFlags: event.sourceFlags,
      destGUID: event.sourceGUID,
      destName: event.sourceName,
      destRaidFlags: event.sourceRaidFlags,
      hideCaster: false,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.BESTIAL_WRATH_BUFF,
      spellName: "Bestial Wrath",
      spellSchool: 1, // Physical
      timestamp: event.timestamp,
    });

    emitter.emit(auraEvent);

    yield* Effect.logDebug(
      `[BM] Bestial Wrath buff applied to ${event.sourceName}`,
    );
  });

// =============================================================================
// Handler: Barbed Shot
// =============================================================================

/**
 * When Barbed Shot is cast:
 * 1. Apply Barbed Shot buff to hunter (Focus regen)
 * 2. Apply/stack Frenzy on pet
 */
const onBarbedShotCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Apply Barbed Shot buff to hunter (Focus regen over 8s)
    const focusBuff = new CombatLog.SpellAuraApplied({
      amount: null,
      auraType: "BUFF",
      destFlags: event.sourceFlags,
      destGUID: event.sourceGUID,
      destName: event.sourceName,
      destRaidFlags: event.sourceRaidFlags,
      hideCaster: false,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.BARBED_SHOT_BUFF,
      spellName: "Barbed Shot",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    emitter.emit(focusBuff);

    yield* Effect.logDebug(
      `[BM] Barbed Shot buff applied to ${event.sourceName}`,
    );

    // TODO: Also apply Frenzy to pet when we have pet system
  });

// =============================================================================
// Register All BM Handlers
// =============================================================================

/**
 * Register all Beast Mastery hunter spell handlers.
 * Call this during simulation initialization.
 */
export const registerBMHandlers = Effect.gen(function* () {
  const combatLog = yield* CombatLogService.CombatLogService;

  // Bestial Wrath - apply buff on cast
  yield* combatLog.on(
    { spellId: SpellIds.BESTIAL_WRATH, subevent: "SPELL_CAST_SUCCESS" },
    onBestialWrathCast,
    { id: "bm:bestial-wrath", priority: 10 },
  );

  // Barbed Shot - apply buffs on cast
  yield* combatLog.on(
    { spellId: SpellIds.BARBED_SHOT, subevent: "SPELL_CAST_SUCCESS" },
    onBarbedShotCast,
    { id: "bm:barbed-shot", priority: 10 },
  );

  yield* Effect.logInfo("[BM] Registered Beast Mastery spell handlers");
});
