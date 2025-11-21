import { Record } from "immutable";

interface PaperDollProps {
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
  avoidance: 0,
  class: "Unknown",
  critRating: 0,
  hasteRating: 0,
  level: 0,
  mainStat: 0,
  masteryPercent: 0,
  stamina: 0,
  versatilityRating: 0,
});

export class PaperDoll extends PaperDollRecord {
  static create(props: Partial<PaperDollProps>): PaperDoll {
    return new PaperDoll(props);
  }
}
