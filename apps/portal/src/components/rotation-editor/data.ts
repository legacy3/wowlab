/**
 * Shared WoW game data for the rotation editor.
 * TODO: This data should eventually come from the DBC database.
 */

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Creates an option with name=value (standard for react-querybuilder) */
export function createOption<T extends string>(name: T, label: string) {
  return { name, value: name, label } as const;
}

/** Creates a spell with just name and label (for UI dropdowns) */
export function createSpell<T extends string>(name: T, label: string) {
  return { name, label } as const;
}

// -----------------------------------------------------------------------------
// BM Hunter Spells
// -----------------------------------------------------------------------------

/** Canonical list of BM Hunter spells */
export const BM_HUNTER_SPELLS = [
  createSpell("kill_command", "Kill Command"),
  createSpell("bestial_wrath", "Bestial Wrath"),
  createSpell("barbed_shot", "Barbed Shot"),
  createSpell("cobra_shot", "Cobra Shot"),
  createSpell("call_of_the_wild", "Call of the Wild"),
  createSpell("kill_shot", "Kill Shot"),
  createSpell("dire_beast", "Dire Beast"),
  createSpell("bloodshed", "Bloodshed"),
  createSpell("multi_shot", "Multi-Shot"),
  createSpell("aspect_of_the_wild", "Aspect of the Wild"),
] as const;

/** Spells as react-querybuilder options */
export const BM_HUNTER_SPELL_OPTIONS = BM_HUNTER_SPELLS.map((s) =>
  createOption(s.name, s.label),
);

// -----------------------------------------------------------------------------
// BM Hunter Auras
// -----------------------------------------------------------------------------

/** Canonical list of BM Hunter auras/buffs */
export const BM_HUNTER_AURAS = [
  createSpell("bestial_wrath", "Bestial Wrath"),
  createSpell("frenzy", "Frenzy"),
  createSpell("beast_cleave", "Beast Cleave"),
  createSpell("call_of_the_wild", "Call of the Wild"),
  createSpell("bloodshed", "Bloodshed"),
] as const;

/** Auras as react-querybuilder options */
export const BM_HUNTER_AURA_OPTIONS = BM_HUNTER_AURAS.map((a) =>
  createOption(a.name, a.label),
);

// -----------------------------------------------------------------------------
// BM Hunter Talents
// -----------------------------------------------------------------------------

/** Canonical list of BM Hunter talents */
export const BM_HUNTER_TALENTS = [
  createSpell("killer_instinct", "Killer Instinct"),
  createSpell("animal_companion", "Animal Companion"),
  createSpell("dire_beast", "Dire Beast"),
  createSpell("scent_of_blood", "Scent of Blood"),
  createSpell("wild_call", "Wild Call"),
] as const;

/** Talents as react-querybuilder options */
export const BM_HUNTER_TALENT_OPTIONS = BM_HUNTER_TALENTS.map((t) =>
  createOption(t.name, t.label),
);

// -----------------------------------------------------------------------------
// Type exports
// -----------------------------------------------------------------------------

export type SpellInfo = { name: string; label: string };
export type SpellOption = { name: string; value: string; label: string };
