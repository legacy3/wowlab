import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TransmogUseErrorType {
  None = 0,
  PlayerCondition = 1,
  Skill = 2,
  Ability = 3,
  Reputation = 4,
  Holiday = 5,
  HotRecheckFailed = 6,
  Class = 7,
  Race = 8,
  Faction = 9,
  ItemProficiency = 10,
}

export const TransmogUseErrorTypeSchema = Schema.Enums(TransmogUseErrorType);
