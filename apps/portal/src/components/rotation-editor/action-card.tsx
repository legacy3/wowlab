"use client";

import { useState, useCallback, memo, useMemo } from "react";
import type { RuleGroupType } from "react-querybuilder";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  ListIcon,
  PowerIcon,
  TrashIcon,
} from "lucide-react";

import { GameIcon } from "@/components/game/game-icon";
import { SpellTooltip } from "@/components/game/game-tooltip";
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

import { ConditionBuilder } from "./condition-builder";
import { SpellPicker } from "./spell-picker";
import { getSpellById, type SpellData } from "./data";
import type { Action, ActionType } from "./types";
import { getConditionSummary } from "./utils";

/** Convert SpellData to tooltip format */
function toTooltipData(spell: SpellData) {
  return {
    name: spell.label,
    castTime: "Instant",
    cooldown: spell.cooldown ? `${spell.cooldown} sec` : undefined,
    cost: spell.cost ? `${spell.cost} ${spell.costType ?? "Focus"}` : undefined,
    range: spell.range ? `${spell.range} yd range` : undefined,
    description: spell.description,
    iconName: spell.iconName,
  };
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ActionCardProps {
  action: Action;
  index: number;
  callableLists: Array<{ id: string; name: string; label: string }>;
  onUpdate: (updates: Partial<Omit<Action, "id">>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ActionCard = memo(function ActionCard({
  action,
  index,
  callableLists,
  onUpdate,
  onDelete,
  onDuplicate,
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCallList = action.type === "call_action_list";

  // Get spell data for icon display
  const spell = useMemo(() => {
    if (isCallList || !action.spellId) return undefined;
    return getSpellById(action.spellId);
  }, [action.spellId, isCallList]);

  const handleConditionChange = useCallback(
    (condition: RuleGroupType) => {
      onUpdate({ condition });
    },
    [onUpdate],
  );

  const conditionSummary = getConditionSummary(action.condition);

  // Icon element based on action type
  const actionIcon = isCallList ? (
    <div className="flex size-9 items-center justify-center rounded-md border bg-blue-500/10 text-blue-500">
      <ListIcon className="size-5" />
    </div>
  ) : spell ? (
    <SpellTooltip spell={toTooltipData(spell)}>
      <div className="shrink-0 overflow-hidden rounded-md border">
        <GameIcon iconName={spell.iconName} size="medium" width={36} height={36} />
      </div>
    </SpellTooltip>
  ) : (
    <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-muted-foreground text-xs">
      ?
    </div>
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "group rounded-lg border bg-card transition-all",
          !action.enabled && "opacity-50",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Drag handle */}
          <GripVerticalIcon className="size-4 text-muted-foreground/40 cursor-grab" />

          {/* Priority */}
          <Badge variant="secondary" className="size-6 p-0 justify-center text-xs">
            {index + 1}
          </Badge>

          {/* Spell/List Icon */}
          {actionIcon}

          {/* Expand toggle */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              {isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Action type selector */}
          <Select
            value={action.type}
            onValueChange={(type) => onUpdate({ type: type as ActionType })}
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spell">Spell</SelectItem>
              <SelectItem value="call_action_list">Call List</SelectItem>
            </SelectContent>
          </Select>

          {/* Spell/List selector */}
          {isCallList ? (
            <Select
              value={action.listId}
              onValueChange={(listId) => onUpdate({ listId })}
            >
              <SelectTrigger className="w-32 h-7 text-xs text-blue-500">
                <SelectValue placeholder="Select list..." />
              </SelectTrigger>
              <SelectContent>
                {callableLists.length === 0 ? (
                  <SelectItem value="" disabled>
                    No sub-lists available
                  </SelectItem>
                ) : (
                  callableLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : (
            <SpellPicker
              value={action.spellId}
              onSelect={(spellId) => onUpdate({ spellId })}
            />
          )}

          {/* Condition summary (collapsed) */}
          {!isExpanded && (
            <div className="flex-1 min-w-0 px-1">
              <span className="text-xs text-muted-foreground truncate">
                {conditionSummary === "Always" ? (
                  <Badge variant="outline" className="text-[10px] h-5">
                    Always
                  </Badge>
                ) : (
                  <>
                    <span className="text-muted-foreground/60">if </span>
                    <span className="font-mono">{conditionSummary}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {isExpanded && <div className="flex-1" />}

          {/* Actions */}
          <div className="flex items-center opacity-60 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-7",
                action.enabled ? "text-green-500" : "text-muted-foreground",
              )}
              onClick={() => onUpdate({ enabled: !action.enabled })}
            >
              <PowerIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onDuplicate}
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 hover:text-destructive"
              onClick={onDelete}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded: Condition builder */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-3 border-t bg-muted/20">
            <ConditionBuilder
              condition={action.condition}
              onChange={handleConditionChange}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
