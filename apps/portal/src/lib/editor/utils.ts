import type { RuleGroupType } from "react-querybuilder";

import { CONDITION_FIELDS, type ConditionField } from "./constants";

export const createEmptyCondition = (): RuleGroupType => ({
  combinator: "and",
  rules: [],
});

export const generateId = (): string => crypto.randomUUID();

export function getFieldsByCategory(): Map<string, ConditionField[]> {
  const grouped = new Map<string, ConditionField[]>();

  for (const field of CONDITION_FIELDS) {
    const existing = grouped.get(field.category) || [];
    existing.push(field);
    grouped.set(field.category, existing);
  }

  return grouped;
}
