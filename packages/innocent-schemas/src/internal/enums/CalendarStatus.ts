import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CalendarStatus {
  Invited = 0,
  Available = 1,
  Declined = 2,
  Confirmed = 3,
  Out = 4,
  Standby = 5,
  Signedup = 6,
  NotSignedup = 7,
  Tentative = 8,
}

export const CalendarStatusSchema = Schema.Enums(CalendarStatus);
