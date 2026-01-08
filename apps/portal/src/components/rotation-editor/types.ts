import type { RuleGroupType } from "react-querybuilder";

// -----------------------------------------------------------------------------
// Action Types
// -----------------------------------------------------------------------------

export type ActionType = "spell" | "call_action_list";

export interface Action {
  id: string;
  type: ActionType;
  spellId?: number; // For type="spell" - references spell_base.spell_id
  listId?: string; // For type="call_action_list" - references ActionList.id
  enabled: boolean;
  condition: RuleGroupType; // react-querybuilder condition tree
}

// -----------------------------------------------------------------------------
// Action List Types
// -----------------------------------------------------------------------------

export type ListType = "precombat" | "main" | "sub";

export interface ActionList {
  id: string;
  name: string; // Internal name: "cooldowns", "st", "aoe"
  label: string; // Display name: "Cooldowns", "Single Target", "AoE"
  listType: ListType;
  actions: Action[];
}

// -----------------------------------------------------------------------------
// Variable Types
// -----------------------------------------------------------------------------

export interface Variable {
  id: string;
  name: string; // Without $: "burst_phase"
  expression: string; // DSL expression: "aura.bloodlust.up | cooldown.bestial_wrath.remains < 3"
}

// -----------------------------------------------------------------------------
// Rotation Types
// -----------------------------------------------------------------------------

export interface Rotation {
  id: string;
  specId: number; // References chr_specialization.ID
  name: string;
  description: string;
  variables: Variable[];
  lists: ActionList[];
  defaultListId: string; // ID of the main entry point list
}

// For creating new rotations
export type RotationDraft = Omit<Rotation, "id">;

// For DB storage (JSON columns)
export interface RotationData {
  variables: Variable[];
  lists: ActionList[];
  defaultListId: string;
}

// -----------------------------------------------------------------------------
// List Info (for sidebar display without full actions)
// -----------------------------------------------------------------------------

export interface ListInfo {
  id: string;
  name: string;
  label: string;
  listType: ListType;
  actionCount: number;
  isDefault: boolean;
}

// -----------------------------------------------------------------------------
// Re-exports
// -----------------------------------------------------------------------------

export type { RuleGroupType };
