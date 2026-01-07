"use client";

import * as React from "react";
import { useCallback, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Expression Model
// -----------------------------------------------------------------------------

/**
 * An expression like: aura.bestial_wrath.remains >= 5
 *
 * Structure: [category].[name].[property] [operator] [value]
 */
export interface Expression {
  category: ExpressionCategory;
  name: string;
  property: string;
  operator?: ComparisonOperator;
  value?: string | number;
}

export type ExpressionCategory =
  | "aura"
  | "cooldown"
  | "resource"
  | "target"
  | "talent"
  | "pet"
  | "action"
  | "player"
  | "variable";

export type ComparisonOperator = "=" | "!=" | ">" | ">=" | "<" | "<=";

// -----------------------------------------------------------------------------
// Schema: What's available for each category
// -----------------------------------------------------------------------------

interface PropertyDef {
  name: string;
  label: string;
  type: "boolean" | "number" | "duration"; // boolean = no comparison needed
}

interface CategorySchema {
  label: string;
  names: { name: string; label: string }[];
  properties: PropertyDef[];
  /** If true, name is required. If false, category-level properties only */
  requiresName: boolean;
}

// This would come from your spec/class data in reality
const SAMPLE_AURAS = [
  { name: "bestial_wrath", label: "Bestial Wrath" },
  { name: "frenzy", label: "Frenzy" },
  { name: "beast_cleave", label: "Beast Cleave" },
  { name: "call_of_the_wild", label: "Call of the Wild" },
  { name: "bloodshed", label: "Bloodshed" },
  { name: "barbed_shot", label: "Barbed Shot" },
];

const SAMPLE_SPELLS = [
  { name: "kill_command", label: "Kill Command" },
  { name: "bestial_wrath", label: "Bestial Wrath" },
  { name: "barbed_shot", label: "Barbed Shot" },
  { name: "cobra_shot", label: "Cobra Shot" },
  { name: "call_of_the_wild", label: "Call of the Wild" },
  { name: "kill_shot", label: "Kill Shot" },
  { name: "bloodshed", label: "Bloodshed" },
];

const SAMPLE_TALENTS = [
  { name: "killer_instinct", label: "Killer Instinct" },
  { name: "animal_companion", label: "Animal Companion" },
  { name: "dire_beast", label: "Dire Beast" },
  { name: "scent_of_blood", label: "Scent of Blood" },
  { name: "thrill_of_the_hunt", label: "Thrill of the Hunt" },
  { name: "barbed_wrath", label: "Barbed Wrath" },
];

const SAMPLE_RESOURCES = [
  { name: "focus", label: "Focus" },
  { name: "health", label: "Health" },
];

export const EXPRESSION_SCHEMA: Record<ExpressionCategory, CategorySchema> = {
  aura: {
    label: "Aura/Buff",
    names: SAMPLE_AURAS,
    requiresName: true,
    properties: [
      { name: "up", label: "Active", type: "boolean" },
      { name: "down", label: "Not Active", type: "boolean" },
      { name: "remains", label: "Remaining (sec)", type: "duration" },
      { name: "stacks", label: "Stacks", type: "number" },
      { name: "refreshable", label: "Refreshable", type: "boolean" },
      { name: "max_stacks", label: "Max Stacks", type: "number" },
    ],
  },
  cooldown: {
    label: "Cooldown",
    names: SAMPLE_SPELLS,
    requiresName: true,
    properties: [
      { name: "ready", label: "Ready", type: "boolean" },
      { name: "remains", label: "Remaining (sec)", type: "duration" },
      { name: "charges", label: "Charges", type: "number" },
      {
        name: "charges_fractional",
        label: "Charges (fractional)",
        type: "number",
      },
      {
        name: "full_recharge_time",
        label: "Full Recharge Time",
        type: "duration",
      },
      { name: "max_charges", label: "Max Charges", type: "number" },
    ],
  },
  resource: {
    label: "Resource",
    names: SAMPLE_RESOURCES,
    requiresName: true,
    properties: [
      { name: "current", label: "Current", type: "number" },
      { name: "deficit", label: "Deficit", type: "number" },
      { name: "pct", label: "Percent", type: "number" },
      { name: "time_to_max", label: "Time to Max", type: "duration" },
      { name: "regen", label: "Regen Rate", type: "number" },
    ],
  },
  target: {
    label: "Target",
    names: [], // No specific names for target
    requiresName: false,
    properties: [
      { name: "health_pct", label: "Health %", type: "number" },
      { name: "time_to_die", label: "Time to Die", type: "duration" },
      { name: "distance", label: "Distance", type: "number" },
    ],
  },
  talent: {
    label: "Talent",
    names: SAMPLE_TALENTS,
    requiresName: true,
    properties: [
      { name: "enabled", label: "Enabled", type: "boolean" },
      { name: "rank", label: "Rank", type: "number" },
    ],
  },
  pet: {
    label: "Pet",
    names: [
      { name: "main", label: "Main Pet" },
      { name: "fiend", label: "Fiend" },
    ],
    requiresName: true,
    properties: [
      { name: "active", label: "Active", type: "boolean" },
      // Pet can also have aura sub-properties but let's keep it simple for now
    ],
  },
  action: {
    label: "Action",
    names: SAMPLE_SPELLS,
    requiresName: true,
    properties: [
      { name: "usable", label: "Usable", type: "boolean" },
      { name: "usable_in", label: "Usable In (sec)", type: "duration" },
      { name: "in_flight", label: "In Flight", type: "boolean" },
      { name: "executing", label: "Executing", type: "boolean" },
    ],
  },
  player: {
    label: "Player",
    names: [],
    requiresName: false,
    properties: [
      { name: "gcd", label: "GCD", type: "duration" },
      { name: "gcd_remains", label: "GCD Remaining", type: "duration" },
      { name: "in_combat", label: "In Combat", type: "boolean" },
      { name: "moving", label: "Moving", type: "boolean" },
    ],
  },
  variable: {
    label: "Variable",
    names: [], // Variables are user-defined, would be dynamic
    requiresName: true,
    properties: [{ name: "value", label: "Value", type: "number" }],
  },
};

const COMPARISON_OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: "=", label: "=" },
  { value: "!=", label: "≠" },
  { value: ">", label: ">" },
  { value: ">=", label: "≥" },
  { value: "<", label: "<" },
  { value: "<=", label: "≤" },
];

// -----------------------------------------------------------------------------
// Expression Selector Component
// -----------------------------------------------------------------------------

interface ExpressionSelectorProps {
  value: Expression;
  onChange: (expr: Expression) => void;
  /** User-defined variables to include in variable category */
  variables?: { name: string; label: string }[];
  className?: string;
}

export function ExpressionSelector({
  value,
  onChange,
  variables = [],
  className,
}: ExpressionSelectorProps) {
  const schema = EXPRESSION_SCHEMA[value.category];

  // Get available names (for variables, merge user-defined)
  const availableNames = useMemo(() => {
    if (value.category === "variable") {
      return variables;
    }
    return schema.names;
  }, [value.category, schema.names, variables]);

  const selectedProperty = schema.properties.find(
    (p) => p.name === value.property,
  );
  const needsComparison = selectedProperty?.type !== "boolean";

  const handleCategoryChange = useCallback(
    (category: ExpressionCategory) => {
      const newSchema = EXPRESSION_SCHEMA[category];
      const firstProperty = newSchema.properties[0];
      onChange({
        category,
        name: newSchema.requiresName ? (newSchema.names[0]?.name ?? "") : "",
        property: firstProperty?.name ?? "",
        operator: firstProperty?.type !== "boolean" ? ">=" : undefined,
        value: firstProperty?.type !== "boolean" ? "0" : undefined,
      });
    },
    [onChange],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      onChange({ ...value, name });
    },
    [value, onChange],
  );

  const handlePropertyChange = useCallback(
    (property: string) => {
      const prop = schema.properties.find((p) => p.name === property);
      const needsComp = prop?.type !== "boolean";
      onChange({
        ...value,
        property,
        operator: needsComp ? (value.operator ?? ">=") : undefined,
        value: needsComp ? (value.value ?? "0") : undefined,
      });
    },
    [value, schema.properties, onChange],
  );

  const handleOperatorChange = useCallback(
    (operator: ComparisonOperator) => {
      onChange({ ...value, operator });
    },
    [value, onChange],
  );

  const handleValueChange = useCallback(
    (newValue: string) => {
      onChange({ ...value, value: newValue });
    },
    [value, onChange],
  );

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {/* Category */}
      <Select
        value={value.category}
        onValueChange={(v) => handleCategoryChange(v as ExpressionCategory)}
      >
        <SelectTrigger className="w-[100px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(EXPRESSION_SCHEMA).map(([key, cat]) => (
            <SelectItem key={key} value={key}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground text-xs">.</span>

      {/* Name (if required) */}
      {schema.requiresName && (
        <>
          <Select value={value.name} onValueChange={handleNameChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {availableNames.map((n) => (
                <SelectItem key={n.name} value={n.name}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-xs">.</span>
        </>
      )}

      {/* Property */}
      <Select value={value.property} onValueChange={handlePropertyChange}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {schema.properties.map((p) => (
            <SelectItem key={p.name} value={p.name}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Comparison (if not boolean) */}
      {needsComparison && (
        <>
          <Select
            value={value.operator}
            onValueChange={(v) => handleOperatorChange(v as ComparisonOperator)}
          >
            <SelectTrigger className="w-[60px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARISON_OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            value={value.value ?? ""}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-[70px] h-8 text-xs"
          />
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Helper to format expression as readable string
// -----------------------------------------------------------------------------

export function formatExpression(expr: Expression): string {
  const schema = EXPRESSION_SCHEMA[expr.category];
  const prop = schema.properties.find((p) => p.name === expr.property);

  let base = expr.category;
  if (schema.requiresName && expr.name) {
    base += `.${expr.name}`;
  }
  base += `.${expr.property}`;

  if (prop?.type === "boolean") {
    return base;
  }

  return `${base} ${expr.operator} ${expr.value}`;
}
