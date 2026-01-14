import type { RuleGroupType } from "react-querybuilder";

// Re-export shared utilities from rotation-editor
export {
  toInternalName,
  toDisplayLabel,
  toFilename,
  getConditionSummary,
  formatConditionForDSL,
} from "../rotation-editor/utils";

// Import for local use
import { toDisplayLabel } from "../rotation-editor/utils";

// =============================================================================
// Spell Utilities (rotation-builder specific - uses string spell names)
// =============================================================================

/**
 * Returns a human-readable label for a spell name.
 * This is specific to rotation-builder which uses string-based spell references.
 */
export function getSpellLabel(
  spellName: string,
  spells: ReadonlyArray<{ name: string; label: string }>,
): string {
  const spell = spells.find((s) => s.name === spellName);
  return spell?.label ?? toDisplayLabel(spellName);
}
