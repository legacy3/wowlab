import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ReportType {
  Chat = 0,
  InWorld = 1,
  ClubFinderPosting = 2,
  ClubFinderApplicant = 3,
  GroupFinderPosting = 4,
  GroupFinderApplicant = 5,
  ClubMember = 6,
  GroupMember = 7,
  Friend = 8,
  Pet = 9,
  BattlePet = 10,
  Calendar = 11,
  Mail = 12,
  PvP = 13,
  PvPScoreboard = 14,
  PvPGroupMember = 15,
  CraftingOrder = 16,
  RecentAlly = 17,
}

export const ReportTypeSchema = Schema.Enums(ReportType);
