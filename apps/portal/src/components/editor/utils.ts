import type { ActionList, RotationData, Variable } from "@/lib/engine";

export interface ValidationError {
  message: string;
  path: string;
  type: "error" | "warning";
}

export interface ValidationResult {
  errors: ValidationError[];
  isValid: boolean;
  warnings: ValidationError[];
}

export function countEnabledActions(lists: ActionList[]): number {
  return lists.reduce(
    (sum, list) => sum + list.actions.filter((a) => a.enabled).length,
    0,
  );
}

export function countTotalActions(lists: ActionList[]): number {
  return lists.reduce((sum, list) => sum + list.actions.length, 0);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateRotation(
  name: string,
  data: RotationData,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate name
  if (!name.trim()) {
    errors.push({
      message: "Rotation name is required",
      path: "name",
      type: "error",
    });
  }

  // Validate lists exist
  if (data.lists.length === 0) {
    errors.push({
      message: "At least one action list is required",
      path: "lists",
      type: "error",
    });
  }

  // Validate default list exists
  const defaultExists = data.lists.some((l) => l.id === data.defaultListId);
  if (!defaultExists && data.lists.length > 0) {
    errors.push({
      message: "Default list does not exist",
      path: "defaultListId",
      type: "error",
    });
  }

  // Validate each list
  for (const list of data.lists) {
    const listErrors = validateList(list, data.lists);
    errors.push(...listErrors.filter((e) => e.type === "error"));
    warnings.push(...listErrors.filter((e) => e.type === "warning"));
  }

  // Validate variables
  for (const variable of data.variables) {
    const variableErrors = validateVariable(variable);
    errors.push(...variableErrors.filter((e) => e.type === "error"));
    warnings.push(...variableErrors.filter((e) => e.type === "warning"));
  }

  // Check for circular references
  const circularErrors = detectCircularReferences(data.lists);
  errors.push(...circularErrors);

  return {
    errors,
    isValid: errors.length === 0,
    warnings,
  };
}

function detectCircularReferences(lists: ActionList[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Build adjacency list
  const graph = new Map<string, string[]>();
  for (const list of lists) {
    const targets: string[] = [];
    for (const action of list.actions) {
      if (action.type === "call_action_list" && action.listId) {
        targets.push(action.listId);
      }
    }
    graph.set(list.id, targets);
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart);
      const listNames = cycle
        .map((id) => lists.find((l) => l.id === id)?.label ?? id)
        .join(" -> ");
      errors.push({
        message: `Circular reference detected: ${listNames} -> ${lists.find((l) => l.id === nodeId)?.label ?? nodeId}`,
        path: `lists.${nodeId}`,
        type: "error",
      });
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor, [...path, nodeId])) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const list of lists) {
    if (!visited.has(list.id)) {
      hasCycle(list.id, []);
    }
  }

  return errors;
}

function validateList(
  list: ActionList,
  allLists: ActionList[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!list.label.trim()) {
    errors.push({
      message: `List "${list.name}" has no label`,
      path: `lists.${list.id}.label`,
      type: "error",
    });
  }

  if (!list.name.trim()) {
    errors.push({
      message: "List name is required",
      path: `lists.${list.id}.name`,
      type: "error",
    });
  }

  // Validate each action
  for (const action of list.actions) {
    if (action.type === "spell" && !action.spellId) {
      errors.push({
        message: "Spell action has no spell selected",
        path: `lists.${list.id}.actions.${action.id}`,
        type: "warning",
      });
    }

    if (action.type === "item" && !action.itemId) {
      errors.push({
        message: "Item action has no item selected",
        path: `lists.${list.id}.actions.${action.id}`,
        type: "warning",
      });
    }

    if (action.type === "call_action_list") {
      if (!action.listId) {
        errors.push({
          message: "Call action has no target list selected",
          path: `lists.${list.id}.actions.${action.id}`,
          type: "warning",
        });
      } else {
        const targetExists = allLists.some((l) => l.id === action.listId);
        if (!targetExists) {
          errors.push({
            message: "Call action references non-existent list",
            path: `lists.${list.id}.actions.${action.id}`,
            type: "error",
          });
        }
      }
    }
  }

  return errors;
}

function validateVariable(variable: Variable): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!variable.name.trim()) {
    errors.push({
      message: "Variable name is required",
      path: `variables.${variable.id}.name`,
      type: "error",
    });
  }

  // Check for valid variable name format (snake_case, starts with letter)
  if (variable.name && !/^[a-z][a-z0-9_]*$/.test(variable.name)) {
    errors.push({
      message:
        "Variable name should be snake_case (lowercase with underscores)",
      path: `variables.${variable.id}.name`,
      type: "warning",
    });
  }

  if (!variable.expression.trim()) {
    errors.push({
      message: `Variable "${variable.name}" has no expression`,
      path: `variables.${variable.id}.expression`,
      type: "warning",
    });
  }

  return errors;
}
