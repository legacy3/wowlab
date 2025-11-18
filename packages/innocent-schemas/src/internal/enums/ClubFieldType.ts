import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ClubFieldType {
  ClubName = 0,
  ClubShortName = 1,
  ClubDescription = 2,
  ClubBroadcast = 3,
  ClubStreamName = 4,
  ClubStreamSubject = 5,
  NumTypes = 6,
}

export const ClubFieldTypeSchema = Schema.Enums(ClubFieldType);
