import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum LFGSlotInvalidReason {
  None = 0,
  ExpansionTooLow = 1,
  LevelTooLow = 2,
  LevelTooHigh = 3,
  GearTooLow = 4,
  GearTooHigh = 5,
  RaidLocked = 6,
  LevelTargetTooLow = 7,
  LevelTargetTooHigh = 8,
  AreaNotExplored = 9,
  WrongFaction = 10,
  NoValidRoles = 11,
  EngagedInPvP = 12,
  NoSpec = 13,
  CannotRunAnyChildDungeon = 14,
  Restricted = 15,
  ChromieTime = 16,
  Npe = 17,
  Timerunning = 18,
  PlayerConditionFailed = 19,
}

export const LFGSlotInvalidReasonSchema = Schema.Enums(LFGSlotInvalidReason);
