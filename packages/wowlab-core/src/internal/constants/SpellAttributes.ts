/**
 * Spell Attribute Constants
 *
 * These are the attribute indices used in DBC spell_misc.Attributes_0 through Attributes_15.
 * To test an attribute: (Attributes_[column] & (1 << (bit % 32))) !== 0
 * where column = Math.floor(attributeIndex / 32) and bit = attributeIndex % 32
 *
 * Reference: docs/aura-system/02-reference-spell-data.md
 */

/** Pandemic refresh - aura duration extends on refresh (Attributes_13 bit 20) */
export const SX_REFRESH_EXTENDS_DURATION = 436;

/** Rolling periodic - damage rolls over on refresh (Attributes_10 bit 14) */
export const SX_ROLLING_PERIODIC = 334;

/** Duration hasted - aura duration scales with haste (Attributes_8 bit 17) */
export const SX_DURATION_HASTED = 273;

/** Tick on application - first tick fires immediately (Attributes_5 bit 9) */
export const SX_TICK_ON_APPLICATION = 169;

/** DoT hasted - tick period scales with haste (Attributes_5 bit 13) */
export const SX_DOT_HASTED = 173;

/** DoT hasted by melee haste (Attributes_8 bit 22) */
export const SX_DOT_HASTED_MELEE = 278;

/** Tick may crit - periodic ticks can critically strike (Attributes_8 bit 9) */
export const SX_TICK_MAY_CRIT = 265;

/** Treat as periodic - spell is treated as periodic for effects (Attributes_3 bit 25) */
export const SX_TREAT_AS_PERIODIC = 121;

/**
 * Check if a spell has a specific attribute.
 *
 * @param attributes - Array of 16 attribute bitmasks from spell_misc
 * @param attributeIndex - The attribute index to check (e.g., SX_DURATION_HASTED)
 * @returns true if the attribute is set
 */
export const hasSpellAttribute = (
  attributes: readonly number[],
  attributeIndex: number,
): boolean => {
  const column = Math.floor(attributeIndex / 32);
  const bit = attributeIndex % 32;
  const mask = 1 << bit;

  if (column < 0 || column >= attributes.length) {
    return false;
  }

  return (attributes[column] & mask) !== 0;
};
