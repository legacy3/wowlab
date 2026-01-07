"use client";

import { memo, useCallback } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Condition, ConditionOp, ConditionExpression } from "./types";

// Common subjects for the autocomplete
const COMMON_SUBJECTS = [
  { value: "player.health_pct", label: "Player Health %", category: "Player" },
  { value: "player.mana_pct", label: "Player Mana %", category: "Player" },
  { value: "player.focus", label: "Player Focus", category: "Player" },
  { value: "player.combo_points", label: "Combo Points", category: "Player" },
  { value: "player.is_moving", label: "Is Moving", category: "Player" },
  {
    value: "target.health_pct",
    label: "Target Health %",
    category: "Target",
  },
  { value: "target.time_to_die", label: "Time to Die", category: "Target" },
  { value: "target.distance", label: "Target Distance", category: "Target" },
  {
    value: "target.debuffs.count",
    label: "Debuff Count on Target",
    category: "Target",
  },
  { value: "spell.cooldown", label: "Spell Cooldown", category: "Spell" },
  { value: "spell.charges", label: "Spell Charges", category: "Spell" },
  { value: "spell.is_ready", label: "Spell Ready", category: "Spell" },
  { value: "buff.active", label: "Buff Active", category: "Buffs" },
  { value: "buff.remaining", label: "Buff Remaining", category: "Buffs" },
  { value: "buff.stacks", label: "Buff Stacks", category: "Buffs" },
  { value: "enemies.count", label: "Enemy Count", category: "Combat" },
  { value: "in_combat", label: "In Combat", category: "Combat" },
  { value: "boss_fight", label: "Boss Fight", category: "Combat" },
];

const OPERATORS: { value: ConditionOp; label: string; symbol: string }[] = [
  { value: "eq", label: "equals", symbol: "=" },
  { value: "neq", label: "not equals", symbol: "!=" },
  { value: "lt", label: "less than", symbol: "<" },
  { value: "lte", label: "less or equal", symbol: "<=" },
  { value: "gt", label: "greater than", symbol: ">" },
  { value: "gte", label: "greater or equal", symbol: ">=" },
  { value: "has", label: "has", symbol: "has" },
  { value: "missing", label: "missing", symbol: "!has" },
];

interface ConditionBuilderProps {
  value?: Condition;
  onChange?: (condition: Condition | undefined) => void;
  depth?: number;
}

/** Generate a simple unique ID */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Single expression row */
const ExpressionRow = memo(function ExpressionRow({
  expression,
  onChange,
  onRemove,
}: {
  expression: ConditionExpression;
  onChange: (expr: ConditionExpression) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-background border group">
      {/* Subject selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[140px] justify-start font-mono text-xs"
          >
            {expression.subject || "Select..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(
              COMMON_SUBJECTS.reduce(
                (acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                },
                {} as Record<string, typeof COMMON_SUBJECTS>,
              ),
            ).map(([category, items]) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted">
                  {category}
                </div>
                {items.map((item) => (
                  <button
                    key={item.value}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                    onClick={() =>
                      onChange({ ...expression, subject: item.value })
                    }
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">
                      {item.value}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t p-2">
            <Input
              placeholder="Custom expression..."
              className="h-7 text-xs font-mono"
              value={expression.subject}
              onChange={(e) =>
                onChange({ ...expression, subject: e.target.value })
              }
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Operator selector */}
      <Select
        value={expression.op}
        onValueChange={(op: ConditionOp) => onChange({ ...expression, op })}
      >
        <SelectTrigger className="w-20 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              <span className="font-mono">{op.symbol}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {expression.op !== "has" && expression.op !== "missing" && (
        <Input
          className="w-24 h-8 font-mono text-sm"
          value={String(expression.value ?? "")}
          onChange={(e) => {
            const val = e.target.value;
            // Try to parse as number
            const num = parseFloat(val);
            onChange({
              ...expression,
              value: isNaN(num) ? val : num,
            });
          }}
          placeholder="value"
        />
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
});

/** Logical group (AND/OR) */
const LogicalGroup = memo(function LogicalGroup({
  type,
  conditions,
  onChange,
  onRemove,
  depth,
}: {
  type: "and" | "or";
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  onRemove?: () => void;
  depth: number;
}) {
  const addExpression = useCallback(() => {
    const newExpr: ConditionExpression = {
      id: generateId(),
      type: "expression",
      subject: "",
      op: "gte",
      value: 0,
    };
    onChange([...conditions, newExpr]);
  }, [conditions, onChange]);

  const addGroup = useCallback(
    (groupType: "and" | "or") => {
      const newGroup: Condition = {
        id: generateId(),
        type: groupType,
        conditions: [],
      };
      onChange([...conditions, newGroup]);
    },
    [conditions, onChange],
  );

  const updateCondition = useCallback(
    (index: number, updated: Condition) => {
      const newConditions = [...conditions];
      newConditions[index] = updated;
      onChange(newConditions);
    },
    [conditions, onChange],
  );

  const removeCondition = useCallback(
    (index: number) => {
      onChange(conditions.filter((_, i) => i !== index));
    },
    [conditions, onChange],
  );

  const bgColor = type === "and" ? "bg-blue-500/5" : "bg-amber-500/5";
  const borderColor =
    type === "and" ? "border-blue-500/20" : "border-amber-500/20";
  const badgeVariant = type === "and" ? "default" : "secondary";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        bgColor,
        borderColor,
        depth > 0 && "ml-4",
      )}
    >
      {/* Group header */}
      <div className="flex items-center gap-2">
        <Badge variant={badgeVariant} className="uppercase text-[10px]">
          {type}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {type === "and"
            ? "All conditions must match"
            : "Any condition can match"}
        </span>
        <div className="flex-1" />
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={condition.id}>
            {condition.type === "expression" ? (
              <ExpressionRow
                expression={condition}
                onChange={(expr) => updateCondition(index, expr)}
                onRemove={() => removeCondition(index)}
              />
            ) : condition.type === "and" || condition.type === "or" ? (
              <LogicalGroup
                type={condition.type}
                conditions={condition.conditions}
                onChange={(conds) =>
                  updateCondition(index, { ...condition, conditions: conds })
                }
                onRemove={() => removeCondition(index)}
                depth={depth + 1}
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={addExpression}
        >
          <Plus className="size-3 mr-1" />
          Condition
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => addGroup("and")}
        >
          <Plus className="size-3 mr-1" />
          AND Group
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => addGroup("or")}
        >
          <Plus className="size-3 mr-1" />
          OR Group
        </Button>
      </div>
    </div>
  );
});

export const ConditionBuilder = memo(function ConditionBuilder({
  value,
  onChange,
  depth = 0,
}: ConditionBuilderProps) {
  // If no condition, show "add condition" button
  if (!value) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            const newExpr: ConditionExpression = {
              id: generateId(),
              type: "expression",
              subject: "",
              op: "gte",
              value: 0,
            };
            onChange?.(newExpr);
          }}
        >
          <Plus className="size-3 mr-1" />
          Add Condition
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            onChange?.({
              id: generateId(),
              type: "and",
              conditions: [],
            });
          }}
        >
          <Plus className="size-3 mr-1" />
          Add AND Group
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            onChange?.({
              id: generateId(),
              type: "or",
              conditions: [],
            });
          }}
        >
          <Plus className="size-3 mr-1" />
          Add OR Group
        </Button>
      </div>
    );
  }

  // Single expression
  if (value.type === "expression") {
    return (
      <ExpressionRow
        expression={value}
        onChange={(expr) => onChange?.(expr)}
        onRemove={() => onChange?.(undefined)}
      />
    );
  }

  // AND/OR group
  if (value.type === "and" || value.type === "or") {
    return (
      <LogicalGroup
        type={value.type}
        conditions={value.conditions}
        onChange={(conditions) => onChange?.({ ...value, conditions })}
        onRemove={() => onChange?.(undefined)}
        depth={depth}
      />
    );
  }

  // NOT wrapper (less common, simplified UI)
  if (value.type === "not") {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="uppercase text-[10px]">
            NOT
          </Badge>
          <span className="text-xs text-muted-foreground">
            Inverts the condition
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={() => onChange?.(undefined)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
        <ConditionBuilder
          value={value.condition}
          onChange={(cond) =>
            cond
              ? onChange?.({ ...value, condition: cond })
              : onChange?.(undefined)
          }
          depth={depth + 1}
        />
      </div>
    );
  }

  return null;
});
