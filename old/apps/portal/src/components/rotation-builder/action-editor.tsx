"use client";

import * as React from "react";
import { useCallback, useState, useMemo, memo } from "react";
import { QueryBuilder } from "react-querybuilder";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import * as ReactDnD from "react-dnd";
import * as ReactDnDHTML5Backend from "react-dnd-html5-backend";
import type { RuleGroupType } from "react-querybuilder";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  PlusIcon,
  PowerIcon,
  TrashIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { generateActionId } from "@/lib/id";

import {
  shadcnControlElements,
  shadcnControlClassnames,
  shadcnTranslations,
  CONDITION_FIELDS,
  COMPARISON_OPERATORS,
} from "./query-builder-controls";

import type { Action, ActionType } from "./types";
import { getSpellLabel, getConditionSummary } from "./utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ActionEditorProps {
  actions: Action[];
  onChange: (actions: Action[]) => void;
  spells: Array<{ name: string; label: string }>;
  /** Available action lists for call_action_list actions */
  actionLists?: Array<{ name: string; label: string }>;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Creates a new action with default values.
 * Use this when adding new actions to the list.
 */
export function createAction(
  spell: string,
  actionType: ActionType = "spell",
  options?: Partial<Omit<Action, "id" | "type">>,
): Action {
  return {
    id: generateActionId(),
    type: actionType,
    spell,
    enabled: true,
    conditions: { combinator: "and", rules: [] },
    ...options,
  };
}

// -----------------------------------------------------------------------------
// ActionEditor - Condition builder for a single action
// -----------------------------------------------------------------------------

interface ActionEditorInternalProps {
  action: Action;
  onConditionsChange: (conditions: RuleGroupType) => void;
}

function ActionEditorInternal({
  action,
  onConditionsChange,
}: ActionEditorInternalProps) {
  return (
    <div className="space-y-1.5">
      <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDnDHTML5Backend }}>
        <QueryBuilder
          fields={CONDITION_FIELDS}
          query={action.conditions}
          onQueryChange={onConditionsChange}
          controlElements={shadcnControlElements}
          controlClassnames={shadcnControlClassnames}
          translations={shadcnTranslations}
          operators={COMPARISON_OPERATORS}
          combinators={[
            { name: "and", label: "AND" },
            { name: "or", label: "OR" },
          ]}
          showCloneButtons
          resetOnFieldChange
        />
      </QueryBuilderDnD>
      {action.conditions.rules.length === 0 && (
        <div className="text-xs text-muted-foreground py-2 text-center border rounded bg-muted/30">
          No conditions - action will always execute
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ActionCard - Single action row with expand/collapse
// -----------------------------------------------------------------------------

interface ActionCardProps {
  action: Action;
  index: number;
  spells: Array<{ name: string; label: string }>;
  actionLists: Array<{ name: string; label: string }>;
  onUpdate: (updates: Partial<Action>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const ActionCard = memo(function ActionCard({
  action,
  index,
  spells,
  actionLists,
  onUpdate,
  onRemove,
  onDuplicate,
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Default to "spell" for backwards compatibility with old data
  const actionType = action.type ?? "spell";
  const isCallList = actionType === "call_action_list";

  const handleConditionsChange = useCallback(
    (conditions: RuleGroupType) => {
      onUpdate({ conditions });
    },
    [onUpdate],
  );

  const handleSpellChange = useCallback(
    (spell: string) => {
      onUpdate({ spell });
    },
    [onUpdate],
  );

  const handleTypeChange = useCallback(
    (newType: string) => {
      const type = newType as ActionType;
      // Reset spell to first available option when switching types
      const defaultSpell =
        type === "call_action_list"
          ? (actionLists[0]?.name ?? "")
          : (spells[0]?.name ?? "");
      onUpdate({ type, spell: defaultSpell });
    },
    [onUpdate, actionLists, spells],
  );

  const handleToggleEnabled = useCallback(() => {
    onUpdate({ enabled: !action.enabled });
  }, [action.enabled, onUpdate]);

  const conditionSummary = useMemo(
    () => getConditionSummary(action.conditions),
    [action.conditions],
  );

  // Get label based on action type
  const actionLabel = useMemo(() => {
    if (isCallList) {
      const list = actionLists.find((l) => l.name === action.spell);
      return list?.label ?? action.spell;
    }
    return getSpellLabel(action.spell, spells);
  }, [action.spell, spells, actionLists, isCallList]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "group/card rounded-lg border bg-card transition-all",
          !action.enabled && "opacity-50",
          "hover:border-border/80",
        )}
      >
        {/* Header - Always visible */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Drag handle */}
          <div
            className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            title="Drag to reorder"
          >
            <GripVerticalIcon className="size-4" />
          </div>

          {/* Priority number */}
          <Badge
            variant="secondary"
            className="size-6 p-0 justify-center text-xs font-medium tabular-nums shrink-0"
          >
            {index + 1}
          </Badge>

          {/* Expand/collapse toggle */}
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Action type selector */}
          <Select value={actionType} onValueChange={handleTypeChange}>
            <SelectTrigger
              className={cn(
                "w-24 h-7 text-xs shrink-0",
                isCallList && "text-blue-500",
              )}
            >
              <SelectValue>{isCallList ? "Call List" : "Spell"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spell">Spell</SelectItem>
              <SelectItem value="call_action_list">Call List</SelectItem>
            </SelectContent>
          </Select>

          {/* Spell/List selector based on type */}
          {isCallList ? (
            <Select value={action.spell} onValueChange={handleSpellChange}>
              <SelectTrigger className="w-32 h-7 text-xs font-medium shrink-0 text-blue-500">
                <SelectValue>{actionLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {actionLists.map((list) => (
                  <SelectItem key={list.name} value={list.name}>
                    {list.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={action.spell} onValueChange={handleSpellChange}>
              <SelectTrigger className="w-32 h-7 text-xs font-medium shrink-0">
                <SelectValue>{actionLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {spells.map((spell) => (
                  <SelectItem key={spell.name} value={spell.name}>
                    {spell.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Condition summary when collapsed */}
          {!isExpanded && (
            <div className="flex-1 min-w-0 px-1">
              <span className="text-xs text-muted-foreground truncate block">
                {conditionSummary === "Always" ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 font-normal"
                  >
                    Always
                  </Badge>
                ) : (
                  <>
                    <span className="text-muted-foreground/60">if </span>
                    <span className="text-foreground/70 font-mono">
                      {conditionSummary}
                    </span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Spacer when expanded */}
          {isExpanded && <div className="flex-1" />}

          {/* Action buttons */}
          <div className="flex items-center shrink-0 opacity-60 group-hover/card:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7",
                action.enabled
                  ? "text-green-500 hover:text-green-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={handleToggleEnabled}
              title={action.enabled ? "Disable action" : "Enable action"}
            >
              <PowerIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={onDuplicate}
              title="Duplicate action"
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              title="Remove action"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded content - Condition builder */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-3 border-t bg-muted/20">
            <ActionEditorInternal
              action={action}
              onConditionsChange={handleConditionsChange}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

// -----------------------------------------------------------------------------
// ActionList - Shows all actions in priority order
// -----------------------------------------------------------------------------

export function ActionList({
  actions,
  onChange,
  spells,
  actionLists = [],
}: ActionEditorProps) {
  const handleUpdateAction = useCallback(
    (actionId: string, updates: Partial<Action>) => {
      onChange(
        actions.map((action) =>
          action.id === actionId ? { ...action, ...updates } : action,
        ),
      );
    },
    [actions, onChange],
  );

  const handleRemoveAction = useCallback(
    (actionId: string) => {
      onChange(actions.filter((action) => action.id !== actionId));
    },
    [actions, onChange],
  );

  const handleDuplicateAction = useCallback(
    (actionId: string) => {
      const index = actions.findIndex((a) => a.id === actionId);
      if (index === -1) return;

      const original = actions[index];
      const duplicate = createAction(original.spell, original.type ?? "spell", {
        enabled: original.enabled,
        conditions: JSON.parse(JSON.stringify(original.conditions)),
      });

      const newActions = [...actions];
      newActions.splice(index + 1, 0, duplicate);
      onChange(newActions);
    },
    [actions, onChange],
  );

  const handleAddAction = useCallback(() => {
    const defaultSpell = spells[0]?.name ?? "unknown";
    onChange([...actions, createAction(defaultSpell)]);
  }, [actions, onChange, spells]);

  if (actions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground py-12 text-center border border-dashed rounded-lg bg-muted/10">
          <p>No actions in this list.</p>
          <p className="text-xs mt-1">Add an action to get started.</p>
        </div>
        <Button
          variant="outline"
          className="w-full h-10 border-dashed hover:border-solid hover:bg-muted/50 transition-all"
          onClick={handleAddAction}
        >
          <PlusIcon className="size-4 mr-2" />
          Add Action
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {actions.map((action, index) => (
          <ActionCard
            key={action.id}
            action={action}
            index={index}
            spells={spells}
            actionLists={actionLists}
            onUpdate={(updates) => handleUpdateAction(action.id, updates)}
            onRemove={() => handleRemoveAction(action.id)}
            onDuplicate={() => handleDuplicateAction(action.id)}
          />
        ))}
      </div>
      <Button
        variant="outline"
        className="w-full h-10 border-dashed hover:border-solid hover:bg-muted/50 transition-all"
        onClick={handleAddAction}
      >
        <PlusIcon className="size-4 mr-2" />
        Add Action
      </Button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Re-exports
// -----------------------------------------------------------------------------

export type { Action } from "./types";
