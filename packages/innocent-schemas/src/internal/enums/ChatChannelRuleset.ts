import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ChatChannelRuleset {
  None = 0,
  Mentor = 1,
  Disabled = 2,
  ChromieTimeCataclysm = 3,
  ChromieTimeBuringCrusade = 4,
  ChromieTimeWrath = 5,
  ChromieTimeMists = 6,
  ChromieTimeWoD = 7,
  ChromieTimeLegion = 8,
}

export const ChatChannelRulesetSchema = Schema.Enums(ChatChannelRuleset);
