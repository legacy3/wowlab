import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ClubFinderClubPostingStatusFlags {
  None = 0,
  NeedsCacheUpdate = 1,
  ForceDescriptionChange = 2,
  ForceNameChange = 3,
  UnderReview = 4,
  Banned = 5,
  FakePost = 6,
  PendingDelete = 7,
  PostDelisted = 8,
}

export const ClubFinderClubPostingStatusFlagsSchema = Schema.Enums(
  ClubFinderClubPostingStatusFlags,
);
