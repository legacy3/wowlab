/**
 * Static options data for the rotation editor.
 * Curated spell lists per spec with real DBC spell IDs.
 */

import type { AllowedSpell } from "./spell-picker";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Creates an option with name=value (standard for react-querybuilder) */
export function createOption<T extends string>(name: T, label: string) {
  return { name, value: name, label } as const;
}

/** Creates an entry with just name and label (for UI dropdowns) */
function createEntry<T extends string>(name: T, label: string) {
  return { name, label } as const;
}

/** Creates a spell entry with ID for the spell picker */
function createSpell(id: number, name: string): AllowedSpell {
  return { id, name };
}

// -----------------------------------------------------------------------------
// BM Hunter Allowed Spells (curated list with real spell IDs)
// -----------------------------------------------------------------------------

/** BM Hunter spells available in rotation editor (curated with correct IDs) */
export const BM_HUNTER_ALLOWED_SPELLS: ReadonlyArray<AllowedSpell> = [
  createSpell(34026, "Kill Command"),
  createSpell(19574, "Bestial Wrath"),
  createSpell(217200, "Barbed Shot"),
  createSpell(193455, "Cobra Shot"),
  createSpell(359844, "Call of the Wild"),
  createSpell(53351, "Kill Shot"),
  createSpell(120679, "Dire Beast"),
  createSpell(321530, "Bloodshed"),
  createSpell(2643, "Multi-Shot"),
  createSpell(193530, "Aspect of the Wild"),
  createSpell(131894, "A Murder of Crows"),
  createSpell(120360, "Barrage"),
  createSpell(109248, "Binding Shot"),
  createSpell(199483, "Camouflage"),
  createSpell(109304, "Exhilaration"),
  createSpell(187650, "Freezing Trap"),
  createSpell(5116, "Concussive Shot"),
  createSpell(781, "Disengage"),
  createSpell(186257, "Aspect of the Cheetah"),
  createSpell(264667, "Primal Rage"),
];

// -----------------------------------------------------------------------------
// BM Hunter Spells (for condition builder dropdowns - string-based)
// -----------------------------------------------------------------------------

/** BM Hunter spells for condition builder options */
const BM_HUNTER_SPELLS = [
  createEntry("kill_command", "Kill Command"),
  createEntry("bestial_wrath", "Bestial Wrath"),
  createEntry("barbed_shot", "Barbed Shot"),
  createEntry("cobra_shot", "Cobra Shot"),
  createEntry("call_of_the_wild", "Call of the Wild"),
  createEntry("kill_shot", "Kill Shot"),
  createEntry("dire_beast", "Dire Beast"),
  createEntry("bloodshed", "Bloodshed"),
  createEntry("multi_shot", "Multi-Shot"),
  createEntry("aspect_of_the_wild", "Aspect of the Wild"),
] as const;

/** Spells as react-querybuilder options */
export const BM_HUNTER_SPELL_OPTIONS = BM_HUNTER_SPELLS.map((s) =>
  createOption(s.name, s.label),
);

// -----------------------------------------------------------------------------
// BM Hunter Auras
// -----------------------------------------------------------------------------

/** Canonical list of BM Hunter auras/buffs */
const BM_HUNTER_AURAS = [
  createEntry("bestial_wrath", "Bestial Wrath"),
  createEntry("frenzy", "Frenzy"),
  createEntry("beast_cleave", "Beast Cleave"),
  createEntry("call_of_the_wild", "Call of the Wild"),
  createEntry("bloodshed", "Bloodshed"),
] as const;

/** Auras as react-querybuilder options */
export const BM_HUNTER_AURA_OPTIONS = BM_HUNTER_AURAS.map((a) =>
  createOption(a.name, a.label),
);

// -----------------------------------------------------------------------------
// BM Hunter Talents
// -----------------------------------------------------------------------------

/** Canonical list of BM Hunter talents */
const BM_HUNTER_TALENTS = [
  createEntry("killer_instinct", "Killer Instinct"),
  createEntry("animal_companion", "Animal Companion"),
  createEntry("dire_beast", "Dire Beast"),
  createEntry("scent_of_blood", "Scent of Blood"),
  createEntry("wild_call", "Wild Call"),
] as const;

/** Talents as react-querybuilder options */
export const BM_HUNTER_TALENT_OPTIONS = BM_HUNTER_TALENTS.map((t) =>
  createOption(t.name, t.label),
);
