import { Record } from "immutable";

import type { ComputedEntity } from "./shared";

// Retail WoW rating conversions (linear, no DR)
export const RATING_PER_PERCENT: { [key: string]: number } = {
  avoidance: 543.9974,
  crit: 700,
  haste: 660,
  versatility: 780,
};

export const BASE_HP = 10_000_000;
export const HEALTH_PER_STAMINA = 20;
export const ARMOR_K_VALUE = 128_752;

interface PaperDollComputedProps {
  readonly armorPhysicalDr: number;
  readonly avoidancePercent: number;
  readonly critPercent: number;
  readonly hastePercent: number;
  readonly maxHealth: number;
  readonly versatilityPercent: number;
}

interface PaperDollProps extends PaperDollComputedProps, PaperDollSourceProps {}

interface PaperDollSourceProps {
  readonly armor: number;
  readonly avoidance: number;
  readonly class: string;
  readonly critRating: number;
  readonly hasteRating: number;
  readonly level: number;
  readonly mainStat: number;
  readonly masteryPercent: number;
  readonly stamina: number;
  readonly versatilityRating: number;
}

const PaperDollRecord = Record<PaperDollProps>({
  armor: 0,
  armorPhysicalDr: 0,
  avoidance: 0,
  avoidancePercent: 0,
  class: "",
  critPercent: 0,
  critRating: 0,
  hastePercent: 0,
  hasteRating: 0,
  level: 80,
  mainStat: 0,
  masteryPercent: 0,
  maxHealth: 0,
  stamina: 0,
  versatilityPercent: 0,
  versatilityRating: 0,
});

export class PaperDoll
  extends PaperDollRecord
  implements ComputedEntity<PaperDoll, PaperDollSourceProps>
{
  static create(source: PaperDollSourceProps): PaperDoll {
    const critPercent = source.critRating / RATING_PER_PERCENT.crit;
    const hastePercent = source.hasteRating / RATING_PER_PERCENT.haste;
    const versatilityPercent =
      source.versatilityRating / RATING_PER_PERCENT.versatility;
    const avoidancePercent = source.avoidance / RATING_PER_PERCENT.avoidance;
    const armorPhysicalDr = source.armor / (source.armor + ARMOR_K_VALUE);
    const maxHealth = BASE_HP + source.stamina * HEALTH_PER_STAMINA;

    return new PaperDoll({
      ...source,
      armorPhysicalDr,
      avoidancePercent,
      critPercent,
      hastePercent,
      maxHealth,
      versatilityPercent,
    });
  }

  with(
    updates: Partial<PaperDollSourceProps>,
    _currentTime: number,
  ): PaperDoll {
    return PaperDoll.create({
      armor: updates.armor ?? this.armor,
      avoidance: updates.avoidance ?? this.avoidance,
      class: updates.class ?? this.class,
      critRating: updates.critRating ?? this.critRating,
      hasteRating: updates.hasteRating ?? this.hasteRating,
      level: updates.level ?? this.level,
      mainStat: updates.mainStat ?? this.mainStat,
      masteryPercent: updates.masteryPercent ?? this.masteryPercent,
      stamina: updates.stamina ?? this.stamina,
      versatilityRating: updates.versatilityRating ?? this.versatilityRating,
    });
  }
}
