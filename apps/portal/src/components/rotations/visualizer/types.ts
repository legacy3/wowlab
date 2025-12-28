export interface SpellInfo {
  id: number;
  name: string;
  icon: string;
  color: string;
  cooldown: number;
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
  cooldowns: Map<number, number>;
  charges: Map<number, number>;
  buffs: Map<number, number>;
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
