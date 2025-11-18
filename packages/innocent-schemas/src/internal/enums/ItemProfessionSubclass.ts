import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemProfessionSubclass {
  Blacksmithing = 0,
  Leatherworking = 1,
  Alchemy = 2,
  Herbalism = 3,
  Cooking = 4,
  Mining = 5,
  Tailoring = 6,
  Engineering = 7,
  Enchanting = 8,
  Fishing = 9,
  Skinning = 10,
  Jewelcrafting = 11,
  Inscription = 12,
  Archaeology = 13,
}

export const ItemProfessionSubclassSchema = Schema.Enums(
  ItemProfessionSubclass,
);
