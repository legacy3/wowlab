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

const aMurderOfCrows = handler(
  "bm:a-murder-of-crows",
  BMSpells.A_MURDER_OF_CROWS,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event),
        auraType: "DEBUFF",
        spellId: BMSpells.A_MURDER_OF_CROWS,
        spellName: "A Murder of Crows",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const barrage = handler("bm:barrage", BMSpells.BARRAGE, (event, emit) => {
  if (event.destGUID && event.destName) {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 1,
        spellId: BMSpells.BARRAGE,
        spellName: "Barrage",
        spellSchool: 1,
        ...DAMAGE_DEFAULTS,
      }),
    );
  }
});

const stampede = handler("bm:stampede", BMSpells.STAMPEDE, (event, emit) => {
  const t = event.timestamp;
  for (let i = 0; i < 5; i++) {
    emit(
      new CombatLog.SpellSummon({
        ...fromTrigger(event),
        destFlags: 0x2111,
        destGUID: `Creature-0-0-0-0-${BMSpells.STAMPEDE}-${t}-${nextSummonId()}`,
        destName: "Stampede Pet",
        destRaidFlags: 0,
        spellId: BMSpells.STAMPEDE,
        spellName: "Stampede",
        spellSchool: 1,
      }),
    );
  }
});

const aspectOfTheCheetah = handler(
  "hunter:aspect-of-the-cheetah",
  HunterSpells.ASPECT_OF_THE_CHEETAH,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: HunterSpells.ASPECT_OF_THE_CHEETAH,
        spellName: "Aspect of the Cheetah",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const aspectOfTheTurtle = handler(
  "hunter:aspect-of-the-turtle",
  HunterSpells.ASPECT_OF_THE_TURTLE,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: HunterSpells.ASPECT_OF_THE_TURTLE,
        spellName: "Aspect of the Turtle",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const counterShot = handler(
  "hunter:counter-shot",
  HunterSpells.COUNTER_SHOT,
  (event, emit) => {
    emit(
      new CombatLog.SpellInterrupt({
        ...fromTrigger(event),
        extraSchool: 0,
        extraSpellId: 0,
        extraSpellName: "",
        spellId: HunterSpells.COUNTER_SHOT,
        spellName: "Counter Shot",
        spellSchool: 1,
      }),
    );
  },
  { requiresTarget: true },
);

const disengage = handler(
  "hunter:disengage",
  HunterSpells.DISENGAGE,
  (event, emit) => {
    emit(
      new CombatLog.SpellCastSuccess({
        ...fromTrigger(event, { toSelf: true }),
        spellId: HunterSpells.DISENGAGE,
        spellName: "Disengage",
        spellSchool: 1,
      }),
    );
  },
);

const exhilaration = handler(
  "hunter:exhilaration",
  HunterSpells.EXHILARATION,
  (event, emit) => {
    emit(
      new CombatLog.SpellHeal({
        ...fromTrigger(event, { toSelf: true }),
        absorbed: 0,
        amount: 0,
        critical: false,
        overhealing: 0,
        spellId: HunterSpells.EXHILARATION,
        spellName: "Exhilaration",
        spellSchool: 8,
      }),
    );
  },
);

const feignDeath = handler(
  "hunter:feign-death",
  HunterSpells.FEIGN_DEATH,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: HunterSpells.FEIGN_DEATH,
        spellName: "Feign Death",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const flare = handler("hunter:flare", HunterSpells.FLARE, (event, emit) => {
  emit(
    new CombatLog.SpellCastSuccess({
      ...fromTrigger(event, { toSelf: true }),
      spellId: HunterSpells.FLARE,
      spellName: "Flare",
      spellSchool: 1,
    }),
  );
});

const freezingTrap = handler(
  "hunter:freezing-trap",
  HunterSpells.FREEZING_TRAP,
  (event, emit) => {
    emit(
      new CombatLog.SpellCastSuccess({
        ...fromTrigger(event, { toSelf: true }),
        spellId: HunterSpells.FREEZING_TRAP,
        spellName: "Freezing Trap",
        spellSchool: 4,
      }),
    );
  },
);

const misdirection = handler(
  "hunter:misdirection",
  HunterSpells.MISDIRECTION,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: HunterSpells.MISDIRECTION,
        spellName: "Misdirection",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const tarTrap = handler(
  "hunter:tar-trap",
  HunterSpells.TAR_TRAP,
  (event, emit) => {
    emit(
      new CombatLog.SpellCastSuccess({
        ...fromTrigger(event, { toSelf: true }),
        spellId: HunterSpells.TAR_TRAP,
        spellName: "Tar Trap",
        spellSchool: 1,
      }),
    );
  },
);

const tranquilizingShot = handler(
  "hunter:tranquilizing-shot",
  HunterSpells.TRANQUILIZING_SHOT,
  (event, emit) => {
    emit(
      new CombatLog.SpellDispel({
        ...fromTrigger(event),
        auraType: "BUFF",
        extraSchool: 0,
        extraSpellId: 0,
        extraSpellName: "",
        spellId: HunterSpells.TRANQUILIZING_SHOT,
        spellName: "Tranquilizing Shot",
        spellSchool: 8,
      }),
    );
  },
  { requiresTarget: true },
);

// Pack Leader Hero Talents
const viciousHunt = handler(
  "bm:vicious-hunt",
  BMSpells.VICIOUS_HUNT,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.VICIOUS_HUNT,
        spellName: "Vicious Hunt",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const howlOfThePack = handler(
  "bm:howl-of-the-pack",
  BMSpells.HOWL_OF_THE_PACK,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.HOWL_OF_THE_PACK,
        spellName: "Howl of the Pack",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const packCoordination = handler(
  "bm:pack-coordination",
  BMSpells.PACK_COORDINATION,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.PACK_COORDINATION,
        spellName: "Pack Coordination",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const frenziedTear = handler(
  "bm:frenzied-tear",
  BMSpells.FRENZIED_TEAR,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 1,
        spellId: BMSpells.FRENZIED_TEAR,
        spellName: "Frenzied Tear",
        spellSchool: 1,
        ...DAMAGE_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const furiousAssault = handler(
  "bm:furious-assault",
  BMSpells.FURIOUS_ASSAULT,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.FURIOUS_ASSAULT,
        spellName: "Furious Assault",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const wildAttacks = handler(
  "bm:wild-attacks",
  BMSpells.WILD_ATTACKS,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.WILD_ATTACKS,
        spellName: "Wild Attacks",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const cullTheHerd = handler(
  "bm:cull-the-herd",
  BMSpells.CULL_THE_HERD,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event),
        auraType: "DEBUFF",
        spellId: BMSpells.CULL_THE_HERD,
        spellName: "Cull the Herd",
        spellSchool: 1,
        ...AURA_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const denRecovery = handler(
  "bm:den-recovery",
  BMSpells.DEN_RECOVERY,
  (event, emit) => {
    emit(
      new CombatLog.SpellHeal({
        ...fromTrigger(event, { toSelf: true }),
        absorbed: 0,
        amount: 0,
        critical: false,
        overhealing: 0,
        spellId: BMSpells.DEN_RECOVERY,
        spellName: "Den Recovery",
        spellSchool: 8,
      }),
    );
  },
);

// Dark Ranger Hero Talents
const blackArrow = handler(
  "bm:black-arrow",
  BMSpells.BLACK_ARROW,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 32,
        spellId: BMSpells.BLACK_ARROW,
        spellName: "Black Arrow",
        spellSchool: 32,
        ...DAMAGE_DEFAULTS,
      }),
    );

    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event),
        auraType: "DEBUFF",
        spellId: BMSpells.BLACK_ARROW,
        spellName: "Black Arrow",
        spellSchool: 32,
        ...AURA_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const bleakPowder = handler(
  "bm:bleak-powder",
  BMSpells.BLEAK_POWDER,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event),
        auraType: "DEBUFF",
        spellId: BMSpells.BLEAK_POWDER,
        spellName: "Bleak Powder",
        spellSchool: 32,
        ...AURA_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const shadowHounds = handler(
  "bm:shadow-hounds",
  BMSpells.SHADOW_HOUNDS,
  (event, emit) => {
    emit(
      new CombatLog.SpellSummon({
        ...fromTrigger(event),
        destFlags: 0x2111,
        destGUID: `Creature-0-0-0-0-${BMSpells.SHADOW_HOUNDS}-${event.timestamp}-${nextSummonId()}`,
        destName: "Shadow Hound",
        destRaidFlags: 0,
        spellId: BMSpells.SHADOW_HOUNDS,
        spellName: "Shadow Hounds",
        spellSchool: 32,
      }),
    );
  },
);

const phantomPain = handler(
  "bm:phantom-pain",
  BMSpells.PHANTOM_PAIN,
  (event, emit) => {
    emit(
      new CombatLog.SpellDamage({
        ...fromTrigger(event),
        school: 32,
        spellId: BMSpells.PHANTOM_PAIN,
        spellName: "Phantom Pain",
        spellSchool: 32,
        ...DAMAGE_DEFAULTS,
      }),
    );
  },
  { requiresTarget: true },
);

const darknessCalls = handler(
  "bm:darkness-calls",
  BMSpells.DARKNESS_CALLS,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.DARKNESS_CALLS,
        spellName: "Darkness Calls",
        spellSchool: 32,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

const smokeScreen = handler(
  "bm:smoke-screen",
  BMSpells.SMOKE_SCREEN,
  (event, emit) => {
    emit(
      new CombatLog.SpellAuraApplied({
        ...fromTrigger(event, { toSelf: true }),
        auraType: "BUFF",
        spellId: BMSpells.SMOKE_SCREEN,
        spellName: "Smoke Screen",
        spellSchool: 32,
        ...AURA_DEFAULTS,
      }),
    );
  },
);

export const BeastMastery: SpecDefinition = {
  class: "hunter",
  handlers: [
    // Core rotational
    bestialWrath,
    barbedShot,
    killCommand,
    cobraShot,
    multiShot,
    killShot,

    // Cooldowns
    callOfTheWild,
    bloodshed,
    direBeast,

    // Talents
    aMurderOfCrows,
    barrage,
    stampede,

    // Utility
    aspectOfTheCheetah,
    aspectOfTheTurtle,
    counterShot,
    disengage,
    exhilaration,
    feignDeath,
    flare,
    freezingTrap,
    misdirection,
    tarTrap,
    tranquilizingShot,

    // Pack Leader Hero Talents
    viciousHunt,
    howlOfThePack,
    packCoordination,
    frenziedTear,
    furiousAssault,
    wildAttacks,
    cullTheHerd,
    denRecovery,

    // Dark Ranger Hero Talents
    blackArrow,
    bleakPowder,
    shadowHounds,
    phantomPain,
    darknessCalls,
    smokeScreen,
  ],
  id: "hunter:beast-mastery",
  name: "Beast Mastery",
};
