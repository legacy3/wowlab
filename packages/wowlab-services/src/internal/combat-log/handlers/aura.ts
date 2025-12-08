/**
 * Aura State Handlers
 *
 * Per docs/aura-system/05-phase3-handler-integration.md:
 * - State handlers update GameState with CLEU-observable fields only
 * - Scheduler (emitter.emitAt) is the sole owner of expirations and tick cadence
 * - config.auras supplies static data; handlers must not mutate it
 */
import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { SimulationConfigService } from "../../config/SimulationConfigService.js";
import { StateService } from "../../state/StateService.js";

/**
 * Schedule aura removal and periodic ticks based on aura config.
 * Per Phase 3 docs:
 * - If baseDurationMs > 0, schedule SPELL_AURA_REMOVED
 * - If periodic, schedule first tick (immediate if tickOnApplication, else at tickPeriodMs)
 */
const scheduleAuraEvents = (
  event: CombatLog.SpellAuraApplied,
  emitter: Emitter,
  auraConfig: {
    baseDurationMs: number;
    hastedTicks: boolean;
    periodicType: string | null;
    tickOnApplication: boolean;
    tickPeriodMs: number;
  },
  hastePercent: number = 0,
): void => {
  const { baseDurationMs, periodicType, tickPeriodMs } = auraConfig;

  // Schedule removal if duration > 0
  if (baseDurationMs > 0) {
    // Use plain object - emitAt will add timestamp
    emitter.emitAt(baseDurationMs, {
      _tag: "SPELL_AURA_REMOVED",
      amount: null,
      auraType: event.auraType,
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      hideCaster: event.hideCaster,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: event.spellId,
      spellName: event.spellName,
      spellSchool: event.spellSchool,
    } as any);
  }

  // Schedule periodic ticks if this is a periodic aura
  if (periodicType && tickPeriodMs > 0) {
    // Apply haste to tick period if hastedTicks
    const actualTickPeriodMs = auraConfig.hastedTicks
      ? tickPeriodMs / (1 + hastePercent)
      : tickPeriodMs;

    // First tick delay: 0 if tickOnApplication, else tickPeriodMs
    const firstTickDelay = auraConfig.tickOnApplication
      ? 0
      : actualTickPeriodMs;

    // Determine event tag based on periodic type
    const tickTag =
      periodicType === "heal" ? "SPELL_PERIODIC_HEAL" : "SPELL_PERIODIC_DAMAGE";

    // Schedule first tick with tickPeriodMs in payload
    emitter.emitAt(firstTickDelay, {
      _tag: tickTag,
      // Include tickPeriodMs in payload for tick handler to reschedule
      // This is a simulation extension - real CLEU doesn't have this field
      tickPeriodMs: actualTickPeriodMs,
      // Standard CLEU fields
      absorbed: 0,
      amount: 0,
      blocked: 0,
      critical: false,
      destFlags: event.destFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destRaidFlags: event.destRaidFlags,
      glancing: false,
      hideCaster: event.hideCaster,
      overkill: 0,
      resisted: 0,
      sourceFlags: event.sourceFlags,
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceRaidFlags: event.sourceRaidFlags,
      spellId: event.spellId,
      spellName: event.spellName,
      spellSchool: event.spellSchool,
    } as any);
  }
};

/**
 * SPELL_AURA_APPLIED handler
 * Per Phase 3:
 * 1. Add aura to state with { casterUnitId, spellId, stacks: 1 }
 * 2. If baseDurationMs > 0, schedule removal
 * 3. If periodic, schedule first tick
 */
const applyAura = (
  event: CombatLog.SpellAuraApplied,
  emitter: Emitter,
): Effect.Effect<void, never, StateService | SimulationConfigService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const configService = yield* SimulationConfigService;
    const currentTime = event.timestamp;

    const spellId = Branded.SpellID(event.spellId);
    const auraConfig = yield* configService.getAuraConfig(spellId);

    // Update state: add aura with CLEU-observable fields only
    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      // Per the new model, aura entity should have minimal fields
      // However, for backward compatibility with existing entity structure,
      // we still create an Aura entity with the current fields
      const aura = Entities.Aura.Aura.create(
        {
          casterUnitId: Branded.UnitID(event.sourceGUID),
          // expiresAt is kept for backward compatibility but timing is in scheduler
          expiresAt: auraConfig
            ? currentTime + auraConfig.baseDurationMs / 1000
            : currentTime + 15,
          info: Entities.Spell.SpellInfo.create({
            id: spellId,
            name: event.spellName,
          }),
          stacks: event.amount ?? 1,
        },
        currentTime,
      );

      const newAuras: Entities.Unit.AuraCollection = {
        all: unit.auras.all.set(spellId, aura),
        meta: unit.auras.meta,
      };

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        auras: newAuras,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });

    // Schedule removal and ticks if we have config
    if (auraConfig) {
      scheduleAuraEvents(event, emitter, auraConfig);
    }
  });

/**
 * SPELL_AURA_REMOVED handler
 * Per Phase 3:
 * - If aura missing → stale event → return
 * - Delete aura from state
 */
const removeAura = (
  event: CombatLog.SpellAuraRemoved,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService | SimulationConfigService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const spellId = Branded.SpellID(event.spellId);

      // Stale event check: if aura is already gone, this is a stale removal
      const existingAura = unit.auras.all.get(spellId);
      if (!existingAura) {
        return s; // Stale event - aura already removed
      }

      const newAuras: Entities.Unit.AuraCollection = {
        all: unit.auras.all.delete(spellId),
        meta: unit.auras.meta,
      };

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        auras: newAuras,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });
  });

/**
 * SPELL_AURA_APPLIED_DOSE handler
 * Per Phase 3:
 * - Update stacks, capped by auraData.maxStacks when present
 */
const updateAuraStacks = (
  event: CombatLog.SpellAuraAppliedDose,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService | SimulationConfigService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const configService = yield* SimulationConfigService;
    const currentTime = event.timestamp;

    const spellId = Branded.SpellID(event.spellId);
    const auraConfig = yield* configService.getAuraConfig(spellId);
    const maxStacks = auraConfig?.maxStacks ?? Infinity;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const existingAura = unit.auras.all.get(spellId);
      if (!existingAura) {
        return s;
      }

      const newStacks = Math.min(
        event.amount ?? existingAura.stacks + 1,
        maxStacks,
      );
      const updatedAura = existingAura.with({ stacks: newStacks }, currentTime);

      const newAuras: Entities.Unit.AuraCollection = {
        all: unit.auras.all.set(spellId, updatedAura),
        meta: unit.auras.meta,
      };

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        auras: newAuras,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });
  });

/**
 * SPELL_AURA_REMOVED_DOSE handler
 * Per Phase 3:
 * - Update stacks (decrement)
 */
const removeAuraStacks = (
  event: CombatLog.SpellAuraRemovedDose,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService | SimulationConfigService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentTime = event.timestamp;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const spellId = Branded.SpellID(event.spellId);
      const existingAura = unit.auras.all.get(spellId);
      if (!existingAura) {
        return s;
      }

      const newStacks = Math.max(0, existingAura.stacks - (event.amount ?? 1));
      const updatedAura = existingAura.with({ stacks: newStacks }, currentTime);

      const newAuras: Entities.Unit.AuraCollection = {
        all: unit.auras.all.set(spellId, updatedAura),
        meta: unit.auras.meta,
      };

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        auras: newAuras,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });
  });

/**
 * SPELL_AURA_REFRESH handler
 * Per Phase 3:
 * - Compute new duration based on refresh behavior (pandemic vs duration)
 * - Schedule new removal; old removal becomes stale
 * - Do NOT touch tick cadence; periodic events already queued keep firing
 */
const refreshAura = (
  event: CombatLog.SpellAuraRefresh,
  emitter: Emitter,
): Effect.Effect<void, never, StateService | SimulationConfigService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const configService = yield* SimulationConfigService;
    const currentTime = event.timestamp;

    const spellId = Branded.SpellID(event.spellId);
    const auraConfig = yield* configService.getAuraConfig(spellId);

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const existingAura = unit.auras.all.get(spellId);
      if (!existingAura) {
        return s;
      }

      // Calculate new duration based on refresh behavior
      let newDurationMs: number;

      if (auraConfig) {
        const baseDurationMs = auraConfig.baseDurationMs;

        if (auraConfig.refreshBehavior === "pandemic") {
          // Pandemic: add remaining time, capped at 30% of base duration
          const remainingMs = Math.max(
            0,
            (existingAura.expiresAt - currentTime) * 1000,
          );
          const pandemicCap = baseDurationMs * 0.3;
          const bonusMs = Math.min(remainingMs, pandemicCap);
          newDurationMs = baseDurationMs + bonusMs;
        } else {
          // Duration: full replace
          newDurationMs = baseDurationMs;
        }
      } else {
        // Fallback: use existing duration
        const duration = existingAura.info.duration || 15;
        newDurationMs = duration * 1000;
      }

      const newExpiresAt = currentTime + newDurationMs / 1000;
      const updatedAura = existingAura.with(
        { expiresAt: newExpiresAt },
        currentTime,
      );

      const newAuras: Entities.Unit.AuraCollection = {
        all: unit.auras.all.set(spellId, updatedAura),
        meta: unit.auras.meta,
      };

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        auras: newAuras,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });

    // Schedule new removal - old one will be stale (handler checks if aura exists)
    if (auraConfig && auraConfig.baseDurationMs > 0) {
      // Get current state to calculate actual new duration
      const currentState = yield* state.getState();
      const destId = Branded.UnitID(event.destGUID);
      const unit = currentState.units.get(destId);
      const aura = unit?.auras.all.get(spellId);

      if (aura) {
        const remainingMs = (aura.expiresAt - currentTime) * 1000;

        // Use plain object - emitAt will add timestamp
        emitter.emitAt(remainingMs, {
          _tag: "SPELL_AURA_REMOVED",
          amount: null,
          auraType: event.auraType,
          destFlags: event.destFlags,
          destGUID: event.destGUID,
          destName: event.destName,
          destRaidFlags: event.destRaidFlags,
          hideCaster: event.hideCaster,
          sourceFlags: event.sourceFlags,
          sourceGUID: event.sourceGUID,
          sourceName: event.sourceName,
          sourceRaidFlags: event.sourceRaidFlags,
          spellId: event.spellId,
          spellName: event.spellName,
          spellSchool: event.spellSchool,
        } as any);
      }
    }
  });

export const AURA_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_AURA_APPLIED", applyAura],
  ["SPELL_AURA_REMOVED", removeAura],
  ["SPELL_AURA_APPLIED_DOSE", updateAuraStacks],
  ["SPELL_AURA_REMOVED_DOSE", removeAuraStacks],
  ["SPELL_AURA_REFRESH", refreshAura],
];
