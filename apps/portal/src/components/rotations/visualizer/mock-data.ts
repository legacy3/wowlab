/**
 * Mock data for rotation visualizer development.
 * This will be replaced with real rotation parsing later.
 */

export interface SpellInfo {
  id: number;
  name: string;
  icon: string;
  color: string;
  cooldown: number; // in seconds, 0 = no cooldown
  isOffGCD: boolean;
}

export interface PriorityCondition {
  type: "cooldown" | "resource" | "buff" | "health" | "charges" | "always";
  description: string;
  check: (state: SimulationState) => boolean;
}

export interface PriorityEntry {
  spell: SpellInfo;
  priority: number;
  conditions: PriorityCondition[];
}

export interface SimulationState {
  time: number;
  focus: number;
  maxFocus: number;
  gcdReady: boolean;
  targetHealth: number;
  cooldowns: Map<number, number>; // spellId -> remaining CD
  charges: Map<number, number>; // spellId -> current charges
  buffs: Map<number, number>; // buffId -> remaining duration
}

export interface DecisionStep {
  time: number;
  spellId: number;
  spellName: string;
  result: "cast" | "skipped";
  reason: string;
  stateSnapshot: {
    focus: number;
    gcdReady: boolean;
    cooldownRemaining?: number;
    charges?: number;
    buffActive?: boolean;
  };
}

export interface PlaybackFrame {
  time: number;
  state: SimulationState;
  currentPriority: number;
  decisions: DecisionStep[];
  castSpellId: number | null;
}

// Beast Mastery Hunter spells with real icon names
export const MOCK_SPELLS: SpellInfo[] = [
  {
    id: 19574,
    name: "Bestial Wrath",
    icon: "ability_druid_ferociousbite",
    color: "#C41F3B",
    cooldown: 90,
    isOffGCD: true,
  },
  {
    id: 359844,
    name: "Call of the Wild",
    icon: "ability_hunter_invigeration",
    color: "#FF7D0A",
    cooldown: 120,
    isOffGCD: true,
  },
  {
    id: 217200,
    name: "Barbed Shot",
    icon: "ability_hunter_barbedshot",
    color: "#ABD473",
    cooldown: 12,
    isOffGCD: false,
  },
  {
    id: 321530,
    name: "Bloodshed",
    icon: "ability_hunter_invigeration",
    color: "#C41F3B",
    cooldown: 60,
    isOffGCD: false,
  },
  {
    id: 53351,
    name: "Kill Shot",
    icon: "ability_hunter_assassinate2",
    color: "#FF4444",
    cooldown: 10,
    isOffGCD: false,
  },
  {
    id: 34026,
    name: "Kill Command",
    icon: "ability_hunter_killcommand",
    color: "#A330C9",
    cooldown: 7.5,
    isOffGCD: false,
  },
  {
    id: 212431,
    name: "Explosive Shot",
    icon: "ability_hunter_explosiveshot",
    color: "#FF8C00",
    cooldown: 30,
    isOffGCD: false,
  },
  {
    id: 193455,
    name: "Cobra Shot",
    icon: "ability_hunter_cobrashot",
    color: "#69CCF0",
    cooldown: 0,
    isOffGCD: false,
  },
];

export const MOCK_PRIORITY_LIST: PriorityEntry[] = [
  {
    spell: MOCK_SPELLS[0], // Bestial Wrath
    priority: 1,
    conditions: [
      {
        type: "cooldown",
        description: "Off cooldown",
        check: (state) => (state.cooldowns.get(19574) ?? 0) <= 0,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[1], // Call of the Wild
    priority: 2,
    conditions: [
      {
        type: "cooldown",
        description: "Off cooldown",
        check: (state) => (state.cooldowns.get(359844) ?? 0) <= 0,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[2], // Barbed Shot
    priority: 3,
    conditions: [
      {
        type: "charges",
        description: "Has charges",
        check: (state) => (state.charges.get(217200) ?? 0) > 0,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[3], // Bloodshed
    priority: 4,
    conditions: [
      {
        type: "cooldown",
        description: "Off cooldown",
        check: (state) => (state.cooldowns.get(321530) ?? 0) <= 0,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[4], // Kill Shot
    priority: 5,
    conditions: [
      {
        type: "health",
        description: "Target below 20% HP",
        check: (state) => state.targetHealth <= 20,
      },
      {
        type: "cooldown",
        description: "Off cooldown",
        check: (state) => (state.cooldowns.get(53351) ?? 0) <= 0,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[5], // Kill Command
    priority: 6,
    conditions: [
      {
        type: "cooldown",
        description: "Off cooldown",
        check: (state) => (state.cooldowns.get(34026) ?? 0) <= 0,
      },
      {
        type: "resource",
        description: "30+ Focus",
        check: (state) => state.focus >= 30,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[6], // Explosive Shot
    priority: 7,
    conditions: [
      {
        type: "cooldown",
        description: "Off cooldown",
        check: (state) => (state.cooldowns.get(212431) ?? 0) <= 0,
      },
    ],
  },
  {
    spell: MOCK_SPELLS[7], // Cobra Shot
    priority: 8,
    conditions: [
      {
        type: "resource",
        description: "35+ Focus",
        check: (state) => state.focus >= 35,
      },
      {
        type: "always",
        description: "Filler",
        check: () => true,
      },
    ],
  },
];

// Generate mock playback frames
export function generateMockPlayback(durationSeconds: number): PlaybackFrame[] {
  const frames: PlaybackFrame[] = [];
  const gcdDuration = 1.5;
  let time = 0;

  // Initialize state
  const state: SimulationState = {
    time: 0,
    focus: 100,
    maxFocus: 120,
    gcdReady: true,
    targetHealth: 100,
    cooldowns: new Map(),
    charges: new Map([[217200, 2]]), // Barbed Shot starts with 2 charges
    buffs: new Map(),
  };

  while (time < durationSeconds) {
    const decisions: DecisionStep[] = [];
    let castSpellId: number | null = null;
    let currentPriority = 0;

    // Simulate priority evaluation
    for (const entry of MOCK_PRIORITY_LIST) {
      currentPriority = entry.priority;
      const cooldownRemaining = state.cooldowns.get(entry.spell.id) ?? 0;
      const charges = state.charges.get(entry.spell.id);

      // Check all conditions
      let canCast = true;
      let skipReason = "";

      for (const condition of entry.conditions) {
        if (!condition.check(state)) {
          canCast = false;
          skipReason = condition.description;
          break;
        }
      }

      const decision: DecisionStep = {
        time,
        spellId: entry.spell.id,
        spellName: entry.spell.name,
        result: canCast ? "cast" : "skipped",
        reason: canCast ? "All conditions met" : `Failed: ${skipReason}`,
        stateSnapshot: {
          focus: state.focus,
          gcdReady: state.gcdReady,
          cooldownRemaining:
            cooldownRemaining > 0 ? cooldownRemaining : undefined,
          charges,
        },
      };
      decisions.push(decision);

      if (canCast) {
        castSpellId = entry.spell.id;

        // Apply spell effects
        if (entry.spell.cooldown > 0) {
          state.cooldowns.set(entry.spell.id, entry.spell.cooldown);
        }

        // Consume charge for Barbed Shot
        if (entry.spell.id === 217200) {
          state.charges.set(217200, (state.charges.get(217200) ?? 1) - 1);
        }

        // Focus cost simulation
        if (entry.spell.id === 34026) state.focus -= 30;
        if (entry.spell.id === 193455) state.focus -= 35;

        break;
      }
    }

    frames.push({
      time,
      state: {
        ...state,
        cooldowns: new Map(state.cooldowns),
        charges: new Map(state.charges),
      },
      currentPriority,
      decisions,
      castSpellId,
    });

    // Advance time
    time += gcdDuration;

    // Update cooldowns
    for (const [spellId, remaining] of state.cooldowns) {
      const newRemaining = Math.max(0, remaining - gcdDuration);
      if (newRemaining > 0) {
        state.cooldowns.set(spellId, newRemaining);
      } else {
        state.cooldowns.delete(spellId);
      }
    }

    // Regenerate focus
    state.focus = Math.min(state.maxFocus, state.focus + 10 * gcdDuration);

    // Regenerate Barbed Shot charges (simplified)
    if ((state.charges.get(217200) ?? 0) < 2 && Math.random() > 0.7) {
      state.charges.set(217200, (state.charges.get(217200) ?? 0) + 1);
    }

    // Simulate target health decay for Kill Shot demo
    if (time > durationSeconds * 0.8) {
      state.targetHealth = Math.max(
        0,
        100 - ((time - durationSeconds * 0.8) / (durationSeconds * 0.2)) * 100,
      );
    }
  }

  return frames;
}

// Pre-generate mock data
export const MOCK_PLAYBACK = generateMockPlayback(30);
