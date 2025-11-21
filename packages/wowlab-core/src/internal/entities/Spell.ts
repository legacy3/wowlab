import { Record } from "immutable";

import * as Branded from "../schemas/Branded.js";
import * as SpellSchema from "../schemas/Spell.js";
import { boundedTransform, expiryTransform } from "./Transforms.js";

// ============================================================================
// SpellInfo
// ============================================================================

interface SpellInfoProps extends SpellSchema.SpellDataFlat {
  readonly modifiers: readonly any[]; // Placeholder for modifiers
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
      ...SpellInfoRecord().toObject(), // Ensure defaults are used
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

// ============================================================================
// Spell Entity
// ============================================================================

interface SpellComputedProps {
  readonly isReady: boolean;
}

interface SpellProps extends SpellComputedProps, SpellSourceProps {}

interface SpellSourceProps {
  readonly charges: number;
  readonly cooldownExpiry: number;
  readonly info: SpellInfo;
}

const SpellRecord = Record<SpellProps>({
  charges: 0,
  cooldownExpiry: 0,
  info: null as any,
  isReady: false,
});

export interface ComputedEntity<T, Source> {
  transform: any; // Simplify for now
  with(updates: Partial<Source>, currentTime: number): T;
}

export class Spell
  extends SpellRecord
  implements ComputedEntity<Spell, SpellSourceProps>
{
  static create(source: SpellSourceProps, currentTime: number): Spell {
    return new Spell({
      ...source,
      isReady: source.cooldownExpiry <= currentTime,
    });
  }

  get transform() {
    return {
      charges: boundedTransform(
        this.charges,
        0,
        this.info.maxCharges,
        (newCharges, currentTime) =>
          this.with({ charges: newCharges }, currentTime),
      ),

      cooldown: expiryTransform(this.cooldownExpiry, (newExpiry, currentTime) =>
        this.with({ cooldownExpiry: newExpiry }, currentTime),
      ),
    };
  }

  with(updates: Partial<SpellSourceProps>, currentTime: number): Spell {
    return Spell.create(
      {
        charges: updates.charges ?? this.charges,
        cooldownExpiry: updates.cooldownExpiry ?? this.cooldownExpiry,
        info: updates.info ?? this.info,
      },
      currentTime,
    );
  }
}

export const createNotFoundSpell = (id: Branded.SpellID): Spell => {
  const info = createNotFoundSpellInfo(id);
  return Spell.create(
    {
      charges: 0,
      cooldownExpiry: Infinity, // Never ready (not learned)
      info,
    },
    0,
  );
};
