"use client";

import { useCallback, useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Variable Validation Hook
// -----------------------------------------------------------------------------

/**
 * Validates a variable name.
 * Must start with letter or underscore, only alphanumeric and underscores allowed.
 */
export function isValidVariableName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

export interface UseVariableValidationOptions {
  /** List of existing variable names (for duplicate checking) */
  existingNames: string[];
  /** Current name being edited (excluded from duplicate check) */
  currentName?: string;
}

export interface UseVariableValidationResult {
  /** Validates name and expression, returns error message or null */
  validate: (name: string, expression: string) => string | null;
  /** Just validates the name format */
  isValidName: (name: string) => boolean;
  /** Checks if name already exists */
  isDuplicate: (name: string) => boolean;
}

/**
 * Hook for validating variable names and expressions.
 * Follows react-querybuilder pattern of extracting validation logic.
 */
export function useVariableValidation({
  existingNames,
  currentName,
}: UseVariableValidationOptions): UseVariableValidationResult {
  const isDuplicate = useCallback(
    (name: string) => {
      const trimmed = name.trim().toLowerCase();
      return existingNames.some(
        (n) =>
          n.toLowerCase() === trimmed &&
          (!currentName || n.toLowerCase() !== currentName.toLowerCase()),
      );
    },
    [existingNames, currentName],
  );

  const isValidName = useCallback((name: string) => {
    return isValidVariableName(name.trim());
  }, []);

  const validate = useCallback(
    (name: string, expression: string): string | null => {
      const trimmedName = name.trim();
      const trimmedExpression = expression.trim();

      if (!trimmedName) {
        return "Name is required";
      }

      if (!isValidVariableName(trimmedName)) {
        return "Invalid name (use letters, numbers, underscores)";
      }

      if (isDuplicate(trimmedName)) {
        return "Name already exists";
      }

      if (!trimmedExpression) {
        return "Expression is required";
      }

      return null;
    },
    [isDuplicate],
  );

  return { validate, isValidName, isDuplicate };
}

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
  const toInternalName = useCallback((label: string): string => {
    return label.toLowerCase().replace(/\s+/g, "_");
  }, []);

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
