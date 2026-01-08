"use client";

import { useState, useEffect, useCallback } from "react";
import { TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Variable } from "./types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface VariableEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variable?: Variable | null;
  existingNames: string[];
  onSave: (data: { name: string; expression: string }) => void;
  onDelete?: () => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function VariableEditor({
  open,
  onOpenChange,
  variable,
  existingNames,
  onSave,
  onDelete,
}: VariableEditorProps) {
  const [name, setName] = useState("");
  const [expression, setExpression] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!variable;

  useEffect(() => {
    if (open) {
      setName(variable?.name ?? "");
      setExpression(variable?.expression ?? "");
      setError(null);
    }
  }, [open, variable]);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    const trimmedExpr = expression.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!trimmedExpr) {
      setError("Expression is required");
      return;
    }
    if (!/^[a-z_][a-z0-9_]*$/i.test(trimmedName)) {
      setError("Invalid name format");
      return;
    }
    const otherNames = existingNames.filter((n) => n !== variable?.name);
    if (otherNames.includes(trimmedName)) {
      setError("Name already exists");
      return;
    }

    onSave({ name: trimmedName, expression: trimmedExpr });
    onOpenChange(false);
  }, [name, expression, existingNames, variable, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Variable" : "New Variable"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-mono">
                $
              </span>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="variable_name"
                className="pl-7 font-mono"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Expression</label>
            <Input
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                setError(null);
              }}
              placeholder="aura.bloodlust.up | cooldown.bestial_wrath.remains < 3"
              className="font-mono"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isEditing && onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              <TrashIcon className="size-4 mr-1.5" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Save" : "Add"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
