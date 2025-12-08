/**
 * WoW Spell School colors based on school mask bits.
 * SchoolMask is a bitmask where multiple schools can be combined.
 */

// Individual school bit values
export const SCHOOL_PHYSICAL = 0x01;
export const SCHOOL_HOLY = 0x02;
export const SCHOOL_FIRE = 0x04;
export const SCHOOL_NATURE = 0x08;
export const SCHOOL_FROST = 0x10;
export const SCHOOL_SHADOW = 0x20;
export const SCHOOL_ARCANE = 0x40;

// School colors (single schools)
export const SCHOOL_COLORS: Record<number, string> = {
  [SCHOOL_PHYSICAL]: "#ffff00", // Yellow (Physical)
  [SCHOOL_HOLY]: "#ffff99", // Light yellow (Holy)
  [SCHOOL_FIRE]: "#ff8000", // Orange (Fire)
  [SCHOOL_NATURE]: "#4dff4d", // Green (Nature)
  [SCHOOL_FROST]: "#80ffff", // Cyan (Frost)
  [SCHOOL_SHADOW]: "#9966ff", // Purple (Shadow)
  [SCHOOL_ARCANE]: "#ff80ff", // Pink (Arcane)
} as const;

// Common combined school colors
const COMBINED_SCHOOL_COLORS: Record<number, string> = {
  // Frostfire (Frost + Fire)
  [SCHOOL_FROST | SCHOOL_FIRE]: "#ff80cc",
  // Shadowfrost (Shadow + Frost)
  [SCHOOL_SHADOW | SCHOOL_FROST]: "#8080ff",
  // Spellfire (Arcane + Fire)
  [SCHOOL_ARCANE | SCHOOL_FIRE]: "#ff8080",
  // Shadowflame (Shadow + Fire)
  [SCHOOL_SHADOW | SCHOOL_FIRE]: "#cc6600",
  // Holystrike (Holy + Physical)
  [SCHOOL_HOLY | SCHOOL_PHYSICAL]: "#ffff66",
  // Chaos (all schools)
  [0x7f]: "#ff00ff",
} as const;

export type SpellSchool =
  | "Physical"
  | "Holy"
  | "Fire"
  | "Nature"
  | "Frost"
  | "Shadow"
  | "Arcane"
  | "Mixed";

export const SCHOOL_NAMES: Record<number, SpellSchool> = {
  [SCHOOL_PHYSICAL]: "Physical",
  [SCHOOL_HOLY]: "Holy",
  [SCHOOL_FIRE]: "Fire",
  [SCHOOL_NATURE]: "Nature",
  [SCHOOL_FROST]: "Frost",
  [SCHOOL_SHADOW]: "Shadow",
  [SCHOOL_ARCANE]: "Arcane",
} as const;

/**
 * Get the color for a spell school mask.
 * For combined schools, returns a blended color or predefined combo.
 */
export function getSpellSchoolColor(schoolMask: number): string {
  if (schoolMask === 0) {
    return "#ffffff"; // Default white for no school
  }

  // Check for exact combined school match first
  if (schoolMask in COMBINED_SCHOOL_COLORS) {
    return COMBINED_SCHOOL_COLORS[schoolMask];
  }

  // Check for single school
  if (schoolMask in SCHOOL_COLORS) {
    return SCHOOL_COLORS[schoolMask];
  }

  // For other combinations, find the highest priority school
  // Priority: Arcane > Shadow > Frost > Nature > Fire > Holy > Physical
  const priority = [
    SCHOOL_ARCANE,
    SCHOOL_SHADOW,
    SCHOOL_FROST,
    SCHOOL_NATURE,
    SCHOOL_FIRE,
    SCHOOL_HOLY,
    SCHOOL_PHYSICAL,
  ];

  for (const school of priority) {
    if (schoolMask & school) {
      return SCHOOL_COLORS[school];
    }
  }

  return "#ffffff";
}

/**
 * Get the name of a spell school from its mask.
 */
export function getSpellSchoolName(schoolMask: number): SpellSchool {
  if (schoolMask === 0) {
    return "Physical";
  }

  // Count set bits
  let bitCount = 0;
  let temp = schoolMask;
  while (temp) {
    bitCount += temp & 1;
    temp >>= 1;
  }

  if (bitCount > 1) {
    return "Mixed";
  }

  return SCHOOL_NAMES[schoolMask] ?? "Physical";
}
