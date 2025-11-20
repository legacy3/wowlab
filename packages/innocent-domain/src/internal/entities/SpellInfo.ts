import * as Branded from "@packages/innocent-schemas/Branded";
import * as Spell from "@packages/innocent-schemas/Spell";
import { Record } from "immutable";

// import type { SpellModifier } from "./types/SpellModifier";

interface SpellInfoProps extends Spell.SpellDataFlat {
  readonly modifiers: readonly any[]; // SpellModifier[];
}

const SpellInfoRecord = Record<SpellInfoProps>({
  // Core
  iconName: "inv_misc_questionmark",
  id: Branded.SpellID(-1),
  name: "",

  // Timing
  castTime: 0,
  cooldown: 0,
  gcd: 1500,

  // Resources
  manaCost: 0,

  // Charges (flattened)
  maxCharges: 0,
  rechargeTime: 0,

  // Range (flattened)
  rangeAllyMax: 0,
  rangeAllyMin: 0,
  rangeEnemyMax: 0,
  rangeEnemyMin: 0,

  // Geometry (flattened)
  coneDegrees: 0,
  radius: [],

  // Damage/Defense (flattened)
  defenseType: 0,
  schoolMask: 0,

  // Scaling (flattened)
  scalingAttackPower: 0,
  scalingSpellPower: 0,

  // Interrupts (flattened)
  interruptAura0: 0,
  interruptAura1: 0,
  interruptChannel0: 0,
  interruptChannel1: 0,
  interruptFlags: 0,

  // Duration (flattened)
  duration: 0,
  durationMax: 0,

  // Empower (flattened)
  canEmpower: false,
  empowerStages: [],

  // Mechanics (flattened)
  dispelType: 0,
  facingFlags: 0,
  missileSpeed: 0,

  // Arrays
  attributes: [],
  targeting: [],
  triggers: [],

  // Modifiers
  modifiers: [],
});

export class SpellInfo extends SpellInfoRecord {
  static create(props: Partial<SpellInfoProps>): SpellInfo {
    return new SpellInfo({
      ...SpellInfoRecord(),
      ...props,
    });
  }

  with(updates: Partial<SpellInfoProps>): SpellInfo {
    return SpellInfo.create({
      ...this.toObject(),
      ...updates,
    });
  }
}

export const createNotFoundSpellInfo = (id: Branded.SpellID): SpellInfo =>
  SpellInfo.create({
    id,
    name: `Not Found (${id})`,
  });
