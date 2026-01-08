"use client";

import { useCallback } from "react";

// -----------------------------------------------------------------------------
// Variable Validation
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
