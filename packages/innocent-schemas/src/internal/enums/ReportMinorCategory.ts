import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ReportMinorCategory {
  TextChat = 1,
  Boosting = 2,
  Spam = 4,
  Afk = 8,
  IntentionallyFeeding = 16,
  BlockingProgress = 32,
  Hacking = 64,
  Botting = 128,
  Advertisement = 256,
  BTag = 512,
  GroupName = 1024,
  CharacterName = 2048,
  GuildName = 4096,
  Description = 8192,
  Name = 16384,
  HarmfulToMinors = 32768,
  Disruption = 65536,
  TerroristAndViolentExtremistContent = 131072,
  ChildSexualExploitationAndAbuse = 262144,
}

export const ReportMinorCategorySchema = Schema.Enums(ReportMinorCategory);
