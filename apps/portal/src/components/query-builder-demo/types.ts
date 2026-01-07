import type { Field, RuleGroupType } from "react-querybuilder";

import {
  BM_HUNTER_SPELL_OPTIONS,
  BM_HUNTER_AURA_OPTIONS,
  BM_HUNTER_TALENT_OPTIONS,
  createOption,
} from "@/components/rotation-builder/data";

// -----------------------------------------------------------------------------
// Core Types - Action-based model (like SimC)
// Note: These types are also defined in rotation-builder/types.ts
// The rotation-builder types are the canonical source; these are kept for
// backwards compatibility with the demo components.
// -----------------------------------------------------------------------------

/**
 * A single action in the rotation.
 * Think of it like a SimC line: `actions+=/kill_command,if=focus>=30`
 */
export interface ActionEntry {
  id: string;
  spell: string; // The spell to cast (e.g., "kill_command")
  enabled: boolean;
  conditions: RuleGroupType; // When to cast it
}

/**
 * An action list groups related actions.
 * Like SimC's `actions.cooldowns`, `actions.aoe`, etc.
 */
export interface ActionList {
  id: string;
  name: string; // Internal name (e.g., "cooldowns")
  label: string; // Display name (e.g., "Cooldowns")
  actions: ActionEntry[];
}

/**
 * Complete rotation configuration.
 */
export interface RotationConfig {
  defaultList: string; // Which list is the main entry point
  actionLists: ActionList[];
}

// Legacy type for react-querybuilder compatibility
export type RotationRuleGroup = RuleGroupType;

// -----------------------------------------------------------------------------
// Condition Field Types
// -----------------------------------------------------------------------------

export type ConditionFieldName =
  | "cooldown_ready"
  | "focus"
  | "aura_active"
  | "aura_stacks"
  | "aura_remaining"
  | "target_health"
  | "charges"
  | "combo_points"
  | "talent_enabled";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Creates a field definition with sensible defaults */
const selectField = (
  name: ConditionFieldName,
  label: string,
  values: ReturnType<typeof createOption>[],
  defaultValue: string
): Field => ({
  name,
  value: name,
  label,
  valueEditorType: "select",
  values,
  defaultOperator: "=",
  defaultValue,
});

const numberField = (
  name: ConditionFieldName,
  label: string,
  defaultOperator: string,
  defaultValue: string
): Field => ({
  name,
  value: name,
  label,
  inputType: "number",
  defaultOperator,
  defaultValue,
});

// -----------------------------------------------------------------------------
// Option Lists (re-exported from shared data)
// -----------------------------------------------------------------------------

export const SPELLS = BM_HUNTER_SPELL_OPTIONS;
export const AURAS = BM_HUNTER_AURA_OPTIONS;
export const TALENTS = BM_HUNTER_TALENT_OPTIONS;

// -----------------------------------------------------------------------------
// Field Definitions
// -----------------------------------------------------------------------------

export const CONDITION_FIELDS: Field[] = [
  // Cooldown checks
  selectField("cooldown_ready", "Cooldown Ready", [...SPELLS], "kill_command"),
  // Resource checks
  numberField("focus", "Focus", ">=", "30"),
  // Aura/buff checks
  selectField("aura_active", "Aura Active", [...AURAS], "bestial_wrath"),
  numberField("aura_stacks", "Frenzy Stacks", ">=", "3"),
  numberField("aura_remaining", "Buff Remaining (sec)", ">=", "5"),
  // Target checks
  numberField("target_health", "Target Health %", "<", "20"),
  // Ability charges
  numberField("charges", "Barbed Shot Charges", ">=", "1"),
  // Combo points (for other specs)
  numberField("combo_points", "Combo Points", ">=", "5"),
  // Talent checks
  selectField("talent_enabled", "Talent Enabled", [...TALENTS], "killer_instinct"),
];

// -----------------------------------------------------------------------------
// Operators
// -----------------------------------------------------------------------------

export const COMPARISON_OPERATORS = [
  createOption("=", "="),
  createOption("!=", "!="),
  createOption(">", ">"),
  createOption(">=", ">="),
  createOption("<", "<"),
  createOption("<=", "<="),
];

export const BOOLEAN_OPERATORS = [
  createOption("=", "is true"),
  createOption("!=", "is false"),
];

const BOOLEAN_FIELDS: ConditionFieldName[] = [
  "cooldown_ready",
  "aura_active",
  "talent_enabled",
];

export function getOperatorsForField(fieldName: ConditionFieldName) {
  return BOOLEAN_FIELDS.includes(fieldName)
    ? BOOLEAN_OPERATORS
    : COMPARISON_OPERATORS;
}

// -----------------------------------------------------------------------------
// Action Lists - Predefined lists like SimC
// -----------------------------------------------------------------------------

export const ACTION_LISTS = [
  createOption("default", "Default"),
  createOption("precombat", "Precombat"),
  createOption("cooldowns", "Cooldowns"),
  createOption("aoe", "AoE"),
  createOption("st", "Single Target"),
  createOption("cleave", "Cleave"),
] as const;

// -----------------------------------------------------------------------------
// Initial Rotation - Full BM Hunter Priority
// Models: crates/engine/rotations/bm_hunter.rhai
//
// Structure: Each action = spell + conditions (like SimC)
// -----------------------------------------------------------------------------

let actionId = 0;
const makeId = () => `action-${++actionId}`;

export const INITIAL_ROTATION: RotationConfig = {
  defaultList: "default",
  actionLists: [
    {
      id: "list-default",
      name: "default",
      label: "Default",
      actions: [
        {
          id: makeId(),
          spell: "bestial_wrath",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [], // No conditions = always cast when ready
          },
        },
        {
          id: makeId(),
          spell: "kill_command",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              { field: "focus", operator: ">=", value: "30" },
            ],
          },
        },
        {
          id: makeId(),
          spell: "barbed_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              { field: "charges", operator: ">=", value: "1" },
            ],
          },
        },
        {
          id: makeId(),
          spell: "cobra_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              { field: "focus", operator: ">=", value: "35" },
            ],
          },
        },
      ],
    },
    {
      id: "list-cooldowns",
      name: "cooldowns",
      label: "Cooldowns",
      actions: [
        {
          id: makeId(),
          spell: "call_of_the_wild",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              { field: "aura_active", operator: "=", value: "bestial_wrath" },
            ],
          },
        },
        {
          id: makeId(),
          spell: "bloodshed",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [],
          },
        },
      ],
    },
  ],
};

// Legacy export for backwards compat
export const INITIAL_QUERY: RotationRuleGroup = {
  combinator: "or",
  rules: INITIAL_ROTATION.actionLists[0].actions.map((a) => ({
    ...a.conditions,
    id: a.id,
  })),
};
