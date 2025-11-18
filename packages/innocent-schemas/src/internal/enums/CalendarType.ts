import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CalendarType {
  Player = 0,
  Community = 1,
  RaidLockout = 2,
  RaidResetDeprecated = 3,
  Holiday = 4,
  HolidayWeekly = 5,
  HolidayDarkmoon = 6,
  HolidayBattleground = 7,
}

export const CalendarTypeSchema = Schema.Enums(CalendarType);
