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
  BLOODSHED: 321530,
  CALL_OF_THE_WILD: 359844,
  COBRA_SHOT: 193455,
  DIRE_BEAST: 120679,
  KILL_COMMAND: 34026,
  KILL_SHOT: 53351,
  MULTI_SHOT: 2643,

  // Pet abilities
  PET_CLAW: 16827,
  PET_KILL_COMMAND: 83381, // Pet's KC damage spell

  // Buffs
  BARBED_SHOT_BUFF: 246152, // Focus regen buff
  BEAST_CLEAVE: 268877, // AoE cleave buff on pet
  BESTIAL_WRATH_BUFF: 19574, // Same ID as the spell
  FRENZY: 272790, // Pet attack speed buff
  THRILL_OF_THE_HUNT: 257946, // Crit buff from Barbed Shot

  // Focus costs
  COBRA_SHOT_COST: 35,
  KILL_COMMAND_COST: 30,
  MULTI_SHOT_COST: 40,
} as const;

// KC cooldown reduction from Cobra Shot (in seconds)
const COBRA_SHOT_KC_CDR = 1;

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
// Handler: Kill Command
// =============================================================================

/**
 * When Kill Command is cast:
 * 1. Pet performs Kill Command attack (emit damage)
 * 2. Check for Dire Command proc (15% chance to summon Dire Beast)
 */
const onKillCommandCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Guard: need a target for damage
    if (!event.destGUID || !event.destName) {
      yield* Effect.logDebug(
        `[BM] Kill Command cast but no target - skipping damage`,
      );
      return;
    }

    // Emit pet's Kill Command damage
    // The pet is the source, target is the enemy
    const damageEvent = new CombatLog.SpellDamage({
      absorbed: null,
      amount: 0, // Damage calculated by damage pipeline (not implemented yet)
      blocked: null,
      critical: false,
      crushing: false,
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      glancing: false,
      hideCaster: false,
      isOffHand: false,
      overkill: -1,
      resisted: null,
      school: 1, // Physical
      sourceFlags: event.sourceFlags, // TODO: Should be pet's flags
      sourceGUID: event.sourceGUID, // TODO: Should be pet's GUID
      sourceName: "Pet", // TODO: Should be pet's name
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.PET_KILL_COMMAND,
      spellName: "Kill Command",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    emitter.emit(damageEvent);

    yield* Effect.logDebug(
      `[BM] Kill Command damage from pet on ${event.destName}`,
    );

    // TODO: Dire Command proc check (15% chance) - needs RNG service
  });

// =============================================================================
// Handler: Cobra Shot
// =============================================================================

/**
 * When Cobra Shot is cast:
 * 1. Deal damage to target
 * 2. Reduce Kill Command cooldown by 1 second (Killer Cobra: reset during BW)
 */
const onCobraShotCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Guard: need a target for damage
    if (!event.destGUID || !event.destName) {
      yield* Effect.logDebug(
        `[BM] Cobra Shot cast but no target - skipping damage`,
      );
      // Still reduce KC cooldown even without target
      return;
    }

    // Emit Cobra Shot damage
    const damageEvent = new CombatLog.SpellDamage({
      absorbed: null,
      amount: 0, // Damage calculated by damage pipeline
      blocked: null,
      critical: false,
      crushing: false,
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      glancing: false,
      hideCaster: false,
      isOffHand: false,
      overkill: -1,
      resisted: null,
      school: 8, // Nature
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.COBRA_SHOT,
      spellName: "Cobra Shot",
      spellSchool: 8, // Nature
      timestamp: event.timestamp,
    });

    emitter.emit(damageEvent);

    yield* Effect.logDebug(
      `[BM] Cobra Shot damage on ${event.destName}, KC CDR: ${COBRA_SHOT_KC_CDR}s`,
    );

    // TODO: Reduce KC cooldown - needs access to spell cooldown state
    // TODO: Killer Cobra - reset KC if Bestial Wrath is active
  });

// =============================================================================
// Handler: Multi-Shot
// =============================================================================

/**
 * When Multi-Shot is cast:
 * 1. Deal damage to all targets
 * 2. Apply Beast Cleave buff to pet (4 seconds)
 */
const onMultiShotCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Emit Multi-Shot damage (AoE - would need target list in real impl)
    // Only emit damage if we have a target
    if (event.destGUID && event.destName) {
      const damageEvent = new CombatLog.SpellDamage({
        absorbed: null,
        amount: 0, // Damage calculated by damage pipeline
        blocked: null,
        critical: false,
        crushing: false,
        destFlags: event.destFlags,
        destGUID: event.destGUID,
        destName: event.destName,
        destRaidFlags: event.destRaidFlags,
        glancing: false,
        hideCaster: false,
        isOffHand: false,
        overkill: -1,
        resisted: null,
        school: 1, // Physical
        sourceFlags: event.sourceFlags,
        sourceGUID: event.sourceGUID,
        sourceName: event.sourceName,
        sourceRaidFlags: event.sourceRaidFlags,
        spellId: SpellIds.MULTI_SHOT,
        spellName: "Multi-Shot",
        spellSchool: 1,
        timestamp: event.timestamp,
      });

      emitter.emit(damageEvent);
    }

    // Apply Beast Cleave buff to pet (always happens regardless of target)
    // TODO: Need pet GUID - for now apply to hunter as placeholder
    const beastCleaveEvent = new CombatLog.SpellAuraApplied({
      amount: null,
      auraType: "BUFF",
      destFlags: event.sourceFlags, // TODO: Pet's flags
      destGUID: event.sourceGUID, // TODO: Pet's GUID
      destName: "Pet", // TODO: Pet's name
      destRaidFlags: event.sourceRaidFlags,
      hideCaster: false,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.BEAST_CLEAVE,
      spellName: "Beast Cleave",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    emitter.emit(beastCleaveEvent);

    yield* Effect.logDebug(`[BM] Multi-Shot + Beast Cleave applied`);
  });

// =============================================================================
// Handler: Call of the Wild
// =============================================================================

/**
 * When Call of the Wild is cast:
 * 1. Summon 2 additional pets for 20 seconds
 * 2. Grant player and pets various buffs
 */
const onCallOfTheWildCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Summon first temporary pet
    const summon1 = new CombatLog.SpellSummon({
      destFlags: 0,
      destGUID: `Creature-0-0-0-0-0-${Date.now()}-1`, // Generated GUID
      destName: "Wild Pet 1",
      destRaidFlags: 0,
      hideCaster: false,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.CALL_OF_THE_WILD,
      spellName: "Call of the Wild",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    // Summon second temporary pet
    const summon2 = new CombatLog.SpellSummon({
      destFlags: 0,
      destGUID: `Creature-0-0-0-0-0-${Date.now()}-2`, // Generated GUID
      destName: "Wild Pet 2",
      destRaidFlags: 0,
      hideCaster: false,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.CALL_OF_THE_WILD,
      spellName: "Call of the Wild",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    emitter.emit(summon1);
    emitter.emit(summon2);

    yield* Effect.logDebug(`[BM] Call of the Wild: summoned 2 temporary pets`);
  });

// =============================================================================
// Handler: Kill Shot
// =============================================================================

/**
 * Kill Shot - Execute ability usable on targets below 20% health
 */
const onKillShotCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Guard: need a target for damage
    if (!event.destGUID || !event.destName) {
      yield* Effect.logDebug(
        `[BM] Kill Shot cast but no target - skipping damage`,
      );
      return;
    }

    const damageEvent = new CombatLog.SpellDamage({
      absorbed: null,
      amount: 0, // High damage, calculated by pipeline
      blocked: null,
      critical: false,
      crushing: false,
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      glancing: false,
      hideCaster: false,
      isOffHand: false,
      overkill: -1,
      resisted: null,
      school: 1, // Physical
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.KILL_SHOT,
      spellName: "Kill Shot",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    emitter.emit(damageEvent);

    yield* Effect.logDebug(
      `[BM] Kill Shot execute damage on ${event.destName}`,
    );
  });

// =============================================================================
// Handler: Bloodshed
// =============================================================================

/**
 * Bloodshed - Pet ability that applies a bleed DoT
 */
const onBloodshedCast: CombatLogService.EventHandler<
  CombatLog.SpellCastSuccess
> = (event, emitter) =>
  Effect.gen(function* () {
    // Guard: need a target to apply debuff
    if (!event.destGUID || !event.destName) {
      yield* Effect.logDebug(
        `[BM] Bloodshed cast but no target specified - skipping debuff`,
      );
      return;
    }

    // Apply Bloodshed debuff to target
    const debuffEvent = new CombatLog.SpellAuraApplied({
      amount: null,
      auraType: "DEBUFF",
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      hideCaster: false,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID, // TODO: Should be pet's GUID
      sourceName: "Pet",
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: SpellIds.BLOODSHED,
      spellName: "Bloodshed",
      spellSchool: 1,
      timestamp: event.timestamp,
    });

    emitter.emit(debuffEvent);

    yield* Effect.logDebug(
      `[BM] Bloodshed debuff applied to ${event.destName}`,
    );

    // TODO: Schedule periodic damage ticks
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

  // Kill Command - pet attack
  yield* combatLog.on(
    { spellId: SpellIds.KILL_COMMAND, subevent: "SPELL_CAST_SUCCESS" },
    onKillCommandCast,
    { id: "bm:kill-command", priority: 10 },
  );

  // Cobra Shot - damage + KC CDR
  yield* combatLog.on(
    { spellId: SpellIds.COBRA_SHOT, subevent: "SPELL_CAST_SUCCESS" },
    onCobraShotCast,
    { id: "bm:cobra-shot", priority: 10 },
  );

  // Multi-Shot - AoE damage + Beast Cleave
  yield* combatLog.on(
    { spellId: SpellIds.MULTI_SHOT, subevent: "SPELL_CAST_SUCCESS" },
    onMultiShotCast,
    { id: "bm:multi-shot", priority: 10 },
  );

  // Call of the Wild - summon pets
  yield* combatLog.on(
    { spellId: SpellIds.CALL_OF_THE_WILD, subevent: "SPELL_CAST_SUCCESS" },
    onCallOfTheWildCast,
    { id: "bm:call-of-the-wild", priority: 10 },
  );

  // Kill Shot - execute
  yield* combatLog.on(
    { spellId: SpellIds.KILL_SHOT, subevent: "SPELL_CAST_SUCCESS" },
    onKillShotCast,
    { id: "bm:kill-shot", priority: 10 },
  );

  // Bloodshed - pet bleed
  yield* combatLog.on(
    { spellId: SpellIds.BLOODSHED, subevent: "SPELL_CAST_SUCCESS" },
    onBloodshedCast,
    { id: "bm:bloodshed", priority: 10 },
  );

  yield* Effect.logInfo("[BM] Registered 8 Beast Mastery spell handlers");
});
