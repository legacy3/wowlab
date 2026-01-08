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

export interface Action {
  id: string;
  spell: string;
  enabled: boolean;
  conditions: RuleGroupType;
}

export interface ActionListWithActions {
  id: string;
  name: string;
  label: string;
  isDefault?: boolean;
  actions: Action[];
}

// =============================================================================
// Initial State Factory
// =============================================================================

function createDefaultActionLists(): ActionListWithActions[] {
  return [
    {
      id: "list-default",
      name: "default",
      label: "Default",
      isDefault: true,
      actions: [
        {
          id: "action-init-1",
          spell: "bestial_wrath",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
        {
          id: "action-init-2",
          spell: "kill_command",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "focus", operator: ">=", value: "30" }],
          },
        },
        {
          id: "action-init-3",
          spell: "barbed_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "charges", operator: ">=", value: "1" }],
          },
        },
        {
          id: "action-init-4",
          spell: "cobra_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "focus", operator: ">=", value: "35" }],
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
          id: "action-init-5",
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
          id: "action-init-6",
          spell: "bloodshed",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    {
      id: "list-aoe",
      name: "aoe",
      label: "AoE",
      actions: [
        {
          id: "action-init-7",
          spell: "multi_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "aura_remaining", operator: "<", value: "2" }],
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
  "list-default",
);

// =============================================================================
// UI State Atoms (not persisted)
// =============================================================================

export const selectedListIdAtom = atom<string | null>("list-default");

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
