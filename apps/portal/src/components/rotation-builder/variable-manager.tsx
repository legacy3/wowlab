"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  VariableIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { generateVariableId } from "@/lib/id";

import type { Variable } from "./types";
import { useVariableValidation, useEditingState } from "./hooks";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface VariableManagerProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

// -----------------------------------------------------------------------------
// Variable Item Component
// -----------------------------------------------------------------------------

interface VariableItemProps {
  variable: Variable;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: { name: string; expression: string }) => void;
  onDelete: () => void;
  existingNames: string[];
}

function VariableItem({
  variable,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  existingNames,
}: VariableItemProps) {
  const [editName, setEditName] = useState(variable.name);
  const [editExpression, setEditExpression] = useState(variable.expression);
  const [nameError, setNameError] = useState<string | null>(null);

  const { validate } = useVariableValidation({
    existingNames,
    currentName: variable.name,
  });

  const handleStartEdit = useCallback(() => {
    setEditName(variable.name);
    setEditExpression(variable.expression);
    setNameError(null);
    onStartEdit();
  }, [variable.name, variable.expression, onStartEdit]);

  const handleSave = useCallback(() => {
    const error = validate(editName, editExpression);
    if (error) {
      setNameError(error);
      return;
    }

    onSave({ name: editName.trim(), expression: editExpression.trim() });
    setNameError(null);
  }, [editName, editExpression, validate, onSave]);

  const handleCancel = useCallback(() => {
    setEditName(variable.name);
    setEditExpression(variable.expression);
    setNameError(null);
    onCancelEdit();
  }, [variable.name, variable.expression, onCancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  if (isEditing) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <div className="space-y-1.5">
            <Label htmlFor={`name-${variable.id}`} className="text-xs">
              Name
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground font-mono text-sm">$</span>
              <Input
                id={`name-${variable.id}`}
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setNameError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="burst_phase"
                className={cn(
                  "h-8 font-mono text-sm",
                  nameError && "border-destructive"
                )}
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`expr-${variable.id}`} className="text-xs">
              Expression
            </Label>
            <Input
              id={`expr-${variable.id}`}
              value={editExpression}
              onChange={(e) => setEditExpression(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="aura.bloodlust.up"
              className="h-8 font-mono text-sm"
            />
          </div>
        </div>

        {nameError && (
          <p className="text-xs text-destructive">{nameError}</p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-7"
          >
            <XIcon className="size-3.5 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7">
            <CheckIcon className="size-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/30">
      <VariableIcon className="size-4 text-muted-foreground shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <Badge variant="secondary" className="font-mono text-xs shrink-0">
            ${variable.name}
          </Badge>
          <span className="text-muted-foreground text-sm">=</span>
          <code className="text-sm font-mono text-foreground/80 truncate">
            {variable.expression}
          </code>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleStartEdit}
          title="Edit variable"
        >
          <PencilIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Delete variable"
        >
          <TrashIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Add Variable Form Component
// -----------------------------------------------------------------------------

interface AddVariableFormProps {
  onAdd: (variable: Omit<Variable, "id">) => void;
  onCancel: () => void;
  existingNames: string[];
}

function AddVariableForm({
  onAdd,
  onCancel,
  existingNames,
}: AddVariableFormProps) {
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const { validate } = useVariableValidation({ existingNames });

  const handleSubmit = useCallback(() => {
    const error = validate(name, expression);
    if (error) {
      setNameError(error);
      return;
    }

    onAdd({ name: name.trim(), expression: expression.trim() });
    setName("");
    setExpression("");
    setNameError(null);
  }, [name, expression, validate, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <div className="space-y-1.5">
          <Label htmlFor="new-var-name" className="text-xs">
            Name
          </Label>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-mono text-sm">$</span>
            <Input
              id="new-var-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="burst_phase"
              className={cn(
                "h-8 font-mono text-sm",
                nameError && "border-destructive"
              )}
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-var-expr" className="text-xs">
            Expression
          </Label>
          <Input
            id="new-var-expr"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="aura.bloodlust.up"
            className="h-8 font-mono text-sm"
          />
        </div>
      </div>

      {nameError && <p className="text-xs text-destructive">{nameError}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7"
        >
          <XIcon className="size-3.5 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} className="h-7">
          <CheckIcon className="size-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function VariableManager({ variables, onChange }: VariableManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const existingNames = variables.map((v) => v.name);

  const handleAdd = useCallback(
    (newVar: Omit<Variable, "id">) => {
      const variable: Variable = {
        ...newVar,
        id: generateVariableId(),
      };
      onChange([...variables, variable]);
      setIsAdding(false);
    },
    [variables, onChange]
  );

  const handleUpdate = useCallback(
    (id: string, updates: { name: string; expression: string }) => {
      onChange(
        variables.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        )
      );
      setEditingId(null);
    },
    [variables, onChange]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(variables.filter((v) => v.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    },
    [variables, onChange, editingId]
  );

  const handleStartAdd = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
  }, []);

  const handleStartEdit = useCallback((id: string) => {
    setEditingId(id);
    setIsAdding(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VariableIcon className="size-5" />
          Variables
        </CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartAdd}
            disabled={isAdding}
          >
            <PlusIcon className="size-3.5 mr-1" />
            Add Variable
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        {variables.length === 0 && !isAdding && (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg bg-muted/10">
            <p>No variables defined.</p>
            <p className="text-xs mt-1">
              Variables let you reuse expressions like{" "}
              <code className="bg-muted px-1 py-0.5 rounded">$burst_phase</code>
            </p>
          </div>
        )}

        {variables.map((variable) => (
          <VariableItem
            key={variable.id}
            variable={variable}
            isEditing={editingId === variable.id}
            onStartEdit={() => handleStartEdit(variable.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={(updates) => handleUpdate(variable.id, updates)}
            onDelete={() => handleDelete(variable.id)}
            existingNames={existingNames}
          />
        ))}

        {isAdding && (
          <AddVariableForm
            onAdd={handleAdd}
            onCancel={() => setIsAdding(false)}
            existingNames={existingNames}
          />
        )}

        {variables.length > 0 && (
          <div className="pt-2 border-t mt-4">
            <p className="text-xs text-muted-foreground">
              Use variables in expressions by referencing{" "}
              <Badge variant="outline" className="font-mono text-[10px] px-1">
                $name
              </Badge>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Re-exports
// -----------------------------------------------------------------------------

export type { Variable } from "./types";
