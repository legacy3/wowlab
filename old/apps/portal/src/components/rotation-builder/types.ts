import type { RuleGroupType } from "react-querybuilder";

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

/**
 * Action type discriminator.
 * - "spell": Cast a spell (e.g., kill_command)
 * - "call_action_list": Execute another action list (e.g., call cooldowns list)
 */
export type ActionType = "spell" | "call_action_list";

/**
 * A single action in the rotation.
 */
export interface Action {
  id: string;
  /** Action type - "spell" for abilities, "call_action_list" for sub-list execution */
  type: ActionType;
  /** For type="spell": the spell identifier. For type="call_action_list": the list name */
  spell: string;
  enabled: boolean;
  conditions: RuleGroupType;
}

/**
 * List type for special handling.
 * - "precombat": Runs once before combat, non-harmful actions only
 * - "main": The entry point for the rotation (root list)
 * - "sub": A callable sub-list invoked via call_action_list
 */
export type ListType = "precombat" | "main" | "sub";

/**
 * Metadata for an action list (without the actions themselves).
 * Used in the list panel UI.
 */
export interface ActionListInfo {
  id: string;
  name: string; // internal: "cooldowns"
  label: string; // display: "Cooldowns"
  /** Whether this is the default entry point list */
  isDefault?: boolean;
  /** The type of list - determines execution behavior */
  listType: ListType;
}

/**
 * Full action list with actions included.
 * Used in the main rotation state.
 */
export interface ActionListWithActions extends ActionListInfo {
  actions: Action[];
}

/**
 * Creates a default action with standard values.
 */
export function createDefaultAction(
  spell: string,
  type: ActionType = "spell",
): Omit<Action, "id"> {
  return {
    type,
    spell,
    enabled: true,
    conditions: { combinator: "and", rules: [] },
  };
}

/**
 * A variable definition for reuse in conditions.
 */
export interface Variable {
  id: string;
  name: string; // without $
  expression: string;
}

// -----------------------------------------------------------------------------
// Rotation Data (for export/preview)
// -----------------------------------------------------------------------------

/**
 * Action list in export format (for preview/JSON export).
 */
export interface ActionListExport {
  id: string;
  name: string;
  label: string;
  actions: Action[];
}

/**
 * Full rotation data for export and preview.
 */
export interface RotationData {
  specId: number | null;
  variables: Variable[];
  defaultList: string;
  actionLists: ActionListExport[];
}

// -----------------------------------------------------------------------------
// Re-export RuleGroupType for convenience
// -----------------------------------------------------------------------------

export type { RuleGroupType };
