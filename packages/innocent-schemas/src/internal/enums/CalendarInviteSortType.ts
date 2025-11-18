import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CalendarInviteSortType {
  Name = 0,
  Level = 1,
  Class = 2,
  Status = 3,
  Party = 4,
  Notes = 5,
}

export const CalendarInviteSortTypeSchema = Schema.Enums(
  CalendarInviteSortType,
);
