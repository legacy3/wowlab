/**
 * Shared WoW game data for the rotation editor.
 * Mock data with realistic spell information from DBC.
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SpellData {
  id: number;
  name: string;
  label: string;
  iconName: string;
  cooldown?: number; // in seconds
  charges?: number;
  duration?: number; // in seconds
  cost?: number; // focus cost
  costType?: "focus" | "mana";
  range?: number; // in yards
  description: string;
}

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
// BM Hunter Spells (Full Data)
// -----------------------------------------------------------------------------

/** BM Hunter spells with full data from DBC */
export const BM_HUNTER_SPELL_DATA: SpellData[] = [
  {
    id: 34026,
    name: "kill_command",
    label: "Kill Command",
    iconName: "ability_hunter_killcommand",
    cooldown: 7.5,
    cost: 30,
    costType: "focus",
    range: 50,
    description:
      "Give the command to kill, causing your pet to savagely deal Physical damage to the enemy.",
  },
  {
    id: 19574,
    name: "bestial_wrath",
    label: "Bestial Wrath",
    iconName: "ability_druid_ferociousbite",
    cooldown: 90,
    duration: 15,
    range: 100,
    description:
      "Sends you and your pet into a rage, increasing all damage you both deal by 25% for 15 sec.",
  },
  {
    id: 217200,
    name: "barbed_shot",
    label: "Barbed Shot",
    iconName: "ability_hunter_barbedshot",
    cooldown: 18,
    charges: 2,
    duration: 12,
    range: 40,
    description:
      "Fire a shot that tears through your enemy, causing them to bleed and sending your pet into a frenzy.",
  },
  {
    id: 193455,
    name: "cobra_shot",
    label: "Cobra Shot",
    iconName: "ability_hunter_cobrashot",
    cost: 35,
    costType: "focus",
    range: 40,
    description:
      "A quick shot causing Physical damage. Reduces the cooldown of Kill Command.",
  },
  {
    id: 359844,
    name: "call_of_the_wild",
    label: "Call of the Wild",
    iconName: "ability_hunter_callofthewild",
    cooldown: 120,
    duration: 20,
    range: 40,
    description:
      "Sound the call of the wild, summoning your active pets to assault your target.",
  },
  {
    id: 53351,
    name: "kill_shot",
    label: "Kill Shot",
    iconName: "ability_hunter_assassinate2",
    cooldown: 10,
    charges: 1,
    cost: 10,
    costType: "focus",
    range: 40,
    description:
      "Attempt to finish off a wounded target. Only usable on enemies with less than 20% health.",
  },
  {
    id: 120679,
    name: "dire_beast",
    label: "Dire Beast",
    iconName: "ability_hunter_longevity",
    description:
      "Damage from your bleed effects has a chance of attracting a powerful wild beast.",
  },
  {
    id: 321530,
    name: "bloodshed",
    label: "Bloodshed",
    iconName: "ability_druid_primaltenacity",
    cooldown: 60,
    range: 50,
    description:
      "Command your pets to tear into your target, causing your target to bleed.",
  },
  {
    id: 2643,
    name: "multi_shot",
    label: "Multi-Shot",
    iconName: "ability_upgrademoonglaive",
    cost: 40,
    costType: "focus",
    range: 40,
    description:
      "Fires several missiles, hitting all nearby enemies and triggering Beast Cleave.",
  },
  {
    id: 193530,
    name: "aspect_of_the_wild",
    label: "Aspect of the Wild",
    iconName: "spell_nature_protectionformnature",
    cooldown: 120,
    duration: 20,
    range: 40,
    description:
      "Fire off a Cobra Shot at your current target and nearby enemies. Reduces Cobra Shot Focus cost.",
  },
];

/** Spell lookup by ID */
export function getSpellById(id: number): SpellData | undefined {
  return BM_HUNTER_SPELL_DATA.find((s) => s.id === id);
}

/** Spell lookup by internal name */
export function getSpellByName(name: string): SpellData | undefined {
  return BM_HUNTER_SPELL_DATA.find((s) => s.name === name);
}

/** Convert SpellData to tooltip format for SpellTooltip component */
export function toTooltipData(spell: SpellData) {
  return {
    name: spell.label,
    castTime: "Instant",
    cooldown: spell.cooldown ? `${spell.cooldown} sec` : undefined,
    cost: spell.cost ? `${spell.cost} ${spell.costType ?? "Focus"}` : undefined,
    range: spell.range ? `${spell.range} yd range` : undefined,
    description: spell.description,
    iconName: spell.iconName,
  };
}

// -----------------------------------------------------------------------------
// Spell Options (simplified formats for UI components)
// -----------------------------------------------------------------------------

/** BM Hunter spells as name/label pairs */
export const BM_HUNTER_SPELLS: ReadonlyArray<{ name: string; label: string }> =
  BM_HUNTER_SPELL_DATA.map((s) => ({
    name: s.name,
    label: s.label,
  }));

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
