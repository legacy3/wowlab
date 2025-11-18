import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CalendarEventBits {
  Player = 1,
  GuildDeprecated = 2,
  System = 4,
  Holiday = 8,
  Locked = 16,
  AutoApprove = 32,
  CommunityAnnouncement = 64,
  RaidLockout = 128,
  ArenaDeprecated = 256,
  RaidResetDeprecated = 512,
  CommunitySignup = 1024,
  GuildSignup = 2048,
  CommunityWide = 3136,
  PlayerCreated = 3395,
  CantComplain = 3788,
}

export const CalendarEventBitsSchema = Schema.Enums(CalendarEventBits);
