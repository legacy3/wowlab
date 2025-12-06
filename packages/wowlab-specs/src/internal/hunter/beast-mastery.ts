import { CombatLog } from "@wowlab/core/Schemas";

import type { SpecDefinition } from "../shared/types.js";

import {
  AURA_DEFAULTS,
  DAMAGE_DEFAULTS,
  fromTrigger,
} from "../shared/events.js";
import { handler } from "../shared/factories.js";
import { BMSpells, HunterSpells } from "./constants.js";

let summonCounter = 0;
const nextSummonId = () => ++summonCounter;

const bestialWrath = handler(
  "bm:bestial-wrath",
  BMSpells.BESTIAL_WRATH,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.BESTIAL_WRATH,
        spellName: "Bestial Wrath",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const barbedShot = handler(
  "bm:barbed-shot",
  BMSpells.BARBED_SHOT,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.BARBED_SHOT_BUFF,
        spellName: "Barbed Shot",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );

    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.FRENZY,
        spellName: "Frenzy",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const killCommand = handler(
  "bm:kill-command",
  BMSpells.KILL_COMMAND,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 1,
        spellId: BMSpells.PET_KILL_COMMAND,
        spellName: "Kill Command",
        spellSchool: 1,
        ...DAMAGE_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const cobraShot = handler(
  "bm:cobra-shot",
  BMSpells.COBRA_SHOT,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 8,
        spellId: BMSpells.COBRA_SHOT,
        spellName: "Cobra Shot",
        spellSchool: 8,
        ...DAMAGE_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const multiShot = handler(
  "bm:multi-shot",
  BMSpells.MULTI_SHOT,
  (event, emit) => {
    if (event.destGUID && event.destName) {
      emit(
        new CombatLog.SpellDamage({
          ...fromTrigger(event),
          school: 1,
          spellId: BMSpells.MULTI_SHOT,
          spellName: "Multi-Shot",
          spellSchool: 1,
          ...DAMAGE_DEFAULTS,
        }),
      );
    }

    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.BEAST_CLEAVE,
        spellName: "Beast Cleave",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const callOfTheWild = handler(
  "bm:call-of-the-wild",
  BMSpells.CALL_OF_THE_WILD,
  (event, emit) => {
    const t = event.timestamp;
    emit(
      new CombatLog.SpellSummon({
        ...fromTrigger(event),
        destFlags: 0x2111,
        destGUID: `Creature-0-0-0-0-${BMSpells.CALL_OF_THE_WILD}-${t}-${nextSummonId()}`,
        destName: "Wild Pet",
        destRaidFlags: 0,
        spellId: BMSpells.CALL_OF_THE_WILD,
        spellName: "Call of the Wild",
        spellSchool: 1,
      }),
    );

    emit(
      new CombatLog.SpellSummon({
        ...fromTrigger(event),
        destFlags: 0x2111,
        destGUID: `Creature-0-0-0-0-${BMSpells.CALL_OF_THE_WILD}-${t}-${nextSummonId()}`,
        destName: "Wild Pet",
        destRaidFlags: 0,
        spellId: BMSpells.CALL_OF_THE_WILD,
        spellName: "Call of the Wild",
        spellSchool: 1,
      }),
    );
  },
);

const killShot = handler(
  "bm:kill-shot",
  HunterSpells.KILL_SHOT,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 1,
        spellId: HunterSpells.KILL_SHOT,
        spellName: "Kill Shot",
        spellSchool: 1,
        ...DAMAGE_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const bloodshed = handler(
  "bm:bloodshed",
  BMSpells.BLOODSHED,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event),
        auraType: "DEBUFF",
        spellId: BMSpells.BLOODSHED,
        spellName: "Bloodshed",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const direBeast = handler(
  "bm:dire-beast",
  BMSpells.DIRE_BEAST,
  (event, emit) => {
    emit(
      new CombatLog.SpellSummon({
        ...fromTrigger(event),
        destFlags: 0x2111,
        destGUID: `Creature-0-0-0-0-${BMSpells.DIRE_BEAST_SUMMON}-${event.timestamp}-${nextSummonId()}`,
        destName: "Dire Beast",
        destRaidFlags: 0,
        spellId: BMSpells.DIRE_BEAST_SUMMON,
        spellName: "Dire Beast",
        spellSchool: 1,
      }),
    );
  },
);

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
