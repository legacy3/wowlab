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

import type { Action } from "./types";
import { getSpellLabel, getConditionSummary } from "./utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ActionEditorProps {
  actions: Action[];
  onChange: (actions: Action[]) => void;
  spells: Array<{ name: string; label: string }>;
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
  options?: Partial<Omit<Action, "id">>,
): Action {
  return {
    id: generateActionId(),
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
  onUpdate: (updates: Partial<Action>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const ActionCard = memo(function ActionCard({
  action,
  index,
  spells,
  onUpdate,
  onRemove,
  onDuplicate,
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleToggleEnabled = useCallback(() => {
    onUpdate({ enabled: !action.enabled });
  }, [action.enabled, onUpdate]);

  const conditionSummary = useMemo(
    () => getConditionSummary(action.conditions),
    [action.conditions],
  );

  const spellLabel = useMemo(
    () => getSpellLabel(action.spell, spells),
    [action.spell, spells],
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "rounded-lg border bg-card transition-colors",
          !action.enabled && "opacity-50",
        )}
      >
        {/* Header - Always visible */}
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          {/* Drag handle (placeholder) */}
          <div
            className="cursor-grab text-muted-foreground hover:text-foreground"
            title="Drag to reorder"
          >
            <GripVerticalIcon className="size-3.5" />
          </div>

          {/* Priority number */}
          <Badge
            variant="secondary"
            className="w-5 h-5 p-0 justify-center text-[10px] font-mono shrink-0"
          >
            {index + 1}
          </Badge>

          {/* Expand/collapse toggle */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 shrink-0">
              {isExpanded ? (
                <ChevronDownIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Spell selector */}
          <Select value={action.spell} onValueChange={handleSpellChange}>
            <SelectTrigger className="w-[140px] h-6 text-xs font-medium shrink-0">
              <SelectValue>{spellLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {spells.map((spell) => (
                <SelectItem key={spell.name} value={spell.name}>
                  {spell.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Condition summary when collapsed */}
          {!isExpanded && (
            <div className="flex-1 min-w-0">
              <span className="text-sm text-muted-foreground truncate block">
                {conditionSummary === "Always" ? (
                  <Badge variant="outline" className="text-[10px]">
                    Always
                  </Badge>
                ) : (
                  <>
                    <span className="text-muted-foreground/70">if </span>
                    <span className="text-foreground/80">
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
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-6",
                action.enabled ? "text-green-500" : "text-muted-foreground",
              )}
              onClick={handleToggleEnabled}
              title={action.enabled ? "Disable action" : "Enable action"}
            >
              <PowerIcon className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={onDuplicate}
              title="Duplicate action"
            >
              <CopyIcon className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-destructive hover:text-destructive"
              onClick={onRemove}
              title="Remove action"
            >
              <TrashIcon className="size-3" />
            </Button>
          </div>
        </div>

        {/* Expanded content - Condition builder */}
        <CollapsibleContent>
          <div className="px-3 pb-2 pt-2 border-t">
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

export function ActionList({ actions, onChange, spells }: ActionEditorProps) {
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
      const duplicate = createAction(original.spell, {
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
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">
          No actions in this list. Add an action to get started.
        </div>
        <Button variant="outline" className="w-full" onClick={handleAddAction}>
          <PlusIcon className="size-4 mr-2" />
          Add Action
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {actions.map((action, index) => (
          <ActionCard
            key={action.id}
            action={action}
            index={index}
            spells={spells}
            onUpdate={(updates) => handleUpdateAction(action.id, updates)}
            onRemove={() => handleRemoveAction(action.id)}
            onDuplicate={() => handleDuplicateAction(action.id)}
          />
        ))}
      </div>
      <Button variant="outline" className="w-full" onClick={handleAddAction}>
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
