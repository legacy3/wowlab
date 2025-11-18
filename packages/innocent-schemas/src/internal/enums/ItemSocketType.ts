import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemSocketType {
  None = 0,
  Meta = 1,
  Red = 2,
  Yellow = 3,
  Blue = 4,
  Hydraulic = 5,
  Cogwheel = 6,
  Prismatic = 7,
  Iron = 8,
  Blood = 9,
  Shadow = 10,
  Fel = 11,
  Arcane = 12,
  Frost = 13,
  Fire = 14,
  Water = 15,
  Life = 16,
  Wind = 17,
  Holy = 18,
  PunchcardRed = 19,
  PunchcardYellow = 20,
  PunchcardBlue = 21,
  Domination = 22,
  Cypher = 23,
  Tinker = 24,
  Primordial = 25,
  Fragrance = 26,
  SingingThunder = 27,
  SingingSea = 28,
  SingingWind = 29,
  Fiber = 30,
}

export const ItemSocketTypeSchema = Schema.Enums(ItemSocketType);
