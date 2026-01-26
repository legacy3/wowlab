"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import type {
  Action,
  ActionList,
  EditorState,
  ListType,
  RotationData,
  RotationsRow,
  Variable,
  ViewMode,
} from "@/lib/editor";

import { createEmptyCondition, generateId } from "@/lib/editor";

const createDefaultList = (): ActionList => ({
  actions: [],
  id: generateId(),
  label: "Default",
  listType: "main",
  name: "default",
});

const initialState = () => {
  const defaultList = createDefaultList();
  return {
    actionLists: [defaultList],
    defaultListId: defaultList.id,
    description: "",
    isDirty: false,
    isLocked: false,
    isPublic: false,
    name: "",
    ownerId: null as string | null,
    rotationId: null,
    selectedListId: defaultList.id,
    slug: "",
    specId: null,
    variables: [] as Variable[],
    viewMode: "edit" as ViewMode,
  };
};

export const useEditor = create<EditorState>()(
  immer((set, get) => ({
    ...initialState(),

    addAction: (listId, input) => {
      const id = generateId();
      set((state) => {
        const list = state.actionLists.find((l) => l.id === listId);
        if (list) {
          const action: Action = {
            ...input,
            condition: createEmptyCondition(),
            enabled: true,
            id,
          };
          list.actions.push(action);
          state.isDirty = true;
        }
      });
      return id;
    },

    addList: (input) => {
      const id = generateId();
      set((state) => {
        const list: ActionList = {
          actions: [],
          id,
          label: input.label,
          listType: input.listType,
          name: input.name,
        };
        state.actionLists.push(list);
        state.selectedListId = id;
        state.isDirty = true;
      });
      return id;
    },

    addVariable: (input) => {
      const id = generateId();
      set((state) => {
        state.variables.push({ ...input, id });
        state.isDirty = true;
      });
      return id;
    },

    deleteAction: (listId, actionId) =>
      set((state) => {
        const list = state.actionLists.find((l) => l.id === listId);
        if (list) {
          const index = list.actions.findIndex((a) => a.id === actionId);
          if (index !== -1) {
            list.actions.splice(index, 1);
            state.isDirty = true;
          }
        }
      }),

    deleteList: (id) =>
      set((state) => {
        // Don't delete the last list
        if (state.actionLists.length <= 1) {
          return;
        }

        const index = state.actionLists.findIndex((l) => l.id === id);
        if (index === -1) {
          return;
        }

        state.actionLists.splice(index, 1);

        // Update defaultListId if we deleted the default
        if (state.defaultListId === id) {
          state.defaultListId = state.actionLists[0].id;
        }

        // Update selectedListId if we deleted the selected
        if (state.selectedListId === id) {
          state.selectedListId = state.actionLists[0].id;
        }

        state.isDirty = true;
      }),

    deleteVariable: (id) =>
      set((state) => {
        const index = state.variables.findIndex((v) => v.id === id);
        if (index !== -1) {
          state.variables.splice(index, 1);
          state.isDirty = true;
        }
      }),

    duplicateAction: (listId, actionId) => {
      const state = get();
      const list = state.actionLists.find((l) => l.id === listId);
      if (!list) {
        return undefined;
      }

      const action = list.actions.find((a) => a.id === actionId);
      if (!action) {
        return undefined;
      }

      const newId = generateId();
      set((state) => {
        const list = state.actionLists.find((l) => l.id === listId);
        if (list) {
          const actionIndex = list.actions.findIndex((a) => a.id === actionId);
          if (actionIndex !== -1) {
            const clone: Action = {
              ...JSON.parse(JSON.stringify(action)),
              id: newId,
            };
            list.actions.splice(actionIndex + 1, 0, clone);
            state.isDirty = true;
          }
        }
      });
      return newId;
    },

    load: (rotation) => {
      let data: RotationData;
      try {
        data = JSON.parse(rotation.script) as RotationData;
      } catch {
        const defaultList = createDefaultList();
        data = {
          defaultListId: defaultList.id,
          lists: [defaultList],
          variables: [],
        };
      }

      set((state) => {
        state.rotationId = rotation.id;
        state.specId = rotation.spec_id;
        state.name = rotation.name;
        state.slug = rotation.slug;
        state.description = rotation.description ?? "";
        state.isPublic = rotation.is_public;

        state.variables = data.variables ?? [];
        state.actionLists = data.lists ?? [];
        state.defaultListId = data.defaultListId ?? data.lists[0]?.id ?? "";

        state.selectedListId = data.lists[0]?.id ?? null;
        state.viewMode = "edit";
        state.isDirty = false;
        state.ownerId = rotation.user_id;
        state.isLocked = true;
      });
    },

    markClean: () =>
      set((state) => {
        state.isDirty = false;
      }),

    renameList: (id, label) =>
      set((state) => {
        const list = state.actionLists.find((l) => l.id === id);
        if (list) {
          list.label = label;
          state.isDirty = true;
        }
      }),

    reorderActions: (listId, from, to) =>
      set((state) => {
        const list = state.actionLists.find((l) => l.id === listId);
        if (list) {
          const [removed] = list.actions.splice(from, 1);
          list.actions.splice(to, 0, removed);
          state.isDirty = true;
        }
      }),

    reorderLists: (from, to) =>
      set((state) => {
        const [removed] = state.actionLists.splice(from, 1);
        state.actionLists.splice(to, 0, removed);
        state.isDirty = true;
      }),

    reset: () => {
      const fresh = initialState();
      set((state) => {
        Object.assign(state, fresh);
      });
    },

    selectList: (id) =>
      set((state) => {
        state.selectedListId = id;
      }),

    serialize: () => {
      const state = get();
      return {
        defaultListId: state.defaultListId,
        lists: state.actionLists,
        variables: state.variables,
      };
    },

    setDefaultList: (id) =>
      set((state) => {
        if (state.actionLists.some((l) => l.id === id)) {
          state.defaultListId = id;
          state.isDirty = true;
        }
      }),

    setDescription: (description) =>
      set((state) => {
        state.description = description;
        state.isDirty = true;
      }),

    setIsPublic: (isPublic) =>
      set((state) => {
        state.isPublic = isPublic;
        state.isDirty = true;
      }),

    setLocked: (locked) =>
      set((state) => {
        state.isLocked = locked;
      }),

    setName: (name) =>
      set((state) => {
        state.name = name;
        state.isDirty = true;
      }),

    setSpecId: (specId) =>
      set((state) => {
        state.specId = specId;
        state.isDirty = true;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    updateAction: (listId, actionId, updates) =>
      set((state) => {
        const list = state.actionLists.find((l) => l.id === listId);
        if (list) {
          const action = list.actions.find((a) => a.id === actionId);
          if (action) {
            Object.assign(action, updates);
            state.isDirty = true;
          }
        }
      }),

    updateVariable: (id, updates) =>
      set((state) => {
        const variable = state.variables.find((v) => v.id === id);
        if (variable) {
          Object.assign(variable, updates);
          state.isDirty = true;
        }
      }),
  })),
);

export const useSelectedList = () => {
  return useEditor((state) => {
    if (!state.selectedListId) {
      return null;
    }
    return state.actionLists.find((l) => l.id === state.selectedListId) ?? null;
  });
};

export const useDefaultList = () => {
  return useEditor((state) => {
    return (
      state.actionLists.find((l) => l.id === state.defaultListId) ??
      state.actionLists[0] ??
      null
    );
  });
};

export const useListsByType = (type: ListType) => {
  return useEditor((state) =>
    state.actionLists.filter((l) => l.listType === type),
  );
};
