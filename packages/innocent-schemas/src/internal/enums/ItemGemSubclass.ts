import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemGemSubclass {
  Intellect = 0,
  Agility = 1,
  Strength = 2,
  Stamina = 3,
  Spirit = 4,
  Criticalstrike = 5,
  Mastery = 6,
  Haste = 7,
  Versatility = 8,
  Other = 9,
  Multiplestats = 10,
  Artifactrelic = 11,
}

export const ItemGemSubclassSchema = Schema.Enums(ItemGemSubclass);
