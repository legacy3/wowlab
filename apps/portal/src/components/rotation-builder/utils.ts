import { capitalCase, snakeCase, kebabCase } from "change-case";
import type { RuleGroupType } from "react-querybuilder";

// =============================================================================
// Name Conversion Utilities
// =============================================================================

/**
 * Converts a display label to an internal name.
 * Example: "Cooldowns" -> "cooldowns", "Single Target" -> "single_target"
 */
export function toInternalName(label: string): string {
  return snakeCase(label);
}

/**
 * Converts an internal name to a display label.
 * Example: "cooldowns" -> "Cooldowns", "single_target" -> "Single Target"
 */
export function toDisplayLabel(name: string): string {
  return capitalCase(name);
}

// =============================================================================
// Spell Utilities
// =============================================================================

/**
 * Returns a human-readable label for a spell name.
 */
export function getSpellLabel(
  spellName: string,
  spells: ReadonlyArray<{ name: string; label: string }>,
): string {
  const spell = spells.find((s) => s.name === spellName);
  return spell?.label ?? toDisplayLabel(spellName);
}

// =============================================================================
// Condition Utilities
// =============================================================================

/**
 * Generates a brief summary of conditions for collapsed view.
 */
export function getConditionSummary(conditions: RuleGroupType): string {
  if (!conditions.rules.length) {
    return "Always";
  }

  const summaryParts: string[] = [];
  for (const rule of conditions.rules.slice(0, 2)) {
    if ("field" in rule) {
      const field = String(rule.field).replace(/_/g, " ");
      summaryParts.push(`${field} ${rule.operator} ${rule.value}`);
    } else if ("rules" in rule) {
      // Nested group
      const nestedCount = rule.rules.length;
      summaryParts.push(`(${nestedCount} nested)`);
    }
  }

  const remaining = conditions.rules.length - summaryParts.length;
  if (remaining > 0) {
    summaryParts.push(`+${remaining} more`);
  }

  return summaryParts.join(` ${conditions.combinator.toUpperCase()} `);
}

/**
 * Formats conditions for DSL output.
 */
export function formatConditionForDSL(conditions: RuleGroupType): string {
  if (!conditions.rules.length) {
    return "";
  }

  const parts: string[] = [];
  for (const rule of conditions.rules) {
    if ("field" in rule) {
      parts.push(`${rule.field}${rule.operator}${rule.value}`);
    } else if ("rules" in rule) {
      const nested = formatConditionForDSL(rule);
      if (nested) {
        parts.push(`(${nested})`);
      }
    }
  }

  const combinator = conditions.combinator === "and" ? "&" : "|";
  return parts.join(combinator);
}

// =============================================================================
// Export Utilities
// =============================================================================

/**
 * Generates a safe filename from a rotation name.
 */
export function toFilename(name: string): string {
  return kebabCase(name);
}
