import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

const startCast = (
  event: CombatLog.SpellCastStart,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const sourceId = Branded.UnitID(event.sourceGUID);
      const unit = s.units.get(sourceId);
      if (!unit) {
        return s;
      }

      const spellId = Branded.SpellID(event.spellId);
      const destId = event.destGUID ? Branded.UnitID(event.destGUID) : null;
      const spell = unit.spells.all.get(spellId);
      const castTime = spell?.info.castTime ?? 0;

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        castingSpellId: spellId,
        castRemaining: castTime / 1000,
        castTarget: destId,
        isCasting: true,
      });

      return s.set("units", s.units.set(sourceId, updatedUnit));
    });
  });

const startCooldown = (
  event: CombatLog.SpellCastSuccess,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentTime = event.timestamp;

    yield* state.updateState((s) => {
      const sourceId = Branded.UnitID(event.sourceGUID);
      const unit = s.units.get(sourceId);
      if (!unit) {
        return s;
      }

      const spellId = Branded.SpellID(event.spellId);
      const existingSpell = unit.spells.all.get(spellId);
      if (!existingSpell) {
        return s;
      }

      const cooldownDuration = existingSpell.info.recoveryTime / 1000;
      if (cooldownDuration <= 0) {
        return s;
      }

      const updatedSpell = existingSpell.with(
        {
          charges: Math.max(0, existingSpell.charges - 1),
          cooldownExpiry: currentTime + cooldownDuration,
        },
        currentTime,
      );

      const newSpells: Entities.Unit.SpellCollection = {
        all: unit.spells.all.set(spellId, updatedSpell),
        meta: unit.spells.meta,
      };

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        spells: newSpells,
      });

      return s.set("units", s.units.set(sourceId, updatedUnit));
    });
  });

const completeCast = (
  event: CombatLog.SpellCastSuccess,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const sourceId = Branded.UnitID(event.sourceGUID);
      const unit = s.units.get(sourceId);
      if (!unit) {
        return s;
      }

      const spellId = Branded.SpellID(event.spellId);
      if (unit.castingSpellId !== spellId) {
        return s;
      }

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        castingSpellId: null,
        castRemaining: 0,
        castTarget: null,
        isCasting: false,
      });

      return s.set("units", s.units.set(sourceId, updatedUnit));
    });
  });

export const CAST_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_CAST_START", startCast],
  [
    "SPELL_CAST_SUCCESS",
    (e: CombatLog.SpellCastSuccess, emitter: Emitter) =>
      Effect.all([startCooldown(e, emitter), completeCast(e, emitter)], {
        discard: true,
      }),
  ],
];
