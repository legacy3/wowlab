"use client";

import { useCallback } from "react";
import { ListTreeIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ActionCard } from "./action-card";
import { ActionPicker } from "./action-picker";
import type { AllowedSpell } from "./spell-picker";
import type { ActionList, Action } from "./types";
import { generateId } from "./utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ActionEditorProps {
  list: ActionList;
  callableLists: Array<{ id: string; name: string; label: string }>;
  allowedSpells: ReadonlyArray<AllowedSpell>;
  onActionsChange: (actions: Action[]) => void;
}

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------

function EmptyState({
  onAddSpell,
  onAddItem,
  onAddCallList,
  callableLists,
  allowedSpells,
}: {
  onAddSpell: (spellId: number) => void;
  onAddItem: (itemId: number) => void;
  onAddCallList: (listId: string) => void;
  callableLists: Array<{ id: string; name: string; label: string }>;
  allowedSpells: ReadonlyArray<AllowedSpell>;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ListTreeIcon className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">No actions yet</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
          Add spells, items, or call other action lists to build your rotation.
        </p>
        <ActionPicker
          allowedSpells={allowedSpells}
          callableLists={callableLists}
          onAddSpell={onAddSpell}
          onAddItem={onAddItem}
          onAddCallList={onAddCallList}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ActionEditor({
  list,
  callableLists,
  allowedSpells,
  onActionsChange,
}: ActionEditorProps) {
  const handleAddSpell = useCallback(
    (spellId: number) => {
      const newAction: Action = {
        id: generateId("action"),
        type: "spell",
        spellId,
        enabled: true,
        condition: { combinator: "and", rules: [] },
      };
      onActionsChange([...list.actions, newAction]);
    },
    [list.actions, onActionsChange],
  );

  const handleAddItem = useCallback(
    (itemId: number) => {
      const newAction: Action = {
        id: generateId("action"),
        type: "item",
        itemId,
        enabled: true,
        condition: { combinator: "and", rules: [] },
      };
      onActionsChange([...list.actions, newAction]);
    },
    [list.actions, onActionsChange],
  );

  const handleAddCallList = useCallback(
    (targetListId: string) => {
      const newAction: Action = {
        id: generateId("action"),
        type: "call_action_list",
        listId: targetListId,
        enabled: true,
        condition: { combinator: "and", rules: [] },
      };
      onActionsChange([...list.actions, newAction]);
    },
    [list.actions, onActionsChange],
  );

  const handleUpdateAction = useCallback(
    (actionId: string, updates: Partial<Action>) => {
      onActionsChange(
        list.actions.map((a) => (a.id === actionId ? { ...a, ...updates } : a)),
      );
    },
    [list.actions, onActionsChange],
  );

  const handleDeleteAction = useCallback(
    (actionId: string) => {
      onActionsChange(list.actions.filter((a) => a.id !== actionId));
    },
    [list.actions, onActionsChange],
  );

  const handleDuplicateAction = useCallback(
    (actionId: string) => {
      const index = list.actions.findIndex((a) => a.id === actionId);
      if (index === -1) return;
      const original = list.actions[index];
      const duplicate: Action = {
        ...structuredClone(original),
        id: generateId("action"),
      };
      const newActions = [...list.actions];
      newActions.splice(index + 1, 0, duplicate);
      onActionsChange(newActions);
    },
    [list.actions, onActionsChange],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* List header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold">{list.label}</h2>
          {list.listType === "main" && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              Entry Point
            </Badge>
          )}
          {list.listType === "precombat" && (
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 border-amber-500/40 text-amber-500"
            >
              Precombat
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {list.actions.length} action{list.actions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Actions list */}
      <div className="flex-1 overflow-y-auto p-4">
        {list.actions.length === 0 ? (
          <EmptyState
            onAddSpell={handleAddSpell}
            onAddItem={handleAddItem}
            onAddCallList={handleAddCallList}
            callableLists={callableLists}
            allowedSpells={allowedSpells}
          />
        ) : (
          <div className="space-y-2">
            {list.actions.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                index={index}
                callableLists={callableLists}
                allowedSpells={allowedSpells}
                onUpdate={(updates) => handleUpdateAction(action.id, updates)}
                onDelete={() => handleDeleteAction(action.id)}
                onDuplicate={() => handleDuplicateAction(action.id)}
              />
            ))}
          </div>
        )}

        {/* Add action button */}
        {list.actions.length > 0 && (
          <div className="mt-4">
            <ActionPicker
              allowedSpells={allowedSpells}
              callableLists={callableLists}
              onAddSpell={handleAddSpell}
              onAddItem={handleAddItem}
              onAddCallList={handleAddCallList}
              variant="dashed"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
