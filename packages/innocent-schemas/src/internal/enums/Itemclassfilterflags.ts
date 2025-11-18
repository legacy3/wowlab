import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum Itemclassfilterflags {
  Consumable = 1,
  Container = 2,
  Weapon = 4,
  Gem = 8,
  Armor = 16,
  Reagent = 32,
  Projectile = 64,
  Tradegoods = 128,
  ItemEnhancement = 256,
  Recipe = 512,
  CurrencyTokenObsolete = 1024,
  Quiver = 2048,
  Questitemclassfilterflags = 4096,
  Key = 8192,
  PermanentObsolete = 16384,
  Miscellaneous = 32768,
  Glyph = 65536,
  Battlepet = 131072,
}

export const ItemclassfilterflagsSchema = Schema.Enums(Itemclassfilterflags);
