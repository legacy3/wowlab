import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TraitNodeEntryType {
  SpendHex = 0,
  SpendSquare = 1,
  SpendCircle = 2,
  SpendSmallCircle = 3,
  DeprecatedSelect = 4,
  DragAndDrop = 5,
  SpendDiamond = 6,
  ProfPath = 7,
  ProfPerk = 8,
  ProfPathUnlock = 9,
  SpendInfinite = 10,
}

export const TraitNodeEntryTypeSchema = Schema.Enums(TraitNodeEntryType);
