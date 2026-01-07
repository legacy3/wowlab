/**
 * Type definitions for the visual rotation editor.
 *
 * These types define the data structure that the visual GUI naturally produces.
 * The structure is designed to be:
 * 1. Easy to serialize to JSON for storage
 * 2. Convertible to a text-based DSL if needed
 * 3. Directly executable by the simulation engine
 */

// =============================================================================
// Target Selection Types
// =============================================================================

/** Simple target presets */
export type SimpleTarget = "self" | "current_target" | "focus" | "pet";

/** Target pool for filtering */
export type TargetPool = "enemies" | "allies" | "party" | "raid";

/** Comparison operators for filters */
export type ComparisonOp = "eq" | "neq" | "lt" | "lte" | "gt" | "gte";

/** Aggregation functions for selecting from filtered pool */
export type AggregateFunc = "min" | "max" | "first" | "random" | "count";

/** A single filter criterion */
export interface TargetFilter {
  id: string;
  /** The attribute to filter on */
  attribute: string; // e.g., "health_pct", "distance", "has_debuff", "time_to_die"
  /** Comparison operator */
  op: ComparisonOp;
  /** Value to compare against */
  value: number | string | boolean;
}

/** Complex target selection with filtering */
export interface FilteredTarget {
  pool: TargetPool;
  filters: TargetFilter[];
  /** How to select from the filtered pool */
  select: {
    func: AggregateFunc;
    /** Attribute to aggregate on (for min/max) */
    attribute?: string;
  };
}

/** Union type for all target selections */
export type TargetSelection = SimpleTarget | FilteredTarget;

// =============================================================================
// Condition Types
// =============================================================================

/** Condition operators for comparisons */
export type ConditionOp =
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "between"
  | "has"
  | "missing";

/** A single condition expression */
export interface ConditionExpression {
  id: string;
  type: "expression";
  /** Left-hand side - what to check */
  subject: string; // e.g., "player.health_pct", "target.debuffs.serpent_sting.remaining"
  /** Operator */
  op: ConditionOp;
  /** Right-hand side value(s) */
  value: number | string | boolean | [number, number]; // tuple for "between"
}

/** Logical AND group */
export interface ConditionAnd {
  id: string;
  type: "and";
  conditions: Condition[];
}

/** Logical OR group */
export interface ConditionOr {
  id: string;
  type: "or";
  conditions: Condition[];
}

/** Logical NOT wrapper */
export interface ConditionNot {
  id: string;
  type: "not";
  condition: Condition;
}

/** Union type for all condition nodes */
export type Condition =
  | ConditionExpression
  | ConditionAnd
  | ConditionOr
  | ConditionNot;

// =============================================================================
// Variable Types
// =============================================================================

/** Variable data types */
export type VariableType = "number" | "boolean" | "string";

/** Variable definition */
export interface VariableDefinition {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: number | boolean | string;
  description?: string;
}

/** Variable assignment action */
export interface VariableAssignment {
  variableId: string;
  /** Expression to evaluate - can reference other variables, player stats, etc. */
  expression: string;
}

// =============================================================================
// Action Types
// =============================================================================

/** Base action properties shared by all action types */
interface ActionBase {
  id: string;
  /** Optional label/name for the action */
  label?: string;
  /** Whether this action is enabled */
  enabled: boolean;
  /** Condition that must be met for this action to execute */
  condition?: Condition;
}

/** Cast a spell action */
export interface CastAction extends ActionBase {
  type: "cast";
  /** Spell ID to cast */
  spellId: number;
  /** Target for the spell */
  target: TargetSelection;
}

/** Set a variable action */
export interface SetVariableAction extends ActionBase {
  type: "set_variable";
  assignment: VariableAssignment;
}

/** Wait action (skip GCD) */
export interface WaitAction extends ActionBase {
  type: "wait";
  /** Duration in milliseconds (optional - defaults to next GCD) */
  duration?: number;
}

/** Call a reusable action group */
export interface CallGroupAction extends ActionBase {
  type: "call_group";
  /** ID of the action group to call */
  groupId: string;
}

/** Union of all action types */
export type Action =
  | CastAction
  | SetVariableAction
  | WaitAction
  | CallGroupAction;

// =============================================================================
// Action Group (Reusable Functions)
// =============================================================================

/** A reusable group of actions (like a function/subroutine) */
export interface ActionGroup {
  id: string;
  name: string;
  description?: string;
  /** Actions in this group (executed in order) */
  actions: Action[];
}

// =============================================================================
// Rotation Definition
// =============================================================================

/** Complete rotation definition */
export interface RotationDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Class/spec this rotation is for */
  specId: number;
  /** User-defined variables */
  variables: VariableDefinition[];
  /** Reusable action groups */
  groups: ActionGroup[];
  /** Main priority list - executed in order each GCD */
  actions: Action[];
}

// =============================================================================
// UI State Types (not persisted)
// =============================================================================

/** Current selection state in the editor */
export interface EditorSelection {
  type: "action" | "condition" | "variable" | "group";
  id: string;
}

/** Drag and drop state */
export interface DragState {
  type: "action" | "condition";
  id: string;
  sourceIndex: number;
}

// =============================================================================
// Spell Reference (for UI display)
// =============================================================================

/** Spell data for display purposes */
export interface SpellReference {
  id: number;
  name: string;
  icon: string;
  color?: string;
}
