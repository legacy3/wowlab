"use client";

import { memo, useState } from "react";
import { Plus, X, Filter, Target, Users, ChevronRight } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  TargetSelection,
  SimpleTarget,
  FilteredTarget,
  TargetPool,
  TargetFilter,
  ComparisonOp,
  AggregateFunc,
} from "./types";

const SIMPLE_TARGETS: { value: SimpleTarget; label: string; icon: string }[] = [
  { value: "self", label: "Self", icon: "player" },
  { value: "current_target", label: "Current Target", icon: "target" },
  { value: "focus", label: "Focus Target", icon: "focus" },
  { value: "pet", label: "Pet", icon: "pet" },
];

const TARGET_POOLS: { value: TargetPool; label: string }[] = [
  { value: "enemies", label: "Enemies" },
  { value: "allies", label: "Allies" },
  { value: "party", label: "Party" },
  { value: "raid", label: "Raid" },
];

const FILTER_ATTRIBUTES = [
  { value: "health_pct", label: "Health %", type: "number" },
  { value: "distance", label: "Distance", type: "number" },
  { value: "time_to_die", label: "Time to Die", type: "number" },
  { value: "has_debuff", label: "Has Debuff", type: "string" },
  { value: "missing_debuff", label: "Missing Debuff", type: "string" },
  { value: "is_boss", label: "Is Boss", type: "boolean" },
  { value: "in_range", label: "In Range", type: "boolean" },
  { value: "is_interruptible", label: "Is Casting", type: "boolean" },
];

const COMPARISON_OPS: { value: ComparisonOp; label: string; symbol: string }[] =
  [
    { value: "eq", label: "equals", symbol: "=" },
    { value: "neq", label: "not equals", symbol: "!=" },
    { value: "lt", label: "less than", symbol: "<" },
    { value: "lte", label: "at most", symbol: "<=" },
    { value: "gt", label: "greater than", symbol: ">" },
    { value: "gte", label: "at least", symbol: ">=" },
  ];

const AGGREGATE_FUNCS: { value: AggregateFunc; label: string; desc: string }[] =
  [
    { value: "first", label: "First", desc: "First matching target" },
    { value: "min", label: "Min", desc: "Lowest value" },
    { value: "max", label: "Max", desc: "Highest value" },
    { value: "random", label: "Random", desc: "Random target" },
    { value: "count", label: "Count", desc: "Number of matches" },
  ];

/** Generate a simple unique ID */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface FilterRowProps {
  filter: TargetFilter;
  onChange: (filter: TargetFilter) => void;
  onRemove: () => void;
}

const FilterRow = memo(function FilterRow({
  filter,
  onChange,
  onRemove,
}: FilterRowProps) {
  const attrDef = FILTER_ATTRIBUTES.find((a) => a.value === filter.attribute);

  return (
    <div className="flex items-center gap-2 p-2 rounded bg-background border group">
      {/* Attribute */}
      <Select
        value={filter.attribute}
        onValueChange={(attribute) => onChange({ ...filter, attribute })}
      >
        <SelectTrigger className="w-32 h-7 text-xs">
          <SelectValue placeholder="Attribute" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_ATTRIBUTES.map((attr) => (
            <SelectItem key={attr.value} value={attr.value}>
              {attr.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select
        value={filter.op}
        onValueChange={(op: ComparisonOp) => onChange({ ...filter, op })}
      >
        <SelectTrigger className="w-16 h-7 text-xs font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPARISON_OPS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      {attrDef?.type === "boolean" ? (
        <Select
          value={String(filter.value)}
          onValueChange={(v) => onChange({ ...filter, value: v === "true" })}
        >
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          className="w-20 h-7 text-xs"
          value={String(filter.value ?? "")}
          onChange={(e) => {
            const val = e.target.value;
            const num = parseFloat(val);
            onChange({
              ...filter,
              value: attrDef?.type === "number" && !isNaN(num) ? num : val,
            });
          }}
          placeholder="value"
        />
      )}

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
});

interface TargetSelectorProps {
  value: TargetSelection;
  onChange: (value: TargetSelection) => void;
}

export const TargetSelector = memo(function TargetSelector({
  value,
  onChange,
}: TargetSelectorProps) {
  const isSimple = typeof value === "string";
  const [mode, setMode] = useState<"simple" | "filtered">(
    isSimple ? "simple" : "filtered",
  );

  const handleModeChange = (newMode: "simple" | "filtered") => {
    setMode(newMode);
    if (newMode === "simple") {
      onChange("current_target");
    } else {
      onChange({
        pool: "enemies",
        filters: [],
        select: { func: "first" },
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && handleModeChange(v as "simple" | "filtered")}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="simple" className="gap-1.5 text-xs">
          <Target className="size-3" />
          Simple
        </ToggleGroupItem>
        <ToggleGroupItem value="filtered" className="gap-1.5 text-xs">
          <Filter className="size-3" />
          Filtered
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Simple target selector */}
      {mode === "simple" && (
        <div className="grid grid-cols-2 gap-2">
          {SIMPLE_TARGETS.map((target) => (
            <Button
              key={target.value}
              variant={value === target.value ? "default" : "outline"}
              size="sm"
              className="justify-start gap-2 h-9"
              onClick={() => onChange(target.value)}
            >
              <Target className="size-3.5" />
              {target.label}
            </Button>
          ))}
        </div>
      )}

      {/* Filtered target builder */}
      {mode === "filtered" && !isSimple && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          {/* Pool + Selection flow visualization */}
          <div className="flex items-center gap-2 text-sm">
            {/* Pool selector */}
            <Select
              value={(value as FilteredTarget).pool}
              onValueChange={(pool: TargetPool) =>
                onChange({ ...(value as FilteredTarget), pool })
              }
            >
              <SelectTrigger className="w-28 h-8">
                <Users className="size-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_POOLS.map((pool) => (
                  <SelectItem key={pool.value} value={pool.value}>
                    {pool.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ChevronRight className="size-4 text-muted-foreground" />

            {/* Filter indicator */}
            <Badge
              variant="outline"
              className={cn(
                "gap-1",
                (value as FilteredTarget).filters.length > 0 &&
                  "bg-primary/10 border-primary/30",
              )}
            >
              <Filter className="size-3" />
              {(value as FilteredTarget).filters.length} filters
            </Badge>

            <ChevronRight className="size-4 text-muted-foreground" />

            {/* Aggregate selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <span className="font-medium">
                    {
                      AGGREGATE_FUNCS.find(
                        (f) =>
                          f.value === (value as FilteredTarget).select.func,
                      )?.label
                    }
                  </span>
                  {(value as FilteredTarget).select.attribute && (
                    <span className="text-muted-foreground font-mono text-xs">
                      ({(value as FilteredTarget).select.attribute})
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  {AGGREGATE_FUNCS.map((func) => (
                    <button
                      key={func.value}
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors",
                        (value as FilteredTarget).select.func === func.value &&
                          "bg-accent",
                      )}
                      onClick={() =>
                        onChange({
                          ...(value as FilteredTarget),
                          select: {
                            ...(value as FilteredTarget).select,
                            func: func.value,
                          },
                        })
                      }
                    >
                      <div className="font-medium">{func.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {func.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Attribute for min/max */}
                {((value as FilteredTarget).select.func === "min" ||
                  (value as FilteredTarget).select.func === "max") && (
                  <div className="mt-2 pt-2 border-t">
                    <label className="text-xs text-muted-foreground">
                      By attribute:
                    </label>
                    <Select
                      value={(value as FilteredTarget).select.attribute || ""}
                      onValueChange={(attr) =>
                        onChange({
                          ...(value as FilteredTarget),
                          select: {
                            ...(value as FilteredTarget).select,
                            attribute: attr,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_ATTRIBUTES.filter(
                          (a) => a.type === "number",
                        ).map((attr) => (
                          <SelectItem key={attr.value} value={attr.value}>
                            {attr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Filters list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Filters
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  const newFilter: TargetFilter = {
                    id: generateId(),
                    attribute: "health_pct",
                    op: "lte",
                    value: 100,
                  };
                  onChange({
                    ...(value as FilteredTarget),
                    filters: [...(value as FilteredTarget).filters, newFilter],
                  });
                }}
              >
                <Plus className="size-3 mr-1" />
                Add Filter
              </Button>
            </div>

            {(value as FilteredTarget).filters.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2 bg-background rounded border border-dashed">
                No filters - will match all {(value as FilteredTarget).pool}
              </div>
            ) : (
              <div className="space-y-1.5">
                {(value as FilteredTarget).filters.map((filter, index) => (
                  <FilterRow
                    key={filter.id}
                    filter={filter}
                    onChange={(updated) => {
                      const filters = [...(value as FilteredTarget).filters];
                      filters[index] = updated;
                      onChange({ ...(value as FilteredTarget), filters });
                    }}
                    onRemove={() => {
                      const filters = (value as FilteredTarget).filters.filter(
                        (_, i) => i !== index,
                      );
                      onChange({ ...(value as FilteredTarget), filters });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Preview text */}
          <div className="text-xs text-muted-foreground bg-background rounded px-2 py-1.5 font-mono">
            {(value as FilteredTarget).pool}
            {(value as FilteredTarget).filters.length > 0 && (
              <>
                {" | where "}
                {(value as FilteredTarget).filters
                  .map(
                    (f) =>
                      `${f.attribute} ${COMPARISON_OPS.find((o) => o.value === f.op)?.symbol} ${f.value}`,
                  )
                  .join(" AND ")}
              </>
            )}
            {" | "}
            {(value as FilteredTarget).select.func}
            {(value as FilteredTarget).select.attribute &&
              ` by ${(value as FilteredTarget).select.attribute}`}
          </div>
        </div>
      )}
    </div>
  );
});
