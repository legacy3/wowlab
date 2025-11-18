import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemRecipeSubclass {
  Book = 0,
  Leatherworking = 1,
  Tailoring = 2,
  Engineering = 3,
  Blacksmithing = 4,
  Cooking = 5,
  Alchemy = 6,
  FirstAid = 7,
  Enchanting = 8,
  Fishing = 9,
  Jewelcrafting = 10,
  Inscription = 11,
}

export const ItemRecipeSubclassSchema = Schema.Enums(ItemRecipeSubclass);
