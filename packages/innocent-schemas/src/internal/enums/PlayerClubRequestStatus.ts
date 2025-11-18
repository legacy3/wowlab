import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PlayerClubRequestStatus {
  None = 0,
  Pending = 1,
  AutoApproved = 2,
  Declined = 3,
  Approved = 4,
  Joined = 5,
  JoinedAnother = 6,
  Canceled = 7,
}

export const PlayerClubRequestStatusSchema = Schema.Enums(
  PlayerClubRequestStatus,
);
