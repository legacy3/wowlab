"use client";

import { atom } from "jotai";
import type {
  Rotation,
  RotationDraft,
  ActionList,
  Action,
  Variable,
  ListType,
} from "@/components/rotation-editor/types";

// =============================================================================
// Core State Atoms
// =============================================================================

/** Current rotation being edited (null = new rotation) */
export const rotationAtom = atom<Rotation | null>(null);

/** Draft state for unsaved changes */
export const rotationDraftAtom = atom<RotationDraft | null>(null);

/** Whether there are unsaved changes */
export const isDirtyAtom = atom((get) => {
  const rotation = get(rotationAtom);
  const draft = get(rotationDraftAtom);
  if (!rotation && !draft) return false;
  if (!rotation && draft) return true;
  return JSON.stringify(rotation) !== JSON.stringify(draft);
});

// =============================================================================
// UI State Atoms
// =============================================================================

/** Currently selected list ID for editing */
export const selectedListIdAtom = atom<string | null>(null);

/** View mode: edit or preview */
export type ViewMode = "edit" | "preview";
export const viewModeAtom = atom<ViewMode>("edit");

/** Sidebar collapsed state */
export const sidebarCollapsedAtom = atom(false);

// =============================================================================
// Derived Atoms (read-only)
// =============================================================================

/** Get the currently selected list */
export const selectedListAtom = atom((get) => {
  const draft = get(rotationDraftAtom);
  const selectedId = get(selectedListIdAtom);
  if (!draft || !selectedId) return null;
  return draft.lists.find((l) => l.id === selectedId) ?? null;
});

/** Get list infos for sidebar */
export const listInfosAtom = atom((get) => {
  const draft = get(rotationDraftAtom);
  if (!draft) return [];
  return draft.lists.map((list) => ({
    id: list.id,
    name: list.name,
    label: list.label,
    listType: list.listType,
    actionCount: list.actions.length,
    isDefault: list.id === draft.defaultListId,
  }));
});

/** Get callable lists (for call_action_list dropdown) */
export const callableListsAtom = atom((get) => {
  const draft = get(rotationDraftAtom);
  if (!draft) return [];
  return draft.lists
    .filter((l) => l.listType === "sub")
    .map((l) => ({ id: l.id, name: l.name, label: l.label }));
});

/** Rotation stats for header */
export const statsAtom = atom((get) => {
  const draft = get(rotationDraftAtom);
  if (!draft) return { lists: 0, actions: 0, variables: 0 };
  const totalActions = draft.lists.reduce((sum, l) => sum + l.actions.length, 0);
  return {
    lists: draft.lists.length,
    actions: totalActions,
    variables: draft.variables.length,
  };
});

// =============================================================================
// Write Atoms (actions)
// =============================================================================

// --- Initialization ---

export const initRotationAtom = atom(
  null,
  (get, set, rotation: Rotation | null) => {
    set(rotationAtom, rotation);
    set(rotationDraftAtom, rotation ? { ...rotation } : createEmptyDraft());
    set(selectedListIdAtom, rotation?.defaultListId ?? null);
    set(viewModeAtom, "edit");
  }
);

export const initNewRotationAtom = atom(null, (get, set, specId: number) => {
  const draft = createEmptyDraft(specId);
  set(rotationAtom, null);
  set(rotationDraftAtom, draft);
  set(selectedListIdAtom, draft.defaultListId);
  set(viewModeAtom, "edit");
});

// --- Spec ---

export const setSpecIdAtom = atom(null, (get, set, specId: number) => {
  set(rotationDraftAtom, (prev) => (prev ? { ...prev, specId } : null));
});

// --- Metadata ---

export const setNameAtom = atom(null, (get, set, name: string) => {
  set(rotationDraftAtom, (prev) => (prev ? { ...prev, name } : null));
});

export const setDescriptionAtom = atom(null, (get, set, description: string) => {
  set(rotationDraftAtom, (prev) => (prev ? { ...prev, description } : null));
});

// --- Lists ---

export const addListAtom = atom(
  null,
  (get, set, input: { name: string; label: string; listType: ListType }) => {
    const id = generateId("list");
    const newList: ActionList = {
      id,
      name: input.name,
      label: input.label,
      listType: input.listType,
      actions: [],
    };
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return { ...prev, lists: [...prev.lists, newList] };
    });
    set(selectedListIdAtom, id);
    return id;
  }
);

export const updateListAtom = atom(
  null,
  (
    get,
    set,
    { id, updates }: { id: string; updates: Partial<Pick<ActionList, "name" | "label">> }
  ) => {
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      };
    });
  }
);

export const deleteListAtom = atom(null, (get, set, id: string) => {
  const draft = get(rotationDraftAtom);
  if (!draft || draft.lists.length <= 1) return;

  set(rotationDraftAtom, (prev) => {
    if (!prev) return null;
    const newLists = prev.lists.filter((l) => l.id !== id);
    const newDefaultId =
      prev.defaultListId === id ? newLists[0]?.id ?? "" : prev.defaultListId;
    return { ...prev, lists: newLists, defaultListId: newDefaultId };
  });

  if (get(selectedListIdAtom) === id) {
    const remaining = draft.lists.filter((l) => l.id !== id);
    set(selectedListIdAtom, remaining[0]?.id ?? null);
  }
});

export const setDefaultListAtom = atom(null, (get, set, id: string) => {
  set(rotationDraftAtom, (prev) =>
    prev ? { ...prev, defaultListId: id } : null
  );
});

export const selectListAtom = atom(null, (get, set, id: string | null) => {
  set(selectedListIdAtom, id);
});

// --- Actions within lists ---

export const addActionAtom = atom(
  null,
  (get, set, { listId, spellId }: { listId: string; spellId: number }) => {
    const id = generateId("action");
    const newAction: Action = {
      id,
      type: "spell",
      spellId,
      enabled: true,
      condition: { combinator: "and", rules: [] },
    };
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId ? { ...l, actions: [...l.actions, newAction] } : l
        ),
      };
    });
    return id;
  }
);

export const addCallListActionAtom = atom(
  null,
  (
    get,
    set,
    { listId, targetListId }: { listId: string; targetListId: string }
  ) => {
    const id = generateId("action");
    const newAction: Action = {
      id,
      type: "call_action_list",
      listId: targetListId,
      enabled: true,
      condition: { combinator: "and", rules: [] },
    };
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId ? { ...l, actions: [...l.actions, newAction] } : l
        ),
      };
    });
    return id;
  }
);

export const updateActionAtom = atom(
  null,
  (
    get,
    set,
    {
      listId,
      actionId,
      updates,
    }: {
      listId: string;
      actionId: string;
      updates: Partial<Omit<Action, "id">>;
    }
  ) => {
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId
            ? {
                ...l,
                actions: l.actions.map((a) =>
                  a.id === actionId ? { ...a, ...updates } : a
                ),
              }
            : l
        ),
      };
    });
  }
);

export const deleteActionAtom = atom(
  null,
  (get, set, { listId, actionId }: { listId: string; actionId: string }) => {
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId
            ? { ...l, actions: l.actions.filter((a) => a.id !== actionId) }
            : l
        ),
      };
    });
  }
);

export const reorderActionsAtom = atom(
  null,
  (get, set, { listId, actions }: { listId: string; actions: Action[] }) => {
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId ? { ...l, actions } : l
        ),
      };
    });
  }
);

export const duplicateActionAtom = atom(
  null,
  (get, set, { listId, actionId }: { listId: string; actionId: string }) => {
    const draft = get(rotationDraftAtom);
    if (!draft) return;

    const list = draft.lists.find((l) => l.id === listId);
    if (!list) return;

    const actionIndex = list.actions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) return;

    const original = list.actions[actionIndex];
    const duplicate: Action = {
      ...structuredClone(original),
      id: generateId("action"),
    };

    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lists: prev.lists.map((l) => {
          if (l.id !== listId) return l;
          const newActions = [...l.actions];
          newActions.splice(actionIndex + 1, 0, duplicate);
          return { ...l, actions: newActions };
        }),
      };
    });
  }
);

// --- Variables ---

export const addVariableAtom = atom(
  null,
  (get, set, input: Omit<Variable, "id">) => {
    const id = generateId("var");
    const newVar: Variable = { id, ...input };
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return { ...prev, variables: [...prev.variables, newVar] };
    });
    return id;
  }
);

export const updateVariableAtom = atom(
  null,
  (
    get,
    set,
    { id, updates }: { id: string; updates: Partial<Omit<Variable, "id">> }
  ) => {
    set(rotationDraftAtom, (prev) => {
      if (!prev) return null;
      return {
        ...prev,
        variables: prev.variables.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      };
    });
  }
);

export const deleteVariableAtom = atom(null, (get, set, id: string) => {
  set(rotationDraftAtom, (prev) => {
    if (!prev) return null;
    return { ...prev, variables: prev.variables.filter((v) => v.id !== id) };
  });
});

// --- View mode ---

export const setViewModeAtom = atom(null, (get, set, mode: ViewMode) => {
  set(viewModeAtom, mode);
});

export const toggleSidebarAtom = atom(null, (get, set) => {
  set(sidebarCollapsedAtom, (prev) => !prev);
});

// =============================================================================
// Helpers
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function createEmptyDraft(specId?: number): RotationDraft {
  const mainListId = generateId("list");
  return {
    specId: specId ?? 0,
    name: "",
    description: "",
    variables: [],
    lists: [
      {
        id: mainListId,
        name: "main",
        label: "Main",
        listType: "main",
        actions: [],
      },
    ],
    defaultListId: mainListId,
  };
}
