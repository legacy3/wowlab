"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { RuleGroupType } from "react-querybuilder";

// =============================================================================
// Types
// =============================================================================

export interface Variable {
  id: string;
  name: string;
  expression: string;
}

/**
 * Action type discriminator.
 * - "spell": Cast a spell
 * - "call_action_list": Execute another action list
 */
export type ActionType = "spell" | "call_action_list";

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

export interface ActionListWithActions {
  id: string;
  name: string;
  label: string;
  /** @deprecated Use listType instead */
  isDefault?: boolean;
  /** The type of list - determines execution behavior */
  listType: ListType;
  actions: Action[];
}

// =============================================================================
// Initial State Factory
// =============================================================================

function createDefaultActionLists(): ActionListWithActions[] {
  return [
    // Precombat - runs once before pull
    {
      id: "list-precombat",
      name: "precombat",
      label: "Precombat",
      listType: "precombat",
      actions: [
        {
          id: "action-pre-1",
          type: "spell",
          spell: "aspect_of_the_wild",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    // Main rotation - entry point that calls sub-lists
    {
      id: "list-main",
      name: "main",
      label: "Main",
      listType: "main",
      isDefault: true,
      actions: [
        // Call cooldowns list when burst conditions are met
        {
          id: "action-main-1",
          type: "call_action_list",
          spell: "cooldowns",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "variable", operator: "=", value: "burst_phase" }],
          },
        },
        // Call AoE list when multiple targets
        {
          id: "action-main-2",
          type: "call_action_list",
          spell: "aoe",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "active_enemies", operator: ">=", value: "3" }],
          },
        },
        // Call ST list for single target
        {
          id: "action-main-3",
          type: "call_action_list",
          spell: "st",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    // Cooldowns sub-list
    {
      id: "list-cooldowns",
      name: "cooldowns",
      label: "Cooldowns",
      listType: "sub",
      actions: [
        {
          id: "action-cd-1",
          type: "spell",
          spell: "bestial_wrath",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              {
                field: "cooldown_ready",
                operator: "=",
                value: "bestial_wrath",
              },
            ],
          },
        },
        {
          id: "action-cd-2",
          type: "spell",
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
          id: "action-cd-3",
          type: "spell",
          spell: "bloodshed",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    // AoE sub-list
    {
      id: "list-aoe",
      name: "aoe",
      label: "AoE",
      listType: "sub",
      actions: [
        {
          id: "action-aoe-1",
          type: "spell",
          spell: "multi_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "aura_remaining", operator: "<", value: "2" }],
          },
        },
        {
          id: "action-aoe-2",
          type: "spell",
          spell: "barbed_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "charges", operator: ">=", value: "1" }],
          },
        },
        {
          id: "action-aoe-3",
          type: "spell",
          spell: "kill_command",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    // Single Target sub-list
    {
      id: "list-st",
      name: "st",
      label: "Single Target",
      listType: "sub",
      actions: [
        {
          id: "action-st-1",
          type: "spell",
          spell: "kill_command",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "focus", operator: ">=", value: "30" }],
          },
        },
        {
          id: "action-st-2",
          type: "spell",
          spell: "barbed_shot",
          enabled: true,
          conditions: {
            combinator: "or",
            rules: [
              { field: "charges", operator: ">=", value: "2" },
              { field: "aura_remaining", operator: "<", value: "2" },
            ],
          },
        },
        {
          id: "action-st-3",
          type: "spell",
          spell: "cobra_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              { field: "focus", operator: ">=", value: "50" },
              { field: "variable", operator: "=", value: "pooling" },
            ],
          },
        },
        {
          id: "action-st-4",
          type: "spell",
          spell: "cobra_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "focus", operator: ">=", value: "35" }],
          },
        },
      ],
    },
  ];
}

function createDefaultVariables(): Variable[] {
  return [
    {
      id: "var-init-1",
      name: "burst_phase",
      expression: "aura.bloodlust.up | aura.bestial_wrath.up",
    },
    {
      id: "var-init-2",
      name: "pooling",
      expression: "cooldown.bestial_wrath.remains < 3",
    },
  ];
}

// Beast Mastery Hunter spec ID
const DEFAULT_SPEC_ID = 253;

// =============================================================================
// Core State Atoms (persisted to localStorage)
// =============================================================================

/** Selected spec ID (number from chr_specialization table) */
export const rotationSpecIdAtom = atomWithStorage<number | null>(
  "rotation-builder-spec-id-v2",
  DEFAULT_SPEC_ID,
);

export const rotationVariablesAtom = atomWithStorage<Variable[]>(
  "rotation-builder-variables-v1",
  createDefaultVariables(),
);

export const rotationActionListsAtom = atomWithStorage<ActionListWithActions[]>(
  "rotation-builder-lists-v1",
  createDefaultActionLists(),
);

export const rotationDefaultListIdAtom = atomWithStorage<string>(
  "rotation-builder-default-list-v1",
  "list-main",
);

// =============================================================================
// UI State Atoms (not persisted)
// =============================================================================

export const selectedListIdAtom = atom<string | null>("list-main");

export type ViewMode = "edit" | "preview";
export const viewModeAtom = atom<ViewMode>("edit");

// =============================================================================
// Derived Atoms (read-only)
// =============================================================================

export const selectedListAtom = atom((get) => {
  const lists = get(rotationActionListsAtom);
  const selectedId = get(selectedListIdAtom);
  return lists.find((l) => l.id === selectedId) ?? null;
});

export const actionListInfosAtom = atom((get) => {
  const lists = get(rotationActionListsAtom);
  const defaultListId = get(rotationDefaultListIdAtom);
  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    label: list.label,
    listType: list.listType,
    isDefault: list.id === defaultListId,
  }));
});

export const rotationStatsAtom = atom((get) => {
  const lists = get(rotationActionListsAtom);
  const totalActions = lists.reduce((sum, l) => sum + l.actions.length, 0);
  const enabledActions = lists.reduce(
    (sum, l) => sum + l.actions.filter((a) => a.enabled).length,
    0,
  );
  return { totalActions, enabledActions };
});

export const rotationDataAtom = atom((get) => {
  const specId = get(rotationSpecIdAtom);
  const variables = get(rotationVariablesAtom);
  const actionLists = get(rotationActionListsAtom);
  const defaultListId = get(rotationDefaultListIdAtom);

  return {
    specId,
    variables,
    defaultList:
      actionLists.find((l) => l.id === defaultListId)?.name ?? "default",
    actionLists: actionLists.map((list) => ({
      id: list.id,
      name: list.name,
      label: list.label,
      actions: list.actions,
    })),
  };
});
