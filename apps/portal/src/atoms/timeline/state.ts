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

// Seeded random number generator for deterministic data
function createSeededRandom(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function generateCombatData(): CombatData {
  const casts: CastEvent[] = [];
  const buffs: BuffEvent[] = [];
  const damage: DamageEvent[] = [];
  const resources: ResourceEvent[] = [];

  // Use seeded random for deterministic output
  const random = createSeededRandom(42);

  let idx = 0;
  const id = () => `evt-${idx++}`;

  const targets = [
    "Rashok",
    "Rashok",
    "Rashok",
    "Lava Wave",
    "Searing Slam Add",
  ];
  const getTarget = () => targets[Math.floor(random() * 3)];

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

  // Cooldown tracking
  let lastBestialWrath = -90;
  let lastBloodshed = -45;
  let lastTurtle = -180;
  let lastCounterShot = -24;
  let lastCallOfTheWild = -120;
  let lastBarrage = -20;

  while (t < DURATION) {
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
      const isCrit = random() < 0.35;
      const dmg = Math.round(
        baseDamage * (1 + (random() - 0.5) * 0.1) * (isCrit ? 2 : 1),
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

    // Bestial Wrath (90s CD)
    if (t - lastBestialWrath >= 90) {
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
      lastBestialWrath = t;
    }

    // Bloodshed (45s CD)
    if (t - lastBloodshed >= 45) {
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
      lastBloodshed = t;
    }

    // Call of the Wild (2 min CD)
    if (t - lastCallOfTheWild >= 120) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 359844,
        timestamp: t,
        duration: 0,
        target: "Player",
        successful: true,
      });
      buffs.push({
        type: "buff",
        id: id(),
        spellId: 359844,
        start: t,
        end: t + 20,
        target: "Player",
      });
      // Dire Pack proc during Call of the Wild
      buffs.push({
        type: "buff",
        id: id(),
        spellId: 393777,
        start: t + 2,
        end: t + 20,
        target: "Player",
      });
      lastCallOfTheWild = t;
    }

    // Aspect of the Turtle (3 min CD, used during high damage phases)
    const inHighDamagePhase =
      (t >= 85 && t <= 95) ||
      (t >= 200 && t <= 210) ||
      (t >= 340 && t <= 350) ||
      (t >= 480 && t <= 490);
    if (inHighDamagePhase && t - lastTurtle >= 180) {
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
      lastTurtle = t;
    }

    // Counter Shot (24s CD, used at specific boss cast times)
    const bossIsCasting =
      (t >= 27 && t <= 28) ||
      (t >= 75 && t <= 76) ||
      (t >= 130 && t <= 131) ||
      (t >= 185 && t <= 186) ||
      (t >= 240 && t <= 241) ||
      (t >= 300 && t <= 301) ||
      (t >= 360 && t <= 361) ||
      (t >= 420 && t <= 421) ||
      (t >= 480 && t <= 481) ||
      (t >= 540 && t <= 541);
    if (bossIsCasting && t - lastCounterShot >= 24) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 147362,
        timestamp: t,
        duration: 0,
        target: "Rashok",
        successful: true,
      });
      lastCounterShot = t;
    }

    // Barrage (20s CD)
    if (t - lastBarrage >= 20 && focus >= 60) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 120360,
        timestamp: t,
        duration: 3,
        target: getTarget(),
        successful: true,
      });
      // Barrage does multiple hits
      for (let hit = 0; hit < 5; hit++) {
        const isCrit = random() < 0.3;
        damage.push({
          type: "damage",
          id: id(),
          spellId: 120360,
          timestamp: t + 0.3 * hit,
          amount: Math.round(45000 * (isCrit ? 2 : 1)),
          isCrit,
          target: targets[Math.floor(random() * targets.length)],
        });
      }
      lastBarrage = t;
      focus -= 60;
    }

    // Execute phase Kill Shots (target below 20%)
    if (t > DURATION * 0.8 && Math.floor(t * 10) % 60 === 0 && focus >= 10) {
      casts.push({
        type: "cast",
        id: id(),
        spellId: 53351,
        timestamp: t,
        duration: 0,
        target: getTarget(),
        successful: true,
      });

      const isCrit = random() < 0.45;
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

  // Thrill of the Hunt procs (every ~30 seconds throughout the fight)
  for (let procTime = 3; procTime < DURATION; procTime += 25 + random() * 10) {
    buffs.push({
      type: "buff",
      id: id(),
      spellId: 281036,
      start: procTime,
      end: procTime + 8,
      stacks: Math.floor(random() * 3) + 1,
      target: "Player",
    });
  }

  return { casts, buffs, damage, resources, phases: generatePhases() };
}

function generatePhases(): PhaseMarker[] {
  return [
    {
      type: "phase",
      id: "p1",
      name: "Phase 1",
      start: 0,
      end: 90,
      color: "#3B82F6",
    },
    {
      type: "phase",
      id: "p2",
      name: "Intermission 1",
      start: 90,
      end: 110,
      color: "#F59E0B",
    },
    {
      type: "phase",
      id: "p3",
      name: "Phase 2",
      start: 110,
      end: 210,
      color: "#EF4444",
    },
    {
      type: "phase",
      id: "p4",
      name: "Intermission 2",
      start: 210,
      end: 230,
      color: "#F59E0B",
    },
    {
      type: "phase",
      id: "p5",
      name: "Phase 3",
      start: 230,
      end: 350,
      color: "#8B5CF6",
    },
    {
      type: "phase",
      id: "p6",
      name: "Intermission 3",
      start: 350,
      end: 370,
      color: "#F59E0B",
    },
    {
      type: "phase",
      id: "p7",
      name: "Phase 4",
      start: 370,
      end: 480,
      color: "#10B981",
    },
    {
      type: "phase",
      id: "p8",
      name: "Burn Phase",
      start: 480,
      end: DURATION,
      color: "#DC2626",
    },
  ];
}

export const combatDataAtom = atom<CombatData>(generateCombatData());

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
