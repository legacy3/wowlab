"use client";

import { memo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  MoreHorizontal,
  Zap,
  Clock,
  Variable,
  FolderOpen,
  Power,
  PowerOff,
  Timer,
  Gauge,
  Target,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Action, SpellReference, Condition } from "./types";
import { ConditionBuilder } from "./condition-builder";
import { TargetSelector } from "./target-selector";
import { SpellPicker } from "./spell-picker";

// Mock spell metadata
const SPELL_META: Record<
  number,
  { cooldown: string; cost: string; range: string; description: string }
> = {
  56641: {
    cooldown: "None",
    cost: "None",
    range: "40 yd",
    description: "A steady shot that causes Physical damage.",
  },
  34026: {
    cooldown: "7.5s",
    cost: "30 Focus",
    range: "50 yd",
    description:
      "Give the command to kill, causing your pet to savagely deal damage.",
  },
  193455: {
    cooldown: "None",
    cost: "35 Focus",
    range: "40 yd",
    description: "A quick shot causing Nature damage.",
  },
  19434: {
    cooldown: "12s",
    cost: "35 Focus",
    range: "40 yd",
    description: "A powerful aimed shot that deals Physical damage.",
  },
  257620: {
    cooldown: "None",
    cost: "40 Focus",
    range: "40 yd",
    description: "Fires several missiles, hitting all nearby enemies.",
  },
  186270: {
    cooldown: "None",
    cost: "30 Focus",
    range: "Melee",
    description: "A vicious slash dealing Physical damage.",
  },
};

interface ActionRowProps {
  action: Action;
  index: number;
  spell?: SpellReference;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (action: Action) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

/** Icon component for displaying spell icons with fallback */
function SpellIcon({
  spell,
  className,
}: {
  spell?: SpellReference;
  className?: string;
}) {
  if (!spell) {
    return (
      <div
        className={cn(
          "rounded bg-muted flex items-center justify-center",
          className,
        )}
      >
        <Zap className="size-4 text-muted-foreground" />
      </div>
    );
  }

  // In production, this would use GameIcon component
  return (
    <div
      className={cn("rounded flex items-center justify-center", className)}
      style={{ backgroundColor: spell.color || "#6366f1" }}
    >
      <span className="text-white text-xs font-bold">
        {spell.name.charAt(0)}
      </span>
    </div>
  );
}

/** Get action type icon */
function getActionIcon(type: Action["type"]) {
  switch (type) {
    case "cast":
      return Zap;
    case "wait":
      return Clock;
    case "set_variable":
      return Variable;
    case "call_group":
      return FolderOpen;
  }
}

/** Get action type label */
function getActionLabel(action: Action): string {
  switch (action.type) {
    case "cast":
      return "Cast";
    case "wait":
      return action.duration ? `Wait ${action.duration}ms` : "Wait";
    case "set_variable":
      return "Set Variable";
    case "call_group":
      return "Call Group";
  }
}

/** Format condition as readable text */
function formatCondition(condition: Condition): string {
  if (condition.type === "expression") {
    const opSymbols: Record<string, string> = {
      eq: "=",
      neq: "!=",
      lt: "<",
      lte: "<=",
      gt: ">",
      gte: ">=",
      has: "has",
      missing: "missing",
    };
    return `${condition.subject} ${opSymbols[condition.op] || condition.op} ${condition.value}`;
  }
  if (condition.type === "and") {
    return condition.conditions.map(formatCondition).join(" AND ");
  }
  if (condition.type === "or") {
    return condition.conditions.map(formatCondition).join(" OR ");
  }
  if (condition.type === "not") {
    return `NOT (${formatCondition(condition.condition)})`;
  }
  return "";
}

export const ActionRow = memo(function ActionRow({
  action,
  index,
  spell,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: ActionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ActionIcon = getActionIcon(action.type);
  const hasCondition = !!action.condition;
  const spellMeta = action.type === "cast" ? SPELL_META[action.spellId] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isSelected && "ring-2 ring-primary",
        !action.enabled && "opacity-60",
      )}
    >
      {/* Main row - always visible */}
      <div
        className={cn(
          "flex items-center gap-2 p-2 cursor-pointer hover:bg-accent/50 transition-colors",
          isExpanded && "border-b",
        )}
        onClick={onSelect}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        {/* Priority number */}
        <Badge
          variant="secondary"
          className="w-6 h-6 p-0 flex items-center justify-center font-mono text-xs"
        >
          {index + 1}
        </Badge>

        {/* Action icon/spell icon */}
        {action.type === "cast" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SpellIcon spell={spell} className="size-8" />
              </div>
            </TooltipTrigger>
            {spell && spellMeta && (
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{spell.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="size-3" />
                      {spellMeta.cooldown}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3" />
                      {spellMeta.cost}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="size-3" />
                      {spellMeta.range}
                    </span>
                  </div>
                  <p className="text-xs">{spellMeta.description}</p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        ) : (
          <div className="size-8 rounded bg-muted flex items-center justify-center">
            <ActionIcon className="size-4 text-muted-foreground" />
          </div>
        )}

        {/* Action info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {action.label ||
                (action.type === "cast" && spell?.name) ||
                getActionLabel(action)}
            </span>
            {hasCondition && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 cursor-help"
                  >
                    if
                  </Badge>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-sm font-mono text-xs"
                >
                  {formatCondition(action.condition!)}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {action.type === "cast" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {typeof action.target === "string"
                  ? action.target.replace("_", " ")
                  : `${action.target.pool} | filtered`}
              </span>
              {spellMeta && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-0.5">
                    <Timer className="size-2.5" />
                    {spellMeta.cooldown}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Gauge className="size-2.5" />
                    {spellMeta.cost}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Enable/disable toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate?.({ ...action, enabled: !action.enabled });
              }}
            >
              {action.enabled ? (
                <Power className="size-3.5 text-green-500" />
              ) : (
                <PowerOff className="size-3.5 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{action.enabled ? "Disable" : "Enable"}</p>
            <p className="text-xs text-muted-foreground">E</p>
          </TooltipContent>
        </Tooltip>

        {/* Expand/collapse */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => e.stopPropagation()}
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* More actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="size-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="p-4 space-y-4 bg-muted/30">
            {/* Spell info card (for cast actions) */}
            {action.type === "cast" && spell && spellMeta && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                <SpellIcon spell={spell} className="size-10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{spell.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      ID: {spell.id}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {spellMeta.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Timer className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{spellMeta.cooldown}</span>
                      <span className="text-muted-foreground">cooldown</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{spellMeta.cost}</span>
                      <span className="text-muted-foreground">cost</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{spellMeta.range}</span>
                      <span className="text-muted-foreground">range</span>
                    </div>
                  </div>
                </div>
                <SpellPicker
                  value={action.spellId}
                  onChange={(spellId) =>
                    onUpdate?.({ ...action, spellId } as Action)
                  }
                  className="shrink-0"
                />
              </div>
            )}

            {/* Target selector (for cast actions) */}
            {action.type === "cast" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Target
                </label>
                <TargetSelector
                  value={action.target}
                  onChange={(target) =>
                    onUpdate?.({ ...action, target } as Action)
                  }
                />
              </div>
            )}

            {/* Condition builder */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Condition
                </label>
                {action.condition && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm">
                      <p className="font-mono text-xs">
                        {formatCondition(action.condition)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <ConditionBuilder
                value={action.condition}
                onChange={(condition) => onUpdate?.({ ...action, condition })}
              />
              {action.condition && (
                <div className="p-2 rounded bg-background border text-xs font-mono text-muted-foreground">
                  {formatCondition(action.condition)}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
