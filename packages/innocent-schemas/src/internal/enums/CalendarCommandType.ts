import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CalendarCommandType {
  Create = 0,
  Invite = 1,
  Rsvp = 2,
  RemoveInvite = 3,
  RemoveEvent = 4,
  Status = 5,
  ModeratorStatus = 6,
  GetCalendar = 7,
  GetEvent = 8,
  UpdateEvent = 9,
  Complain = 10,
  Notes = 11,
}

export const CalendarCommandTypeSchema = Schema.Enums(CalendarCommandType);
