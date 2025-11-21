import { Record } from "immutable";

import * as Branded from "../schemas/Branded.js";
import * as SpellSchema from "../schemas/Spell.js";
import {
  Bounded,
  boundedTransform,
  Expiry,
  expiryTransform,
} from "./Transforms.js";

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
  description: "",
  auraDescription: "",

  // Timing
  castTime: 0,
  recoveryTime: 0,
  startRecoveryTime: 1500,

  // Resources
  manaCost: 0,
  powerType: -1,
  powerCost: 0,
  powerCostPct: 0,

  // Charges (flattened)
  maxCharges: 0,
  chargeRecoveryTime: 0,

  // Range (flattened)
  rangeMax1: 0,
  rangeMin1: 0,
  rangeMax0: 0,
  rangeMin0: 0,

  // Geometry (flattened)
  coneDegrees: 0,
  radiusMax: 0,
  radiusMin: 0,

  // Damage/Defense (flattened)
  defenseType: 0,
  schoolMask: 0,

  // Scaling (flattened)
  bonusCoefficientFromAP: 0,
  effectBonusCoefficient: 0,

  // Interrupts (flattened)
  interruptAura0: 0,
  interruptAura1: 0,
  interruptChannel0: 0,
  interruptChannel1: 0,
  interruptFlags: 0,

  // Duration (flattened)
  duration: 0,
  maxDuration: 0,

  // Empower (flattened)
  canEmpower: false,
  empowerStages: [],

  // Mechanics (flattened)
  dispelType: 0,
  facingCasterFlags: 0,
  speed: 0,
  spellClassSet: 0,
  spellClassMask1: 0,
  spellClassMask2: 0,
  spellClassMask3: 0,
  spellClassMask4: 0,

  // Arrays
  attributes: [],
  implicitTarget: [],
  effectTriggerSpell: [],

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
  info: createNotFoundSpellInfo(Branded.SpellID(-1)),
  isReady: false,
});

export interface ComputedEntity<T, Source, Tr> {
  transform: Tr;
  with(updates: Partial<Source>, currentTime: number): T;
}

export interface SpellTransform {
  charges: Bounded<Spell>;
  cooldown: Expiry<Spell>;
}

export class Spell
  extends SpellRecord
  implements ComputedEntity<Spell, SpellSourceProps, SpellTransform>
{
  static create(source: SpellSourceProps, currentTime: number): Spell {
    return new Spell({
      ...source,
      isReady: source.cooldownExpiry <= currentTime,
    });
  }

  get transform(): SpellTransform {
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
