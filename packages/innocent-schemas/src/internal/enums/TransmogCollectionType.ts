import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TransmogCollectionType {
  None = 0,
  Head = 1,
  Shoulder = 2,
  Back = 3,
  Chest = 4,
  Shirt = 5,
  Tabard = 6,
  Wrist = 7,
  Hands = 8,
  Waist = 9,
  Legs = 10,
  Feet = 11,
  Wand = 12,
  OneHAxe = 13,
  OneHSword = 14,
  OneHMace = 15,
  Dagger = 16,
  Fist = 17,
  Shield = 18,
  Holdable = 19,
  TwoHAxe = 20,
  TwoHSword = 21,
  TwoHMace = 22,
  Staff = 23,
  Polearm = 24,
  Bow = 25,
  Gun = 26,
  Crossbow = 27,
  Warglaives = 28,
  Paired = 29,
}

export const TransmogCollectionTypeSchema = Schema.Enums(
  TransmogCollectionType,
);
