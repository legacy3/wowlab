import type { RuleGroupType } from "react-querybuilder";

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

/**
 * A single action in the rotation.
 * Equivalent to a SimC line: `actions+=/kill_command,if=focus>=30`
 */
export interface Action {
  id: string;
  spell: string;
  enabled: boolean;
  conditions: RuleGroupType;
}

/**
 * Metadata for an action list (without the actions themselves).
 * Used in the list panel UI.
 */
export interface ActionListInfo {
  id: string;
  name: string; // internal: "cooldowns"
  label: string; // display: "Cooldowns"
  isDefault?: boolean;
}

/**
 * Full action list with actions included.
 * Used in the main rotation state.
 */
export interface ActionListWithActions extends ActionListInfo {
  actions: Action[];
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
  specName: string;
  variables: Variable[];
  defaultList: string;
  actionLists: ActionListExport[];
}

// -----------------------------------------------------------------------------
// Re-export RuleGroupType for convenience
// -----------------------------------------------------------------------------

export type { RuleGroupType };
