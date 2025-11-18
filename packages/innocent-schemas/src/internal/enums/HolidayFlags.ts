import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum HolidayFlags {
  IsRegionwide = 1,
  DontShowInCalendar = 2,
  DontDisplayEnd = 4,
  DontDisplayBanner = 8,
  NotAvailableClientSide = 16,
  DurationUseMinutes = 32,
  BeginEventOnlyOnStageChange = 64,
}

export const HolidayFlagsSchema = Schema.Enums(HolidayFlags);
