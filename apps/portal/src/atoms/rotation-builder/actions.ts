"use client";

import { atom } from "jotai";
import { generateListId, generateActionId, generateVariableId } from "@/lib/id";
import {
  rotationSpecIdAtom,
  rotationVariablesAtom,
  rotationActionListsAtom,
  rotationDefaultListIdAtom,
  selectedListIdAtom,
  viewModeAtom,
  type Variable,
  type Action,
  type ActionListWithActions,
  type ListType,
} from "./state";

// Beast Mastery Hunter spec ID (default)
const DEFAULT_SPEC_ID = 253;

// =============================================================================
// Spec Actions
// =============================================================================

export const setSpecIdAtom = atom(null, (_, set, specId: number | null) => {
  set(rotationSpecIdAtom, specId);
});

// =============================================================================
// Variable Actions
// =============================================================================

export const addVariableAtom = atom(
  null,
  (get, set, input: Omit<Variable, "id">) => {
    const newVariable: Variable = {
      id: generateVariableId(),
      ...input,
    };
    set(rotationVariablesAtom, (prev) => [...prev, newVariable]);
    return newVariable.id;
  },
);

export const updateVariableAtom = atom(
  null,
  (
    _,
    set,
    { id, updates }: { id: string; updates: Partial<Omit<Variable, "id">> },
  ) => {
    set(rotationVariablesAtom, (prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  },
);

export const deleteVariableAtom = atom(null, (_, set, id: string) => {
  set(rotationVariablesAtom, (prev) => prev.filter((v) => v.id !== id));
});

export const setVariablesAtom = atom(null, (_, set, variables: Variable[]) => {
  set(rotationVariablesAtom, variables);
});

// =============================================================================
// Action List Actions
// =============================================================================

export const addActionListAtom = atom(
  null,
  (_, set, input: { name: string; label: string; listType: ListType }) => {
    const newList: ActionListWithActions = {
      id: generateListId(),
      name: input.name,
      label: input.label,
      listType: input.listType,
      actions: [],
    };
    set(rotationActionListsAtom, (prev) => [...prev, newList]);
    set(selectedListIdAtom, newList.id);
    return newList.id;
  },
);

export const renameActionListAtom = atom(
  null,
  (_, set, { id, label }: { id: string; label: string }) => {
    set(rotationActionListsAtom, (prev) =>
      prev.map((list) => (list.id === id ? { ...list, label } : list)),
    );
  },
);

export const deleteActionListAtom = atom(null, (get, set, id: string) => {
  const lists = get(rotationActionListsAtom);

  // Don't delete the last list
  if (lists.length <= 1) return;

  set(rotationActionListsAtom, (prev) => prev.filter((l) => l.id !== id));

  // Update selection if needed
  if (get(selectedListIdAtom) === id) {
    const remaining = lists.filter((l) => l.id !== id);
    set(selectedListIdAtom, remaining[0]?.id ?? null);
  }

  // Update default if needed
  if (get(rotationDefaultListIdAtom) === id) {
    const remaining = lists.filter((l) => l.id !== id);
    set(rotationDefaultListIdAtom, remaining[0]?.id ?? "");
  }
});

export const setDefaultListAtom = atom(null, (_, set, id: string) => {
  set(rotationDefaultListIdAtom, id);
  set(rotationActionListsAtom, (prev) =>
    prev.map((list) => ({
      ...list,
      isDefault: list.id === id,
    })),
  );
});

export const selectListAtom = atom(null, (_, set, id: string | null) => {
  set(selectedListIdAtom, id);
});

// =============================================================================
// Action (within list) Actions
// =============================================================================

export const addActionAtom = atom(
  null,
  (
    get,
    set,
    input: {
      listId: string;
      spell: string;
      type?: "spell" | "call_action_list";
    },
  ) => {
    const newAction: Action = {
      id: generateActionId(),
      type: input.type ?? "spell",
      spell: input.spell,
      enabled: true,
      conditions: { combinator: "and", rules: [] },
    };

    set(rotationActionListsAtom, (prev) =>
      prev.map((list) =>
        list.id === input.listId
          ? { ...list, actions: [...list.actions, newAction] }
          : list,
      ),
    );

    return newAction.id;
  },
);

export const updateActionAtom = atom(
  null,
  (
    _,
    set,
    {
      listId,
      actionId,
      updates,
    }: {
      listId: string;
      actionId: string;
      updates: Partial<Omit<Action, "id">>;
    },
  ) => {
    set(rotationActionListsAtom, (prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              actions: list.actions.map((a) =>
                a.id === actionId ? { ...a, ...updates } : a,
              ),
            }
          : list,
      ),
    );
  },
);

export const deleteActionAtom = atom(
  null,
  (_, set, { listId, actionId }: { listId: string; actionId: string }) => {
    set(rotationActionListsAtom, (prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, actions: list.actions.filter((a) => a.id !== actionId) }
          : list,
      ),
    );
  },
);

export const duplicateActionAtom = atom(
  null,
  (get, set, { listId, actionId }: { listId: string; actionId: string }) => {
    const lists = get(rotationActionListsAtom);
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const actionIndex = list.actions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) return;

    const original = list.actions[actionIndex];
    const duplicate: Action = {
      id: generateActionId(),
      type: original.type ?? "spell",
      spell: original.spell,
      enabled: original.enabled,
      conditions: structuredClone(original.conditions),
    };

    set(rotationActionListsAtom, (prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const newActions = [...l.actions];
        newActions.splice(actionIndex + 1, 0, duplicate);
        return { ...l, actions: newActions };
      }),
    );

    return duplicate.id;
  },
);

export const setActionsForListAtom = atom(
  null,
  (_, set, { listId, actions }: { listId: string; actions: Action[] }) => {
    set(rotationActionListsAtom, (prev) =>
      prev.map((list) => (list.id === listId ? { ...list, actions } : list)),
    );
  },
);

// =============================================================================
// View Mode Actions
// =============================================================================

export const setViewModeAtom = atom(
  null,
  (_, set, mode: "edit" | "preview") => {
    set(viewModeAtom, mode);
  },
);

// =============================================================================
// Reset Action
// =============================================================================

export const resetRotationBuilderAtom = atom(null, (_, set) => {
  // Reset to default spec (Beast Mastery Hunter)
  set(rotationSpecIdAtom, DEFAULT_SPEC_ID);

  // Reset variables
  set(rotationVariablesAtom, [
    {
      id: generateVariableId(),
      name: "burst_phase",
      expression: "aura.bloodlust.up | aura.bestial_wrath.up",
    },
    {
      id: generateVariableId(),
      name: "pooling",
      expression: "cooldown.bestial_wrath.remains < 3",
    },
  ]);

  // Reset action lists with proper structure
  const precombatListId = generateListId();
  const mainListId = generateListId();
  const cooldownsListId = generateListId();
  const stListId = generateListId();

  set(rotationActionListsAtom, [
    // Precombat
    {
      id: precombatListId,
      name: "precombat",
      label: "Precombat",
      listType: "precombat" as ListType,
      actions: [
        {
          id: generateActionId(),
          type: "spell" as const,
          spell: "aspect_of_the_wild",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    // Main rotation
    {
      id: mainListId,
      name: "main",
      label: "Main",
      listType: "main" as ListType,
      isDefault: true,
      actions: [
        {
          id: generateActionId(),
          type: "call_action_list" as const,
          spell: "cooldowns",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "variable", operator: "=", value: "burst_phase" }],
          },
        },
        {
          id: generateActionId(),
          type: "call_action_list" as const,
          spell: "st",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
      ],
    },
    // Cooldowns sub-list
    {
      id: cooldownsListId,
      name: "cooldowns",
      label: "Cooldowns",
      listType: "sub" as ListType,
      actions: [
        {
          id: generateActionId(),
          type: "spell" as const,
          spell: "bestial_wrath",
          enabled: true,
          conditions: { combinator: "and", rules: [] },
        },
        {
          id: generateActionId(),
          type: "spell" as const,
          spell: "call_of_the_wild",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [
              { field: "aura_active", operator: "=", value: "bestial_wrath" },
            ],
          },
        },
      ],
    },
    // Single Target sub-list
    {
      id: stListId,
      name: "st",
      label: "Single Target",
      listType: "sub" as ListType,
      actions: [
        {
          id: generateActionId(),
          type: "spell" as const,
          spell: "kill_command",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "focus", operator: ">=", value: "30" }],
          },
        },
        {
          id: generateActionId(),
          type: "spell" as const,
          spell: "barbed_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "charges", operator: ">=", value: "1" }],
          },
        },
        {
          id: generateActionId(),
          type: "spell" as const,
          spell: "cobra_shot",
          enabled: true,
          conditions: {
            combinator: "and",
            rules: [{ field: "focus", operator: ">=", value: "35" }],
          },
        },
      ],
    },
  ]);

  set(rotationDefaultListIdAtom, mainListId);
  set(selectedListIdAtom, mainListId);
  set(viewModeAtom, "edit");
});
