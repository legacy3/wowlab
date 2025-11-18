import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemClass {
  Consumable = 0,
  Container = 1,
  Weapon = 2,
  Gem = 3,
  Armor = 4,
  Reagent = 5,
  Projectile = 6,
  Tradegoods = 7,
  ItemEnhancement = 8,
  Recipe = 9,
  CurrencyTokenObsolete = 10,
  Quiver = 11,
  Questitem = 12,
  Key = 13,
  PermanentObsolete = 14,
  Miscellaneous = 15,
  Glyph = 16,
  Battlepet = 17,
  WoWToken = 18,
  Profession = 19,
}

export const ItemClassSchema = Schema.Enums(ItemClass);
