import { capitalCase, snakeCase, kebabCase } from "change-case";
import type { RuleGroupType, RuleType } from "react-querybuilder";

import { getSpellById } from "./data";
import type { RotationDraft, Variable } from "./types";

// =============================================================================
// Name Conversion
// =============================================================================

export function toInternalName(label: string): string {
  return snakeCase(label);
}

export function toDisplayLabel(name: string): string {
  return capitalCase(name);
}

// =============================================================================
// Condition Utilities
// =============================================================================

function isRuleType(rule: RuleType | RuleGroupType): rule is RuleType {
  return "field" in rule && "operator" in rule;
}

export function getConditionSummary(condition: RuleGroupType): string {
  if (!condition.rules.length) return "Always";

  const parts: string[] = [];
  for (const rule of condition.rules.slice(0, 2)) {
    if ("field" in rule && rule.field) {
      const field = String(rule.field).replace(/_/g, " ");
      const op = rule.operator ?? "=";
      const val = rule.value ?? "";
      if (rule.field === "variable") {
        parts.push(`$${val}`);
      } else {
        parts.push(`${field} ${op} ${val}`);
      }
    } else if ("rules" in rule) {
      const nestedCount = rule.rules.length;
      if (nestedCount > 0) {
        parts.push(`(${nestedCount} nested)`);
      }
    }
  }

  const validParts = parts.filter((p) => p.trim());
  if (validParts.length === 0) return "Always";

  const remaining = condition.rules.length - 2;
  if (remaining > 0) {
    validParts.push(`+${remaining} more`);
  }

  return validParts.join(` ${condition.combinator.toUpperCase()} `);
}

// =============================================================================
// DSL Generation
// =============================================================================

function formatRuleForDSL(rule: RuleType | RuleGroupType): string {
  if (isRuleType(rule)) {
    const { field, operator, value } = rule;
    const fieldName = String(field).replace(/_/g, ".");
    return `${fieldName}${operator}${value}`;
  }

  const group = rule as RuleGroupType;
  if (!group.rules || group.rules.length === 0) return "";

  const parts = group.rules.map(formatRuleForDSL).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const separator = group.combinator === "and" ? "&" : "|";
  return `(${parts.join(separator)})`;
}

export function formatConditionForDSL(condition: RuleGroupType): string {
  if (!condition.rules || condition.rules.length === 0) return "";

  const parts = condition.rules.map(formatRuleForDSL).filter(Boolean);
  if (parts.length === 0) return "";

  const separator = condition.combinator === "and" ? "&" : "|";
  return parts.join(separator);
}

export function generateDSL(draft: RotationDraft, specName: string): string {
  const lines: string[] = [];
  lines.push(`# ${specName} Rotation`);
  lines.push("");

  if (draft.variables.length > 0) {
    lines.push("variables:");
    for (const v of draft.variables) {
      lines.push(`  $${v.name} = ${v.expression}`);
    }
    lines.push("");
  }

  for (const list of draft.lists) {
    lines.push(`actions.${list.name}:`);
    for (const action of list.actions) {
      if (!action.enabled) continue;
      let spell: string;
      if (action.type === "call_action_list") {
        const targetList = draft.lists.find((l) => l.id === action.listId);
        spell = `call_action_list,name=${targetList?.name ?? action.listId}`;
      } else {
        const spellData = action.spellId
          ? getSpellById(action.spellId)
          : undefined;
        spell = spellData?.name ?? `spell_${action.spellId}`;
      }
      const cond = formatConditionForDSL(action.condition);
      lines.push(cond ? `  ${spell},if=${cond}` : `  ${spell}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

// =============================================================================
// Natural Language Generation
// =============================================================================

function formatRuleForNatural(rule: RuleType | RuleGroupType): string {
  if (isRuleType(rule)) {
    const { field, operator, value } = rule;
    const fieldName = String(field).replace(/_/g, " ");

    const opMap: Record<string, string> = {
      "=": "equals",
      "!=": "does not equal",
      ">": "is greater than",
      ">=": "is at least",
      "<": "is less than",
      "<=": "is at most",
    };

    const opText = opMap[String(operator)] || String(operator);
    return `${fieldName} ${opText} ${value}`;
  }

  const group = rule as RuleGroupType;
  if (!group.rules || group.rules.length === 0) return "";

  const parts = group.rules.map(formatRuleForNatural).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const separator = group.combinator === "and" ? " AND " : " OR ";
  return parts.join(separator);
}

export function formatConditionsForNatural(conditions: RuleGroupType): string {
  if (!conditions.rules || conditions.rules.length === 0) return "";

  const parts = conditions.rules.map(formatRuleForNatural).filter(Boolean);
  if (parts.length === 0) return "";

  const separator = conditions.combinator === "and" ? " AND " : " OR ";
  return parts.join(separator);
}

export function generateNatural(
  draft: RotationDraft,
  specName: string,
): string {
  const lines: string[] = [];
  lines.push(specName + " Rotation");
  lines.push("");

  if (draft.variables.length > 0) {
    lines.push("Variables:");
    for (const variable of draft.variables) {
      lines.push(`  - ${variable.name}: ${variable.expression}`);
    }
    lines.push("");
  }

  for (const list of draft.lists) {
    const isDefault = list.id === draft.defaultListId;
    const title = isDefault ? `${list.label} (default):` : `${list.label}:`;
    lines.push(title);

    let priority = 1;
    for (const action of list.actions) {
      if (!action.enabled) continue;

      let spellName: string;
      if (action.type === "call_action_list") {
        const targetList = draft.lists.find((l) => l.id === action.listId);
        spellName = `Call ${targetList?.label ?? "Unknown"}`;
      } else {
        const spellData = action.spellId
          ? getSpellById(action.spellId)
          : undefined;
        spellName = spellData?.label ?? `Spell #${action.spellId}`;
      }

      const conditionStr = formatConditionsForNatural(action.condition);
      if (conditionStr) {
        lines.push(`  ${priority}. ${spellName} - when ${conditionStr}`);
      } else {
        lines.push(`  ${priority}. ${spellName}`);
      }
      priority++;
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

export function generateJSON(draft: RotationDraft): string {
  return JSON.stringify(draft, null, 2);
}

// =============================================================================
// ID Generation (re-export from @/lib/id)
// =============================================================================

export {
  generateId,
  generateActionId,
  generateListId,
  generateVariableId,
} from "@/lib/id";

// =============================================================================
// Export Utilities
// =============================================================================

export function toFilename(name: string): string {
  return kebabCase(name);
}
