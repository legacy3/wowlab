import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

const applyAura = (
  event: CombatLog.SpellAuraApplied,
): Effect.Effect<void, never, StateService> =>
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
      const defaultDuration = 15;
      const aura = Entities.Aura.Aura.create(
        {
          casterUnitId: Branded.UnitID(event.sourceGUID),
          expiresAt: currentTime + defaultDuration,
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

    yield* Effect.logDebug(
      `Aura applied: ${event.spellName} (${event.spellId}) on ${event.destName}`,
    );
  });

const removeAura = (
  event: CombatLog.SpellAuraRemoved,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const spellId = Branded.SpellID(event.spellId);
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

    yield* Effect.logDebug(
      `Aura removed: ${event.spellName} (${event.spellId}) from ${event.destName}`,
    );
  });

const updateAuraStacks = (
  event: CombatLog.SpellAuraAppliedDose,
): Effect.Effect<void, never, StateService> =>
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

      const updatedAura = existingAura.with(
        { stacks: event.amount ?? existingAura.stacks + 1 },
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

    yield* Effect.logDebug(
      `Aura stack: ${event.spellName} (${event.amount}) on ${event.destName}`,
    );
  });

const removeAuraStacks = (
  event: CombatLog.SpellAuraRemovedDose,
): Effect.Effect<void, never, StateService> =>
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

    yield* Effect.logDebug(
      `Aura stack removed: ${event.spellName} (${event.amount}) from ${event.destName}`,
    );
  });

const refreshAura = (
  event: CombatLog.SpellAuraRefresh,
): Effect.Effect<void, never, StateService> =>
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

      const duration = existingAura.info.duration || 15;
      const updatedAura = existingAura.with(
        { expiresAt: currentTime + duration },
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

    yield* Effect.logDebug(
      `Aura refresh: ${event.spellName} on ${event.destName}`,
    );
  });

export const AURA_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_AURA_APPLIED", applyAura],
  ["SPELL_AURA_REMOVED", removeAura],
  ["SPELL_AURA_APPLIED_DOSE", updateAuraStacks],
  ["SPELL_AURA_REMOVED_DOSE", removeAuraStacks],
  ["SPELL_AURA_REFRESH", refreshAura],
];
