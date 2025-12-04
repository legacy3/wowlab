// Combat Timeline Data Types and Mock Data
// Designed to match WarcraftLogs quality visualization

export type TrackType =
  | "Casts"
  | "Buffs"
  | "Debuffs"
  | "Damage"
  | "Resources"
  | "Phases";

export interface SpellInfo {
  readonly id: number;
  readonly name: string;
  readonly icon: string;
  readonly school: SpellSchool;
  readonly color: string;
}

export type SpellSchool =
  | "physical"
  | "fire"
  | "nature"
  | "frost"
  | "shadow"
  | "arcane"
  | "holy";

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

export type TimelineEvent =
  | CastEvent
  | BuffEvent
  | DamageEvent
  | ResourceEvent
  | PhaseMarker;

// Hunter BM Spells
export const spells: Record<number, SpellInfo> = {
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
  // Pet abilities
  83381: {
    id: 83381,
    name: "Kill Command (Pet)",
    icon: "ability_hunter_killcommand",
    school: "physical",
    color: "#7C3AED",
  },
  // Buffs/Procs
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

// School colors for damage events
export const schoolColors: Record<SpellSchool, string> = {
  physical: "#FFCC00",
  fire: "#FF8000",
  nature: "#4DFF4D",
  frost: "#80FFFF",
  shadow: "#9966FF",
  arcane: "#FF66FF",
  holy: "#FFE680",
};

// Generate realistic combat data
function generateCombatData(): {
  casts: CastEvent[];
  buffs: BuffEvent[];
  damage: DamageEvent[];
  resources: ResourceEvent[];
  phases: PhaseMarker[];
} {
  const casts: CastEvent[] = [];
  const buffs: BuffEvent[] = [];
  const damage: DamageEvent[] = [];
  const resources: ResourceEvent[] = [];

  let idx = 0;
  const id = () => `evt-${idx++}`;

  // Target names
  const targets = [
    "Rashok",
    "Rashok",
    "Rashok",
    "Lava Wave",
    "Searing Slam Add",
  ];
  const getTarget = () => targets[Math.floor(Math.random() * 3)]; // Mostly boss

  // Phase markers (boss fight phases)
  const phases: PhaseMarker[] = [
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

  // Initial buffs
  buffs.push({
    type: "buff",
    id: id(),
    spellId: 19574, // Bestial Wrath
    start: 0,
    end: 15,
    target: "Player",
  });

  buffs.push({
    type: "buff",
    id: id(),
    spellId: 359844, // Call of the Wild
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
    // Resource snapshot
    resources.push({
      type: "resource",
      id: id(),
      timestamp: t,
      focus: Math.round(focus),
      maxFocus: 120,
    });

    // Barbed Shot recharge
    if (barbedShotCharges < 2) {
      barbedShotRecharge += gcd;
      if (barbedShotRecharge >= 12) {
        barbedShotCharges++;
        barbedShotRecharge = 0;
      }
    }

    // Frenzy buff management
    if (t > frenzyEnd && frenzyStacks > 0) {
      frenzyStacks = 0;
    }

    // Priority-based rotation
    let spellCast = 0;
    let castDuration = 0;
    let focusCost = 0;

    // Kill Command - highest priority if available
    if (Math.floor(t * 10) % 75 === 0 && focus >= 30) {
      spellCast = 34026;
      castDuration = 0;
      focusCost = 30;
    }
    // Barbed Shot - maintain frenzy or use charges
    else if (
      barbedShotCharges > 0 &&
      (frenzyEnd - t < 2 || barbedShotCharges === 2)
    ) {
      spellCast = 217200;
      castDuration = 0;
      focusCost = 0;
      barbedShotCharges--;
      frenzyStacks = Math.min(frenzyStacks + 1, 3);
      frenzyEnd = t + 8;

      // Add/refresh Frenzy buff
      const existingFrenzy = buffs.find(
        (b) => b.spellId === 272790 && b.end > t,
      );
      if (existingFrenzy) {
        // Update existing buff (simulated by adding new one that overlaps)
        buffs.push({
          type: "buff",
          id: id(),
          spellId: 272790,
          start: t,
          end: frenzyEnd,
          stacks: frenzyStacks,
          target: "Pet",
        });
      } else {
        buffs.push({
          type: "buff",
          id: id(),
          spellId: 272790,
          start: t,
          end: frenzyEnd,
          stacks: 1,
          target: "Pet",
        });
      }
    }
    // Cobra Shot - focus dump
    else if (focus >= 35) {
      spellCast = 193455;
      castDuration = 0;
      focusCost = 35;
    }

    if (spellCast > 0) {
      const spell = spells[spellCast];
      const target = getTarget();

      casts.push({
        type: "cast",
        id: id(),
        spellId: spellCast,
        timestamp: t,
        duration: castDuration,
        target,
        successful: true,
      });

      // Generate damage event
      const baseDamage =
        spellCast === 34026
          ? 180000
          : spellCast === 217200
            ? 95000
            : spellCast === 193455
              ? 120000
              : 50000;
      const variance = 0.1;
      const isCrit = Math.random() < 0.35;
      const dmg = Math.round(
        baseDamage * (1 + (Math.random() - 0.5) * variance) * (isCrit ? 2 : 1),
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

    // Focus regeneration
    focus = Math.min(120, focus + 10 * gcd);

    // Cooldown abilities
    // Bestial Wrath at 30s
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

    // Bloodshed at 20s and 45s
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

    // Defensive at 35s (Intermission recovery)
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

    // Interrupt at 27s (Intermission)
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

    // Kill Shot in execute (below 20% - simulate at t > 50)
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

  // Add Thrill of the Hunt procs
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

  return { casts, buffs, damage, resources, phases };
}

export const combatData = generateCombatData();

// Legacy compatibility exports
export interface CombatSegment {
  readonly id: string;
  readonly spellId: number;
  readonly spellName: string;
  readonly start: number;
  readonly end: number;
  readonly duration: number;
  readonly color: string;
  readonly track: "Abilities" | "Buffs" | "Defensives";
}

export const trackGroups: CombatSegment["track"][] = [
  "Abilities",
  "Buffs",
  "Defensives",
];

// Convert new format to legacy format for backward compat
export const combatSegments: CombatSegment[] = [
  ...combatData.casts.map((c) => ({
    id: c.id,
    spellId: c.spellId,
    spellName: spells[c.spellId]?.name ?? "Unknown",
    start: c.timestamp,
    end: c.timestamp + Math.max(c.duration, 0.8),
    duration: Math.max(c.duration, 0.8),
    color: spells[c.spellId]?.color ?? "#888",
    track: "Abilities" as const,
  })),
  ...combatData.buffs
    .filter((b) => b.type === "buff" && b.target === "Player")
    .map((b) => ({
      id: b.id,
      spellId: b.spellId,
      spellName: spells[b.spellId]?.name ?? "Unknown",
      start: b.start,
      end: b.end,
      duration: b.end - b.start,
      color: spells[b.spellId]?.color ?? "#888",
      track:
        b.spellId === 186265 ? ("Defensives" as const) : ("Buffs" as const),
    })),
];

export const timelineBounds = { min: 0, max: 60 };

// Utility functions
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
