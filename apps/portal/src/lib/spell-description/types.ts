import type { PlayerContext } from "@wowlab/parsers/SpellDescription";

export type SpellDescriptionKind = "description" | "auraDescription";

export interface RenderedSpellDescription {
  readonly spellId: number;
  readonly kind: SpellDescriptionKind;
  readonly raw: string;
  readonly text: string;
  readonly errors: readonly unknown[];
  readonly lexErrors: readonly unknown[];
}

// TODO Get this from dbc files / use actual player data + good default values
export const DEFAULT_PLAYER: PlayerContext = {
  activeAuras: new Set<number>(),
  attackPower: 25_000,
  classId: 0,
  gender: "male",
  intellect: 25_000,
  knownSpells: new Set<number>(),
  level: 80,
  maxHealth: 250_000,
  rangedAttackPower: 1_000,
  spellPower: 1_000,
  versatilityDamageBonus: 1_000,
};
