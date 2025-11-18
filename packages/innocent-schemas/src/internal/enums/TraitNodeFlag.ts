import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TraitNodeFlag {
  ShowMultipleIcons = 1,
  NeverPurchasable = 2,
  TestPositionLocked = 4,
  TestGridPositioned = 8,
  ActiveAtFirstRank = 16,
  ShowExpandedSelection = 32,
  HideMaxRank = 64,
}

export const TraitNodeFlagSchema = Schema.Enums(TraitNodeFlag);
