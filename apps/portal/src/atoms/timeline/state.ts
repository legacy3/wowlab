import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// =============================================================================
// Types
// =============================================================================

export type SpellSchool =
  | "physical"
  | "fire"
  | "nature"
  | "frost"
  | "shadow"
  | "arcane"
  | "holy";

export interface SpellInfo {
  readonly id: number;
  readonly name: string;
  readonly icon: string;
  readonly school: SpellSchool;
  readonly color: string;
}

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

// =============================================================================
// Spell Database (Hunter BM)
// =============================================================================

export const SPELLS: Record<number, SpellInfo> = {
  34026: {
    id: 34026,
    name: "Kill Command",
    icon: "ability_hunter_killcommand",
    school: "physical",
    color: "#7C3AED",
  },
  193455: {
    id: 193455,
    name: "Cobra Shot",
    icon: "ability_hunter_cobrashot",
    school: "nature",
    color: "#0EA5E9",
  },
  217200: {
    id: 217200,
    name: "Barbed Shot",
    icon: "ability_hunter_barbedshot",
    school: "physical",
    color: "#F97316",
  },
  19574: {
    id: 19574,
    name: "Bestial Wrath",
    icon: "ability_druid_ferociousbite",
    school: "physical",
    color: "#22C55E",
  },
  359844: {
    id: 359844,
    name: "Call of the Wild",
    icon: "ability_hunter_callofthewild",
    school: "nature",
    color: "#EAB308",
  },
  186265: {
    id: 186265,
    name: "Aspect of the Turtle",
    icon: "ability_hunter_aspectoftheturtle",
    school: "nature",
    color: "#06B6D4",
  },
  321530: {
    id: 321530,
    name: "Bloodshed",
    icon: "ability_hunter_bloodshed",
    school: "physical",
    color: "#EF4444",
  },
  53351: {
    id: 53351,
    name: "Kill Shot",
    icon: "ability_hunter_assassinate2",
    school: "physical",
    color: "#DC2626",
  },
  120360: {
    id: 120360,
    name: "Barrage",
    icon: "ability_hunter_barrage",
    school: "physical",
    color: "#8B5CF6",
  },
  147362: {
    id: 147362,
    name: "Counter Shot",
    icon: "ability_hunter_countershot",
    school: "physical",
    color: "#F59E0B",
  },
  83381: {
    id: 83381,
    name: "Kill Command (Pet)",
    icon: "ability_hunter_killcommand",
    school: "physical",
    color: "#7C3AED",
  },
  272790: {
    id: 272790,
    name: "Frenzy",
    icon: "ability_hunter_pet_frenzy",
    school: "physical",
    color: "#F97316",
  },
  281036: {
    id: 281036,
    name: "Thrill of the Hunt",
    icon: "ability_hunter_thrillofthehunt",
    school: "physical",
    color: "#10B981",
  },
  393777: {
    id: 393777,
    name: "Dire Pack",
    icon: "ability_hunter_direpack",
    school: "nature",
    color: "#84CC16",
  },
};

export const SCHOOL_COLORS: Record<SpellSchool, string> = {
  physical: "#FFCC00",
  fire: "#FF8000",
  nature: "#4DFF4D",
  frost: "#80FFFF",
  shadow: "#9966FF",
  arcane: "#FF66FF",
  holy: "#FFE680",
};

// =============================================================================
// Mock Data Generator
// =============================================================================

function generateCombatData(): CombatData {
  const casts: CastEvent[] = [];
  const buffs: BuffEvent[] = [];
  const damage: DamageEvent[] = [];
  const resources: ResourceEvent[] = [];

  let idx = 0;
  const id = () => `evt-${idx++}`;

  const targets = [
    "Rashok",
    "Rashok",
    "Rashok",
    "Lava Wave",
    "Searing Slam Add",
  ];
  const getTarget = () => targets[Math.floor(Math.random() * 3)];

  // Initial buffs
  buffs.push({
    type: "buff",
    id: id(),
    spellId: 19574,
    start: 0,
    end: 15,
    target: "Player",
  });

  buffs.push({
    type: "buff",
    id: id(),
    spellId: 359844,
    start: 0.1,
    end: 20,
    target: "Player",
  });

  // Generate rotation
  let t = 0.5;
  let focus = 100;
  const gcd = 1.5;
  let barbedShotCharges = 2;
  let barbedShotRecharge = 0;
  let frenzyStacks = 0;
  let frenzyEnd = 0;

  while (t < 60) {
    resources.push({
      type: "resource",
      id: id(),
      timestamp: t,
      focus: Math.round(focus),
      maxFocus: 120,
    });

    if (barbedShotCharges < 2) {
      barbedShotRecharge += gcd;
      if (barbedShotRecharge >= 12) {
        barbedShotCharges++;
        barbedShotRecharge = 0;
      }
    }

    if (t > frenzyEnd && frenzyStacks > 0) {
      frenzyStacks = 0;
    }

    let spellCast = 0;
    let focusCost = 0;

    if (Math.floor(t * 10) % 75 === 0 && focus >= 30) {
      spellCast = 34026;
      focusCost = 30;
    } else if (
      barbedShotCharges > 0 &&
      (frenzyEnd - t < 2 || barbedShotCharges === 2)
    ) {
      spellCast = 217200;
      focusCost = 0;
      barbedShotCharges--;
      frenzyStacks = Math.min(frenzyStacks + 1, 3);
      frenzyEnd = t + 8;

      buffs.push({
        type: "buff",
        id: id(),
        spellId: 272790,
        start: t,
        end: frenzyEnd,
        stacks: frenzyStacks,
        target: "Pet",
      });
    } else if (focus >= 35) {
      spellCast = 193455;
      focusCost = 35;
    }

    if (spellCast > 0) {
      const target = getTarget();

      casts.push({
        type: "cast",
        id: id(),
        spellId: spellCast,
        timestamp: t,
        duration: 0,
        target,
        successful: true,
      });

      const baseDamage =
        spellCast === 34026 ? 180000 : spellCast === 217200 ? 95000 : 120000;
      const isCrit = Math.random() < 0.35;
      const dmg = Math.round(
        baseDamage * (1 + (Math.random() - 0.5) * 0.1) * (isCrit ? 2 : 1),
      );

      damage.push({
        type: "damage",
        id: id(),
        spellId: spellCast,
        timestamp: t + 0.1,
        amount: dmg,
        isCrit,
        target,
      });

      focus -= focusCost;
    }

    focus = Math.min(120, focus + 10 * gcd);

    // Cooldowns
    if (Math.abs(t - 30) < 0.1) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 19574,
        timestamp: t,
        duration: 0,
        target: "Player",
        successful: true,
      });
      buffs.push({
        type: "buff",
        id: id(),
        spellId: 19574,
        start: t,
        end: t + 15,
        target: "Player",
      });
    }

    if (Math.abs(t - 20) < 0.1 || Math.abs(t - 45) < 0.1) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 321530,
        timestamp: t,
        duration: 0,
        target: getTarget(),
        successful: true,
      });
      buffs.push({
        type: "debuff",
        id: id(),
        spellId: 321530,
        start: t,
        end: t + 12,
        target: "Rashok",
      });
    }

    if (Math.abs(t - 35) < 0.1) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 186265,
        timestamp: t,
        duration: 0,
        target: "Player",
        successful: true,
      });
      buffs.push({
        type: "buff",
        id: id(),
        spellId: 186265,
        start: t,
        end: t + 8,
        target: "Player",
      });
    }

    if (Math.abs(t - 27) < 0.1) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 147362,
        timestamp: t,
        duration: 0,
        target: "Rashok",
        successful: true,
      });
    }

    if (t > 50 && Math.floor(t * 10) % 100 === 0 && focus >= 10) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 53351,
        timestamp: t,
        duration: 0,
        target: getTarget(),
        successful: true,
      });

      const isCrit = Math.random() < 0.45;
      damage.push({
        type: "damage",
        id: id(),
        spellId: 53351,
        timestamp: t + 0.1,
        amount: Math.round(350000 * (isCrit ? 2 : 1)),
        isCrit,
        target: "Rashok",
      });
    }

    t += gcd;
  }

  // Thrill of the Hunt procs
  [3, 12, 24, 38, 52].forEach((procTime) => {
    buffs.push({
      type: "buff",
      id: id(),
      spellId: 281036,
      start: procTime,
      end: procTime + 8,
      stacks: 3,
      target: "Player",
    });
  });

  return { casts, buffs, damage, resources, phases: generatePhases() };
}

function generatePhases(): PhaseMarker[] {
  return [
    {
      type: "phase",
      id: "p1",
      name: "Phase 1",
      start: 0,
      end: 25,
      color: "#3B82F6",
    },
    {
      type: "phase",
      id: "p2",
      name: "Intermission",
      start: 25,
      end: 32,
      color: "#F59E0B",
    },
    {
      type: "phase",
      id: "p3",
      name: "Phase 2",
      start: 32,
      end: 60,
      color: "#EF4444",
    },
  ];
}

// =============================================================================
// Atoms
// =============================================================================

// Combat data atom
export const combatDataAtom = atom<CombatData>(generateCombatData());

// Timeline bounds
export const timelineBoundsAtom = atom<TimelineBounds>({ min: 0, max: 60 });

// Derived atoms for filtered data
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

// UI State atoms
export const expandedTracksAtom = atomWithStorage<Set<TrackId>>(
  "timeline-expanded-tracks",
  new Set(["phases", "casts", "buffs", "debuffs", "damage", "resources"]),
  {
    getItem: (key, initialValue) => {
      const stored = localStorage.getItem(key);
      if (!stored) return initialValue;
      try {
        return new Set(JSON.parse(stored) as TrackId[]);
      } catch {
        return initialValue;
      }
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify([...value]));
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  },
);

export const selectedSpellAtom = atom<number | null>(null);
export const hoveredSpellAtom = atom<number | null>(null);

// View range (controlled by zoom)
export const viewRangeAtom = atom({ start: 0, end: 60 });

// =============================================================================
// Utility Functions
// =============================================================================

export function formatDamage(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toString();
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(1).padStart(4, "0")}`;
  }
  return `${secs.toFixed(1)}s`;
}

export function getSpell(spellId: number): SpellInfo | undefined {
  return SPELLS[spellId];
}
