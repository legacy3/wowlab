import { atom } from "jotai";

import {
  SPELLS,
  SCHOOL_COLORS,
  getSpell,
  type SpellSchool,
  type SpellInfo,
} from "./constants";

export { SPELLS, SCHOOL_COLORS, getSpell, type SpellSchool, type SpellInfo };

export interface CastEvent {
  readonly type: "cast";
  readonly id: string;
  readonly spellId: number;
  readonly timestamp: number;
  readonly duration: number;
  readonly target?: string;
  readonly successful: boolean;
}

export interface BuffEvent {
  readonly type: "buff" | "debuff";
  readonly id: string;
  readonly spellId: number;
  readonly start: number;
  readonly end: number;
  readonly stacks?: number;
  readonly target: string;
}

export interface DamageEvent {
  readonly type: "damage";
  readonly id: string;
  readonly spellId: number;
  readonly timestamp: number;
  readonly amount: number;
  readonly isCrit: boolean;
  readonly target: string;
  readonly overkill?: number;
}

export interface ResourceEvent {
  readonly type: "resource";
  readonly id: string;
  readonly timestamp: number;
  readonly focus: number;
  readonly maxFocus: number;
}

export interface PhaseMarker {
  readonly type: "phase";
  readonly id: string;
  readonly name: string;
  readonly start: number;
  readonly end: number;
  readonly color: string;
}

export interface CombatData {
  readonly casts: CastEvent[];
  readonly buffs: BuffEvent[];
  readonly damage: DamageEvent[];
  readonly resources: ResourceEvent[];
  readonly phases: PhaseMarker[];
}

export interface TimelineBounds {
  readonly min: number;
  readonly max: number;
}

// Track configuration
export type TrackId =
  | "phases"
  | "casts"
  | "buffs"
  | "debuffs"
  | "damage"
  | "resources";

const DURATION = 600; // 10 minutes

export const createEmptyCombatData = (): CombatData => ({
  casts: [],
  buffs: [],
  damage: [],
  resources: [],
  phases: [],
});

export const combatDataAtom = atom<CombatData>(createEmptyCombatData());

export const timelineBoundsAtom = atom<TimelineBounds>({
  min: 0,
  max: DURATION,
});

export const playerBuffsAtom = atom((get) => {
  const data = get(combatDataAtom);
  return data.buffs.filter((b) => b.type === "buff" && b.target === "Player");
});

export const debuffsAtom = atom((get) => {
  const data = get(combatDataAtom);
  return data.buffs.filter((b) => b.type === "debuff");
});

export const buffsBySpellAtom = atom((get) => {
  const playerBuffs = get(playerBuffsAtom);
  const grouped = new Map<number, BuffEvent[]>();
  for (const buff of playerBuffs) {
    const existing = grouped.get(buff.spellId) ?? [];
    grouped.set(buff.spellId, [...existing, buff]);
  }
  return grouped;
});

export const uniqueSpellsAtom = atom((get) => {
  const data = get(combatDataAtom);
  const seen = new Set<number>();
  return data.casts
    .filter((c) => {
      if (seen.has(c.spellId)) return false;
      seen.add(c.spellId);
      return true;
    })
    .map((c) => SPELLS[c.spellId])
    .filter(Boolean);
});

export const maxDamageAtom = atom((get) => {
  const data = get(combatDataAtom);
  return Math.max(...data.damage.map((d) => d.amount));
});

export const expandedTracksAtom = atom<Set<TrackId>>(
  new Set<TrackId>([
    "phases",
    "casts",
    "buffs",
    "debuffs",
    "damage",
    "resources",
  ]),
);

export const selectedSpellAtom = atom<number | null>(null);
export const hoveredSpellAtom = atom<number | null>(null);
