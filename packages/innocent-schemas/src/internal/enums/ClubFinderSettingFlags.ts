import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ClubFinderSettingFlags {
  None = 0,
  Dungeons = 1,
  Raids = 2,
  PvP = 3,
  RP = 4,
  Social = 5,
  Small = 6,
  Medium = 7,
  Large = 8,
  Tank = 9,
  Healer = 10,
  Damage = 11,
  EnableListing = 12,
  MaxLevelOnly = 13,
  AutoAccept = 14,
  FactionHorde = 15,
  FactionAlliance = 16,
  FactionNeutral = 17,
  SortRelevance = 18,
  SortMemberCount = 19,
  SortNewest = 20,
  LanguageReserved1 = 21,
  LanguageReserved2 = 22,
  LanguageReserved3 = 23,
  LanguageReserved4 = 24,
  LanguageReserved5 = 25,
}

export const ClubFinderSettingFlagsSchema = Schema.Enums(
  ClubFinderSettingFlags,
);
