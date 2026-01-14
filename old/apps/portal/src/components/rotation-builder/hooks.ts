"use client";

import { useCallback, useState } from "react";
import { toInternalName } from "./utils";

// Re-export from shared location
export {
  useVariableValidation,
  isValidVariableName,
  type UseVariableValidationOptions,
  type UseVariableValidationResult,
} from "@/hooks/rotations/use-variable-validation";

// -----------------------------------------------------------------------------
// Action List Name Validation Hook
// -----------------------------------------------------------------------------

export interface UseListNameValidationOptions {
  /** List of existing list names (for duplicate checking) */
  existingNames: string[];
}

export interface UseListNameValidationResult {
  /** Converts display label to internal name */
  toInternalName: (label: string) => string;
  /** Checks if name already exists */
  isDuplicate: (name: string) => boolean;
}

/**
 * Hook for validating action list names.
 */
export function useListNameValidation({
  existingNames,
}: UseListNameValidationOptions): UseListNameValidationResult {
  const isDuplicate = useCallback(
    (name: string) => {
      return existingNames.includes(name.toLowerCase());
    },
    [existingNames],
  );

  return { toInternalName, isDuplicate };
}

// -----------------------------------------------------------------------------
// Collapsible State Hook
// -----------------------------------------------------------------------------

export interface UseCollapsibleOptions {
  /** Initial expanded state */
  defaultExpanded?: boolean;
}

export interface UseCollapsibleResult {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  toggle: () => void;
}

/**
 * Hook for managing collapsible panel state.
 */
export function useCollapsible({
  defaultExpanded = false,
}: UseCollapsibleOptions = {}): UseCollapsibleResult {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return { isExpanded, setIsExpanded, toggle };
}

// -----------------------------------------------------------------------------
// Editing State Hook
// -----------------------------------------------------------------------------

export interface UseEditingStateResult<T = string> {
  editingId: T | null;
  startEdit: (id: T) => void;
  stopEdit: () => void;
  isEditing: (id: T) => boolean;
}

/**
 * Hook for managing which item is currently being edited.
 * Useful for lists where only one item can be edited at a time.
 */
export function useEditingState<T = string>(): UseEditingStateResult<T> {
  const [editingId, setEditingId] = useState<T | null>(null);

  const startEdit = useCallback((id: T) => {
    setEditingId(id);
  }, []);

  const stopEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const isEditing = useCallback((id: T) => editingId === id, [editingId]);

  return { editingId, startEdit, stopEdit, isEditing };
}
