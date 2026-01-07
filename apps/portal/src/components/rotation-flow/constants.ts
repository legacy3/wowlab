import type { SpellInfo, PaletteItem, ConditionSubject } from "./types";

// =============================================================================
// Node Styles
// =============================================================================

export const NODE_COLORS = {
  spell: "#f97316",
  condition: "#3b82f6",
  variable: "#22c55e",
  group: "#8b5cf6",
  start: "#10b981",
  comment: "#6b7280",
  reroute: "#9ca3af",
  frame: "#64748b",
  sequence: "#06b6d4",
} as const;

export const NODE_MIN_WIDTHS = {
  spell: 120,
  condition: 110,
  variable: 100,
  group: 110,
  comment: 80,
  sequence: 140,
} as const;

// Frame preset colors
export const FRAME_COLORS = [
  { name: "Slate", value: "#64748b" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
] as const;

// =============================================================================
// Mock Data
// =============================================================================

export const MOCK_SPELLS: SpellInfo[] = [
  { id: 56641, name: "Steady Shot", icon: "SS", color: "#4ade80", cooldown: 0, cost: 0 },
  { id: 34026, name: "Kill Command", icon: "KC", color: "#f97316", cooldown: 6000, cost: 30 },
  { id: 193455, name: "Cobra Shot", icon: "CS", color: "#22d3ee", cooldown: 0, cost: 35 },
  { id: 19434, name: "Aimed Shot", icon: "AS", color: "#a855f7", cooldown: 12000, cost: 35 },
  { id: 257620, name: "Multi-Shot", icon: "MS", color: "#eab308", cooldown: 0, cost: 40 },
  { id: 186270, name: "Raptor Strike", icon: "RS", color: "#ef4444", cooldown: 0, cost: 30 },
  { id: 131894, name: "A Murder of Crows", icon: "MC", color: "#8b5cf6", cooldown: 60000, cost: 30 },
  { id: 120360, name: "Barrage", icon: "BR", color: "#06b6d4", cooldown: 20000, cost: 60 },
];

export const CONDITION_SUBJECTS: ConditionSubject[] = [
  { value: "player.health_pct", label: "Player Health %", group: "Player" },
  { value: "player.focus", label: "Player Focus", group: "Player" },
  { value: "player.combo_points", label: "Combo Points", group: "Player" },
  { value: "player.gcd_remaining", label: "GCD Remaining", group: "Player" },
  { value: "target.health_pct", label: "Target Health %", group: "Target" },
  { value: "target.time_to_die", label: "Time to Die", group: "Target" },
  { value: "target.distance", label: "Target Distance", group: "Target" },
  { value: "spell.is_ready", label: "Spell Ready", group: "Spell" },
  { value: "spell.cooldown_remaining", label: "Cooldown Remaining", group: "Spell" },
  { value: "buff.active", label: "Buff Active", group: "Buffs" },
  { value: "buff.remaining", label: "Buff Remaining", group: "Buffs" },
  { value: "debuff.active", label: "Debuff Active", group: "Debuffs" },
  { value: "debuff.remaining", label: "Debuff Remaining", group: "Debuffs" },
  { value: "enemies.count", label: "Enemy Count", group: "Combat" },
  { value: "in_combat", label: "In Combat", group: "Combat" },
];

export const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "spell",
    label: "Spell",
    description: "Cast a spell",
    icon: "Zap",
    color: NODE_COLORS.spell,
    defaultData: {
      label: "Cast Spell",
      spellId: MOCK_SPELLS[0].id,
      spellName: MOCK_SPELLS[0].name,
      color: MOCK_SPELLS[0].color,
      target: "current_target",
      enabled: true,
    },
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branch logic",
    icon: "GitBranch",
    color: NODE_COLORS.condition,
    defaultData: {
      label: "If",
      conditionType: "if",
      subject: "player.health_pct",
      operator: "gt",
      value: 50,
    },
  },
  {
    type: "variable",
    label: "Variable",
    description: "Set value",
    icon: "Variable",
    color: NODE_COLORS.variable,
    defaultData: {
      label: "Set Variable",
      variableName: "my_var",
      variableType: "number",
      expression: "0",
    },
  },
  {
    type: "sequence",
    label: "Sequence",
    description: "Priority list",
    icon: "ListOrdered",
    color: NODE_COLORS.sequence,
    defaultData: {
      label: "Priority",
      items: [],
    },
  },
  {
    type: "group",
    label: "Group",
    description: "Subroutine",
    icon: "FolderOpen",
    color: NODE_COLORS.group,
    defaultData: {
      label: "Group",
      groupName: "Cooldowns",
      collapsed: false,
    },
  },
  {
    type: "frame",
    label: "Frame",
    description: "Visual group",
    icon: "Square",
    color: NODE_COLORS.frame,
    defaultData: {
      label: "Region",
      color: "#64748b",
      collapsed: false,
      width: 300,
      height: 200,
    },
  },
  {
    type: "reroute",
    label: "Reroute",
    description: "Wire junction",
    icon: "Circle",
    color: NODE_COLORS.reroute,
    defaultData: {},
  },
  {
    type: "comment",
    label: "Comment",
    description: "Note",
    icon: "MessageSquare",
    color: NODE_COLORS.comment,
    defaultData: {
      label: "Note",
      text: "...",
    },
  },
];

// =============================================================================
// Operator Labels
// =============================================================================

export const OPERATOR_LABELS: Record<string, string> = {
  eq: "=",
  neq: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};
