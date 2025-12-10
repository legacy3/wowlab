import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { SimulationConfigService } from "../../config/SimulationConfigService.js";
import { StateService } from "../../state/StateService.js";

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

  if (baseDurationMs > 0) {
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

  if (periodicType && tickPeriodMs > 0) {
    const actualTickPeriodMs = auraConfig.hastedTicks
      ? tickPeriodMs / (1 + hastePercent)
      : tickPeriodMs;

    const firstTickDelay = auraConfig.tickOnApplication
      ? 0
      : actualTickPeriodMs;

    const tickTag =
      periodicType === "heal" ? "SPELL_PERIODIC_HEAL" : "SPELL_PERIODIC_DAMAGE";

    emitter.emitAt(firstTickDelay, {
      _tag: tickTag,
      tickPeriodMs: actualTickPeriodMs,
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

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const aura = Entities.Aura.Aura.create(
        {
          casterUnitId: Branded.UnitID(event.sourceGUID),
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

    if (auraConfig) {
      scheduleAuraEvents(event, emitter, auraConfig);
    }
  });

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
      const existingAura = unit.auras.all.get(spellId);
      if (!existingAura) {
        return s;
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

      let newDurationMs: number;

      if (auraConfig) {
        const baseDurationMs = auraConfig.baseDurationMs;

        if (auraConfig.refreshBehavior === "pandemic") {
          const remainingMs = Math.max(
            0,
            (existingAura.expiresAt - currentTime) * 1000,
          );
          const pandemicCap = baseDurationMs * 0.3;
          const bonusMs = Math.min(remainingMs, pandemicCap);
          newDurationMs = baseDurationMs + bonusMs;
        } else {
          newDurationMs = baseDurationMs;
        }
      } else {
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

    if (auraConfig && auraConfig.baseDurationMs > 0) {
      const currentState = yield* state.getState();
      const destId = Branded.UnitID(event.destGUID);
      const unit = currentState.units.get(destId);
      const aura = unit?.auras.all.get(spellId);

      if (aura) {
        const remainingMs = (aura.expiresAt - currentTime) * 1000;
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
