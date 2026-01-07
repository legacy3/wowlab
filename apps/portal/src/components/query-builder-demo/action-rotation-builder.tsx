"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { QueryBuilder, formatQuery } from "react-querybuilder";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  shadcnInlineControlElements,
  shadcnControlClassnames,
  shadcnTranslations,
} from "./shadcn-controls";
import {
  CONDITION_FIELDS,
  COMPARISON_OPERATORS,
  SPELLS,
  INITIAL_ROTATION,
  type ActionEntry,
  type ActionList,
  type RotationConfig,
} from "./types";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getSpellLabel(spellName: string): string {
  const spell = SPELLS.find((s) => s.name === spellName);
  return spell?.label ?? spellName.replace(/_/g, " ");
}

function getConditionSummary(conditions: RuleGroupType): string {
  if (!conditions.rules.length) {
    return "Always";
  }

  // Show first few conditions inline
  const summaryParts: string[] = [];
  for (const rule of conditions.rules.slice(0, 2)) {
    if ("field" in rule) {
      const field = String(rule.field).replace(/_/g, " ");
      summaryParts.push(`${field} ${rule.operator} ${rule.value}`);
    }
  }

  const remaining = conditions.rules.length - summaryParts.length;
  if (remaining > 0) {
    summaryParts.push(`+${remaining} more`);
  }

  return summaryParts.join(", ");
}

let nextId = 100;
function generateId(): string {
  return `action-${++nextId}`;
}

// -----------------------------------------------------------------------------
// Action Entry Component
// -----------------------------------------------------------------------------

interface ActionEntryCardProps {
  action: ActionEntry;
  index: number;
  onUpdate: (id: string, updates: Partial<ActionEntry>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
}

function ActionEntryCard({
  action,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
}: ActionEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConditionsChange = useCallback(
    (q: RuleGroupType) => {
      onUpdate(action.id, { conditions: q });
    },
    [action.id, onUpdate],
  );

  const handleSpellChange = useCallback(
    (spell: string) => {
      onUpdate(action.id, { spell });
    },
    [action.id, onUpdate],
  );

  const handleToggleEnabled = useCallback(() => {
    onUpdate(action.id, { enabled: !action.enabled });
  }, [action.id, action.enabled, onUpdate]);

  const conditionSummary = getConditionSummary(action.conditions);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "rounded-lg border bg-card transition-colors",
          !action.enabled && "opacity-50",
        )}
      >
        {/* Header - Always visible */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Drag handle */}
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVerticalIcon className="size-4" />
          </div>

          {/* Priority number */}
          <Badge
            variant="secondary"
            className="w-6 h-6 p-0 justify-center text-xs font-mono"
          >
            {index + 1}
          </Badge>

          {/* Expand/collapse */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              {isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Spell name - THE KEY INFO */}
          <div className="flex-1 flex items-center gap-2">
            <Select value={action.spell} onValueChange={handleSpellChange}>
              <SelectTrigger className="w-[180px] h-8 font-medium">
                <SelectValue>{getSpellLabel(action.spell)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SPELLS.map((spell) => (
                  <SelectItem key={spell.name} value={spell.name}>
                    {spell.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Condition summary when collapsed */}
            {!isExpanded && (
              <span className="text-sm text-muted-foreground truncate max-w-[300px]">
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
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7",
                action.enabled ? "text-green-500" : "text-muted-foreground",
              )}
              onClick={handleToggleEnabled}
              title={action.enabled ? "Disable action" : "Enable action"}
            >
              <PowerIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onDuplicate(action.id)}
              title="Duplicate action"
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(action.id)}
              title="Remove action"
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded content - Conditions */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              Conditions (if)
            </div>
            <QueryBuilder
              fields={CONDITION_FIELDS}
              query={action.conditions}
              onQueryChange={handleConditionsChange}
              controlElements={shadcnInlineControlElements}
              controlClassnames={{
                ...shadcnControlClassnames,
                queryBuilder: "space-y-2",
              }}
              translations={shadcnTranslations}
              operators={COMPARISON_OPERATORS}
              combinators={[
                { name: "and", label: "AND" },
                { name: "or", label: "OR" },
              ]}
              showCloneButtons
              resetOnFieldChange
            />
            {action.conditions.rules.length === 0 && (
              <div className="text-sm text-muted-foreground py-2 text-center border rounded-md bg-muted/30">
                No conditions - action will always execute when able
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// -----------------------------------------------------------------------------
// Action List Component
// -----------------------------------------------------------------------------

interface ActionListSectionProps {
  list: ActionList;
  onUpdateAction: (actionId: string, updates: Partial<ActionEntry>) => void;
  onRemoveAction: (actionId: string) => void;
  onDuplicateAction: (actionId: string) => void;
  onAddAction: (listId: string) => void;
}

function ActionListSection({
  list,
  onUpdateAction,
  onRemoveAction,
  onDuplicateAction,
  onAddAction,
}: ActionListSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-lg border bg-muted/20">
        {/* List header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
            {isExpanded ? (
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            )}
            <span className="font-medium">{list.label}</span>
            <Badge variant="secondary" className="text-xs">
              {list.actions.length} action{list.actions.length !== 1 ? "s" : ""}
            </Badge>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddAction(list.id);
              }}
            >
              <PlusIcon className="size-3.5 mr-1" />
              Add Action
            </Button>
          </div>
        </CollapsibleTrigger>

        {/* List body */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {list.actions.map((action, idx) => (
              <ActionEntryCard
                key={action.id}
                action={action}
                index={idx}
                onUpdate={onUpdateAction}
                onRemove={onRemoveAction}
                onDuplicate={onDuplicateAction}
              />
            ))}
            {list.actions.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No actions in this list. Click "Add Action" to create one.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function ActionRotationBuilder() {
  const [rotation, setRotation] = useState<RotationConfig>(INITIAL_ROTATION);

  // Action CRUD
  const handleUpdateAction = useCallback(
    (actionId: string, updates: Partial<ActionEntry>) => {
      setRotation((prev) => ({
        ...prev,
        actionLists: prev.actionLists.map((list) => ({
          ...list,
          actions: list.actions.map((action) =>
            action.id === actionId ? { ...action, ...updates } : action,
          ),
        })),
      }));
    },
    [],
  );

  const handleRemoveAction = useCallback((actionId: string) => {
    setRotation((prev) => ({
      ...prev,
      actionLists: prev.actionLists.map((list) => ({
        ...list,
        actions: list.actions.filter((a) => a.id !== actionId),
      })),
    }));
  }, []);

  const handleDuplicateAction = useCallback((actionId: string) => {
    setRotation((prev) => ({
      ...prev,
      actionLists: prev.actionLists.map((list) => {
        const idx = list.actions.findIndex((a) => a.id === actionId);
        if (idx === -1) {
          return list;
        }
        const original = list.actions[idx];
        const duplicate: ActionEntry = {
          ...original,
          id: generateId(),
          conditions: { ...original.conditions },
        };
        const newActions = [...list.actions];
        newActions.splice(idx + 1, 0, duplicate);
        return { ...list, actions: newActions };
      }),
    }));
  }, []);

  const handleAddAction = useCallback((listId: string) => {
    const newAction: ActionEntry = {
      id: generateId(),
      spell: "kill_command",
      enabled: true,
      conditions: { combinator: "and", rules: [] },
    };
    setRotation((prev) => ({
      ...prev,
      actionLists: prev.actionLists.map((list) =>
        list.id === listId
          ? { ...list, actions: [...list.actions, newAction] }
          : list,
      ),
    }));
  }, []);

  const handleReset = useCallback(() => {
    setRotation(INITIAL_ROTATION);
  }, []);

  // Format for output - natural language for easy verification
  const formatAsNaturalLanguage = (): string => {
    const lines: string[] = [];
    for (const list of rotation.actionLists) {
      lines.push(`## ${list.label}`);
      for (let i = 0; i < list.actions.length; i++) {
        const action = list.actions[i];
        const spellLabel = getSpellLabel(action.spell);
        const prefix = action.enabled ? `${i + 1}.` : `${i + 1}. [DISABLED]`;

        if (action.conditions.rules.length === 0) {
          lines.push(`${prefix} Cast ${spellLabel}`);
        } else {
          const conditionText = formatQuery(
            action.conditions,
            "natural_language",
          );
          lines.push(`${prefix} Cast ${spellLabel} when ${conditionText}`);
        }
      }
      lines.push("");
    }
    return lines.join("\n");
  };

  return (
    <div className="space-y-6">
      {/* Rotation Builder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Rotation Builder</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rotation.actionLists.map((list) => (
            <ActionListSection
              key={list.id}
              list={list}
              onUpdateAction={handleUpdateAction}
              onRemoveAction={handleRemoveAction}
              onDuplicateAction={handleDuplicateAction}
              onAddAction={handleAddAction}
            />
          ))}
        </CardContent>
      </Card>

      {/* Output Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="natural">
            <TabsList className="mb-4">
              <TabsTrigger value="natural">Natural Language</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="natural">
              <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[300px] whitespace-pre-wrap">
                {formatAsNaturalLanguage()}
              </pre>
            </TabsContent>

            <TabsContent value="json">
              <pre className="rounded-md bg-muted p-4 text-sm overflow-auto max-h-[300px]">
                <code>{JSON.stringify(rotation, null, 2)}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
