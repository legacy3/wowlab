"use client";

import { memo } from "react";
import { Plus, Trash2, Variable, Hash, ToggleLeft, Type } from "lucide-react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { VariableDefinition, VariableType } from "./types";

const VARIABLE_TYPES: {
  value: VariableType;
  label: string;
  icon: typeof Hash;
  defaultValue: number | boolean | string;
}[] = [
  { value: "number", label: "Number", icon: Hash, defaultValue: 0 },
  { value: "boolean", label: "Boolean", icon: ToggleLeft, defaultValue: false },
  { value: "string", label: "String", icon: Type, defaultValue: "" },
];

/** Generate a simple unique ID */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

interface VariableRowProps {
  variable: VariableDefinition;
  onChange: (variable: VariableDefinition) => void;
  onRemove: () => void;
}

const VariableRow = memo(function VariableRow({
  variable,
  onChange,
  onRemove,
}: VariableRowProps) {
  const typeDef = VARIABLE_TYPES.find((t) => t.value === variable.type);
  const TypeIcon = typeDef?.icon || Variable;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card group">
      {/* Type indicator */}
      <div
        className={cn(
          "size-8 rounded flex items-center justify-center shrink-0 mt-0.5",
          variable.type === "number" && "bg-blue-500/10 text-blue-500",
          variable.type === "boolean" && "bg-amber-500/10 text-amber-500",
          variable.type === "string" && "bg-green-500/10 text-green-500",
        )}
      >
        <TypeIcon className="size-4" />
      </div>

      {/* Variable details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          {/* Name input */}
          <Input
            className="h-7 text-sm font-mono flex-1"
            value={variable.name}
            onChange={(e) =>
              onChange({
                ...variable,
                name: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
              })
            }
            placeholder="variable_name"
          />

          {/* Type selector */}
          <Select
            value={variable.type}
            onValueChange={(type: VariableType) => {
              const newDefault =
                VARIABLE_TYPES.find((t) => t.value === type)?.defaultValue ?? 0;
              onChange({
                ...variable,
                type,
                defaultValue: newDefault,
              });
            }}
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VARIABLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-1.5">
                    <type.icon className="size-3" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Default value */}
          <label className="text-xs text-muted-foreground shrink-0">
            Default:
          </label>
          {variable.type === "boolean" ? (
            <Select
              value={String(variable.defaultValue)}
              onValueChange={(v) =>
                onChange({ ...variable, defaultValue: v === "true" })
              }
            >
              <SelectTrigger className="w-20 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">true</SelectItem>
                <SelectItem value="false">false</SelectItem>
              </SelectContent>
            </Select>
          ) : variable.type === "number" ? (
            <Input
              type="number"
              className="w-24 h-6 text-xs font-mono"
              value={variable.defaultValue as number}
              onChange={(e) =>
                onChange({
                  ...variable,
                  defaultValue: parseFloat(e.target.value) || 0,
                })
              }
            />
          ) : (
            <Input
              className="flex-1 h-6 text-xs font-mono"
              value={variable.defaultValue as string}
              onChange={(e) =>
                onChange({ ...variable, defaultValue: e.target.value })
              }
              placeholder="default value"
            />
          )}
        </div>

        {/* Description */}
        <Input
          className="h-6 text-xs text-muted-foreground"
          value={variable.description || ""}
          onChange={(e) =>
            onChange({ ...variable, description: e.target.value || undefined })
          }
          placeholder="Optional description..."
        />
      </div>
    </div>
  );
});

interface VariablesPanelProps {
  variables: VariableDefinition[];
  onChange: (variables: VariableDefinition[]) => void;
}

export const VariablesPanel = memo(function VariablesPanel({
  variables,
  onChange,
}: VariablesPanelProps) {
  const addVariable = () => {
    const newVar: VariableDefinition = {
      id: generateId(),
      name: `var_${variables.length + 1}`,
      type: "number",
      defaultValue: 0,
    };
    onChange([...variables, newVar]);
  };

  const updateVariable = (index: number, updated: VariableDefinition) => {
    const newVars = [...variables];
    newVars[index] = updated;
    onChange(newVars);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  return (
    <Accordion type="single" collapsible defaultValue="variables">
      <AccordionItem value="variables" className="border-none">
        <AccordionTrigger className="py-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <Variable className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Variables</span>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {variables.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-2">
            {variables.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <Variable className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No variables defined
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Variables let you store and reuse values in your rotation
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={addVariable}
                >
                  <Plus className="size-3 mr-1" />
                  Add Variable
                </Button>
              </div>
            ) : (
              <>
                {variables.map((variable, index) => (
                  <VariableRow
                    key={variable.id}
                    variable={variable}
                    onChange={(updated) => updateVariable(index, updated)}
                    onRemove={() => removeVariable(index)}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={addVariable}
                >
                  <Plus className="size-3 mr-1" />
                  Add Variable
                </Button>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

/** Compact inline view for variables - used in the main editor header */
export const VariablesCompact = memo(function VariablesCompact({
  variables,
}: {
  variables: VariableDefinition[];
}) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {variables.map((variable) => {
        const typeDef = VARIABLE_TYPES.find((t) => t.value === variable.type);
        const TypeIcon = typeDef?.icon || Variable;

        return (
          <Badge
            key={variable.id}
            variant="outline"
            className="gap-1 font-mono text-[10px] py-0"
          >
            <TypeIcon className="size-2.5" />
            {variable.name}
            <span className="text-muted-foreground">
              = {String(variable.defaultValue)}
            </span>
          </Badge>
        );
      })}
    </div>
  );
});
