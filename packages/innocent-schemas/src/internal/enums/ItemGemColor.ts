import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ItemGemColor {
  Meta = 1,
  Red = 2,
  Yellow = 4,
  Blue = 8,
  Hydraulic = 16,
  Cogwheel = 32,
  Iron = 64,
  Blood = 128,
  Shadow = 256,
  Fel = 512,
  Arcane = 1024,
  Frost = 2048,
  Fire = 4096,
  Water = 8192,
  Life = 16384,
  Wind = 32768,
  Holy = 65536,
  PunchcardRed = 131072,
  PunchcardYellow = 262144,
  PunchcardBlue = 524288,
  DominationBlood = 1048576,
  DominationFrost = 2097152,
  DominationUnholy = 4194304,
  Cypher = 8388608,
  Tinker = 16777216,
  Primordial = 33554432,
  Fragrance = 67108864,
  SingingThunder = 134217728,
  SingingSea = 268435456,
  SingingWind = 536870912,
  Fiber = 1073741824,
}

export const ItemGemColorSchema = Schema.Enums(ItemGemColor);
