import * as Effect from "effect/Effect";

import { CombatLog } from "@wowlab/core/Schemas";

import type { SpecDefinition, SpellHandler } from "../shared/types.js";

import { AURA_DEFAULTS, DAMAGE_DEFAULTS, fromTrigger } from "../shared/events.js";
import { BMSpells, HunterSpells } from "./constants.js";

const bestialWrath: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      emitter.emit(
        new CombatLog.SpellAuraApplied({
          ...fromTrigger(event, { toSelf: true }),
          spellId: BMSpells.BESTIAL_WRATH,
          spellName: "Bestial Wrath",
          spellSchool: 1,
          auraType: "BUFF",
          ...AURA_DEFAULTS,
        }),
      );
    }),
  id: "bm:bestial-wrath",
  spellId: BMSpells.BESTIAL_WRATH,
  subevent: "SPELL_CAST_SUCCESS",
};

const barbedShot: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      emitter.emit(
        new CombatLog.SpellAuraApplied({
          ...fromTrigger(event, { toSelf: true }),
          spellId: BMSpells.BARBED_SHOT_BUFF,
          spellName: "Barbed Shot",
          spellSchool: 1,
          auraType: "BUFF",
          ...AURA_DEFAULTS,
        }),
      );
      // TODO: Apply Frenzy to pet (need pet GUID tracking)
      emitter.emit(
        new CombatLog.SpellAuraApplied({
          ...fromTrigger(event, { toSelf: true }),
          spellId: BMSpells.FRENZY,
          spellName: "Frenzy",
          spellSchool: 1,
          auraType: "BUFF",
          ...AURA_DEFAULTS,
        }),
      );
    }),
  id: "bm:barbed-shot",
  spellId: BMSpells.BARBED_SHOT,
  subevent: "SPELL_CAST_SUCCESS",
};

const killCommand: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      // TODO: Use pet as source (need pet GUID tracking)
      emitter.emit(
        new CombatLog.SpellDamage({
          ...fromTrigger(event),
          spellId: BMSpells.PET_KILL_COMMAND,
          spellName: "Kill Command",
          spellSchool: 1,
          school: 1,
          ...DAMAGE_DEFAULTS,
        }),
      );
    }),
  id: "bm:kill-command",
  requiresTarget: true,
  spellId: BMSpells.KILL_COMMAND,
  subevent: "SPELL_CAST_SUCCESS",
};

const cobraShot: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      emitter.emit(
        new CombatLog.SpellDamage({
          ...fromTrigger(event),
          spellId: BMSpells.COBRA_SHOT,
          spellName: "Cobra Shot",
          spellSchool: 8,
          school: 8,
          ...DAMAGE_DEFAULTS,
        }),
      );
      // TODO: Reduce KC cooldown, Killer Cobra interaction
    }),
  id: "bm:cobra-shot",
  requiresTarget: true,
  spellId: BMSpells.COBRA_SHOT,
  subevent: "SPELL_CAST_SUCCESS",
};

const multiShot: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      if (event.destGUID && event.destName) {
        emitter.emit(
          new CombatLog.SpellDamage({
            ...fromTrigger(event),
            spellId: BMSpells.MULTI_SHOT,
            spellName: "Multi-Shot",
            spellSchool: 1,
            school: 1,
            ...DAMAGE_DEFAULTS,
          }),
        );
      }
      // TODO: Apply Beast Cleave to pet (need pet GUID tracking)
      emitter.emit(
        new CombatLog.SpellAuraApplied({
          ...fromTrigger(event, { toSelf: true }),
          spellId: BMSpells.BEAST_CLEAVE,
          spellName: "Beast Cleave",
          spellSchool: 1,
          auraType: "BUFF",
          ...AURA_DEFAULTS,
        }),
      );
    }),
  id: "bm:multi-shot",
  spellId: BMSpells.MULTI_SHOT,
  subevent: "SPELL_CAST_SUCCESS",
};

const callOfTheWild: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      const timestamp = Date.now();
      emitter.emit(
        new CombatLog.SpellSummon({
          ...fromTrigger(event),
          spellId: BMSpells.CALL_OF_THE_WILD,
          spellName: "Call of the Wild",
          spellSchool: 1,
          destGUID: `Creature-0-0-0-0-${BMSpells.CALL_OF_THE_WILD}-${timestamp}-1`,
          destName: "Wild Pet",
          destFlags: 0x2111,
          destRaidFlags: 0,
        }),
      );
      emitter.emit(
        new CombatLog.SpellSummon({
          ...fromTrigger(event),
          spellId: BMSpells.CALL_OF_THE_WILD,
          spellName: "Call of the Wild",
          spellSchool: 1,
          destGUID: `Creature-0-0-0-0-${BMSpells.CALL_OF_THE_WILD}-${timestamp}-2`,
          destName: "Wild Pet",
          destFlags: 0x2111,
          destRaidFlags: 0,
        }),
      );
    }),
  id: "bm:call-of-the-wild",
  spellId: BMSpells.CALL_OF_THE_WILD,
  subevent: "SPELL_CAST_SUCCESS",
};

const killShot: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      emitter.emit(
        new CombatLog.SpellDamage({
          ...fromTrigger(event),
          spellId: HunterSpells.KILL_SHOT,
          spellName: "Kill Shot",
          spellSchool: 1,
          school: 1,
          ...DAMAGE_DEFAULTS,
        }),
      );
    }),
  id: "bm:kill-shot",
  requiresTarget: true,
  spellId: HunterSpells.KILL_SHOT,
  subevent: "SPELL_CAST_SUCCESS",
};

const bloodshed: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      emitter.emit(
        new CombatLog.SpellAuraApplied({
          ...fromTrigger(event),
          spellId: BMSpells.BLOODSHED,
          spellName: "Bloodshed",
          spellSchool: 1,
          auraType: "DEBUFF",
          ...AURA_DEFAULTS,
        }),
      );
      // TODO: Schedule periodic damage ticks
    }),
  id: "bm:bloodshed",
  requiresTarget: true,
  spellId: BMSpells.BLOODSHED,
  subevent: "SPELL_CAST_SUCCESS",
};

const direBeast: SpellHandler = {
  handler: (event, emitter) =>
    Effect.sync(() => {
      emitter.emit(
        new CombatLog.SpellSummon({
          ...fromTrigger(event),
          spellId: BMSpells.DIRE_BEAST_SUMMON,
          spellName: "Dire Beast",
          spellSchool: 1,
          destGUID: `Creature-0-0-0-0-${BMSpells.DIRE_BEAST_SUMMON}-${Date.now()}`,
          destName: "Dire Beast",
          destFlags: 0x2111,
          destRaidFlags: 0,
        }),
      );
    }),
  id: "bm:dire-beast",
  spellId: BMSpells.DIRE_BEAST,
  subevent: "SPELL_CAST_SUCCESS",
};

export const BeastMastery: SpecDefinition = {
  class: "hunter",
  handlers: [
    bestialWrath,
    barbedShot,
    killCommand,
    cobraShot,
    multiShot,
    callOfTheWild,
    killShot,
    bloodshed,
    direBeast,
  ],
  id: "hunter:beast-mastery",
  name: "Beast Mastery",
};
