import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemArmorSubclass {
  Generic = 0,
  Cloth = 1,
  Leather = 2,
  Mail = 3,
  Plate = 4,
  Cosmetic = 5,
  Shield = 6,
  Libram = 7,
  Idol = 8,
  Totem = 9,
  Sigil = 10,
  Relic = 11,
}

export const ItemArmorSubclassSchema = Schema.Enums(ItemArmorSubclass);
